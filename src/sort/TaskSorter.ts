import { Editor, TAbstractFile, TFile } from 'obsidian';
import type ProjectManagerPlugin from '../main';
import { buildBadgeIndex } from '../models/badgeIndex';
import { scanTasks } from '../progress/scanTasks';
import { isDailyNote } from '../utils/dailyNotes';
import { copyKey } from './firstSeen';
import { SortKey, sortKeyOf } from './sortKey';
import { sortEdits, sortText } from './sortLines';

// How long a new daily note keeps being sorted, so tasks Rollover adds just after creation are caught.
const NEW_NOTE_MS = 5000;

// Orders task lists by role, project, due date, then created date.
export class TaskSorter {
	private newNotes = new Map<string, number>(); // path -> time it was created

	constructor(private plugin: ProjectManagerPlugin) {}

	// Add the command and the new-daily-note hook.
	register(): void {
		const { plugin } = this;
		plugin.addCommand({
			id: 'sort-tasks',
			name: 'Sort tasks in this note',
			editorCallback: (editor) => this.sortEditor(editor),
		});

		// After layout ready: Obsidian fires "create" for every file while the vault loads.
		plugin.app.workspace.onLayoutReady(() => {
			plugin.registerEvent(plugin.app.vault.on('create', (file) => this.onCreate(file)));
			plugin.registerEvent(plugin.app.vault.on('modify', (file) => this.onModify(file)));
		});
	}

	// Sort the open note as a single undo step.
	sortEditor(editor: Editor): void {
		const lines = editor.getValue().split('\n');
		const edits = sortEdits(lines, this.keyMaker());
		if (!edits.length) return;
		editor.transaction({
			changes: edits.map((edit) => ({
				from: { line: edit.start, ch: 0 },
				to: { line: edit.end - 1, ch: lines[edit.end - 1].length },
				text: edit.lines.join('\n'),
			})),
		});
	}

	// New daily note: sort it now and on each save for a few seconds.
	private onCreate(file: TAbstractFile): void {
		if (!this.plugin.settings.sortNewDailyNotes) return;
		if (!(file instanceof TFile) || !isDailyNote(this.plugin.app, file)) return;
		this.newNotes.set(file.path, Date.now());
		void this.sortFile(file);
	}

	// Rollover (or Templater) wrote to a note we just saw created.
	private onModify(file: TAbstractFile): void {
		const created = this.newNotes.get(file.path);
		if (created === undefined || !(file instanceof TFile)) return;
		if (Date.now() - created > NEW_NOTE_MS) {
			this.newNotes.delete(file.path);
			return;
		}
		void this.sortFile(file);
	}

	// Sort a note on disk, writing only when something moves (so no modify loop).
	private async sortFile(file: TFile): Promise<void> {
		const { vault } = this.plugin.app;
		const keyOf = this.keyMaker();
		const text = await vault.read(file);
		if (sortText(text, keyOf) === text) return;
		await vault.process(file, (current) => sortText(current, keyOf));
	}

	// Key function using the current roles and the day each task was first written down.
	private keyMaker(): (line: string) => SortKey {
		const roles = this.plugin.settings.roles;
		const index = buildBadgeIndex(roles);
		const firstSeen = this.plugin.tasks.firstSeen();
		const createdOf = (line: string) => {
			const task = scanTasks(line)[0];
			return task && firstSeen.get(copyKey(task));
		};
		return (line) => sortKeyOf(line, roles, index, createdOf);
	}
}
