import { Events, Plugin, TAbstractFile, TFile, debounce, moment } from 'obsidian';
import { BadgeEntry } from '../models/badgeIndex';
import { TaskRecord, scanTasks } from './scanTasks';
import { NoteTasks, Progress, countProgress } from './countProgress';
import { firstSeenDates } from '../sort/firstSeen';
import { dailyNoteDate } from '../utils/dailyNotes';

// Keeps every badge task in the vault indexed, and fires "updated" when anything changes.
export class TaskStore extends Events {
	private notes = new Map<string, NoteTasks>(); // path -> tasks in that note

	constructor(private plugin: Plugin) {
		super();
	}

	// Tell listeners, batching bursts of edits.
	changed = debounce(() => this.trigger('updated'), 300, true);

	// Index the vault once it is ready, then follow edits, deletes and renames.
	register(): void {
		const { app } = this.plugin;
		app.workspace.onLayoutReady(() => void this.scanAll());
		this.plugin.registerEvent(app.metadataCache.on('changed', (file, data) => this.setNote(file, data)));
		this.plugin.registerEvent(app.vault.on('delete', (file) => {
			if (this.notes.delete(file.path)) this.changed();
		}));
		this.plugin.registerEvent(app.vault.on('rename', (file: TAbstractFile, oldPath: string) => {
			const note = this.notes.get(oldPath);
			if (!note) return;
			this.notes.delete(oldPath);
			if (file instanceof TFile) note.date = this.dateOf(file);
			this.notes.set(file.path, note);
		}));
	}

	// Done / total per project badge key.
	progress(index: Map<string, BadgeEntry>): Map<string, Progress> {
		return countProgress(this.notes.values(), index);
	}

	// Badge tasks in one note ([] if none).
	tasksIn(path: string): TaskRecord[] {
		return this.notes.get(path)?.tasks ?? [];
	}

	// Day each task was first written down, by copy key (see sort/firstSeen.ts).
	firstSeen(): Map<string, string> {
		return firstSeenDates(this.notes.values());
	}

	// Read every note that has tasks.
	private async scanAll(): Promise<void> {
		const { vault, metadataCache } = this.plugin.app;
		for (const file of vault.getMarkdownFiles()) {
			// Skip notes the cache knows have no tasks.
			const cache = metadataCache.getFileCache(file);
			if (cache && !cache.listItems?.some((item) => item.task !== undefined)) continue;
			this.setNote(file, await vault.cachedRead(file));
		}
		this.changed();
	}

	// Re-index one note from its text.
	private setNote(file: TFile, text: string): void {
		const tasks = scanTasks(text);
		if (!tasks.length) {
			if (this.notes.delete(file.path)) this.changed();
			return;
		}
		this.notes.set(file.path, { time: file.stat.mtime, date: this.dateOf(file), tasks });
		this.changed();
	}

	// Daily note day from the file name (reliable after copying a vault), else the file's creation day.
	private dateOf(file: TFile): string {
		return dailyNoteDate(this.plugin.app, file) ?? moment(file.stat.ctime).format('YYYY-MM-DD');
	}
}
