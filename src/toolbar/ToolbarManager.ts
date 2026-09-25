import { MarkdownView } from 'obsidian';
import type ProjectManagerPlugin from '../main';
import { isDailyNote } from '../utils/dailyNotes';
import { visibleRoles } from '../models/resolve';
import { newTaskId } from '../utils/ids';
import { buildTaskLine } from '../tasks/taskLine';
import { insertTask } from '../tasks/insertTask';
import { CreateProject, pickTask } from './pickTask';
import { NewProjectModal } from './NewProjectModal';
import { renderToolbar, TOOLBAR_CLASS } from './renderToolbar';

// Adds and removes the role toolbar on open markdown notes.
export class ToolbarManager {
	constructor(private plugin: ProjectManagerPlugin) {}

	// Start listening for note changes.
	register(): void {
		const { workspace } = this.plugin.app;
		this.plugin.registerEvent(workspace.on('file-open', () => this.refresh()));
		this.plugin.registerEvent(workspace.on('layout-change', () => this.refresh()));
		workspace.onLayoutReady(() => this.refresh());
	}

	// Redraw the toolbar on every open markdown note.
	refresh(): void {
		this.plugin.app.workspace.getLeavesOfType('markdown').forEach((leaf) => {
			if (leaf.view instanceof MarkdownView) this.update(leaf.view);
		});
	}

	// Remove every toolbar (used on unload).
	removeAll(): void {
		document.querySelectorAll(`.${TOOLBAR_CLASS}`).forEach((el) => el.remove());
	}

	// Replace this view's toolbar, or leave it off if the note does not qualify.
	private update(view: MarkdownView): void {
		view.containerEl.querySelector(`:scope > .${TOOLBAR_CLASS}`)?.remove();
		if (!this.shouldShow(view)) return;

		const bar = renderToolbar(
			visibleRoles(this.plugin.settings.roles),
			(evt, role) => pickTask(evt, role, this.createProject, (choice) => insertTask(view.editor, buildTaskLine(choice, newTaskId()))),
			() => this.plugin.sorter.sortEditor(view.editor),
		);
		// Sit between the note header and its content.
		view.containerEl.insertBefore(bar, view.contentEl);
	}

	// "New project…": popup, save, then carry on picking the task's type.
	private createProject: CreateProject = (role, then) => {
		new NewProjectModal(this.plugin.app, role, async (project) => {
			role.projects.push(project);
			await this.plugin.saveSettings();
			then(project);
		}).open();
	};

	// Daily notes only (unless the setting says every note), and only with a visible role.
	private shouldShow(view: MarkdownView): boolean {
		if (!visibleRoles(this.plugin.settings.roles).length) return false;
		return !this.plugin.settings.dailyNotesOnly || isDailyNote(this.plugin.app, view.file);
	}
}
