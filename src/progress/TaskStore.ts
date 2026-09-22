import { Events, Plugin, TAbstractFile, TFile, debounce } from 'obsidian';
import { BadgeEntry } from '../models/badgeIndex';
import { scanTasks } from './scanTasks';
import { NoteTasks, Progress, countProgress } from './countProgress';

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
			this.notes.set(file.path, note);
		}));
	}

	// Done / total per project badge key.
	progress(index: Map<string, BadgeEntry>): Map<string, Progress> {
		return countProgress(this.notes.values(), index);
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
		this.notes.set(file.path, { time: file.stat.mtime, tasks });
		this.changed();
	}
}
