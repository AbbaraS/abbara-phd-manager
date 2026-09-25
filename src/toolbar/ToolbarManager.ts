import { Editor, MarkdownView } from 'obsidian';
import type ProjectManagerPlugin from '../main';
import { isManagedNote } from '../utils/dailyNotes';
import { visibleRoles } from '../models/resolve';
import { buildBadgeIndex } from '../models/badgeIndex';
import { newTaskId } from '../utils/ids';
import { TaskChoice, buildTaskLine } from '../tasks/taskLine';
import { insertTask, insertTaskAt } from '../tasks/insertTask';
import { orderedSpot } from '../tasks/orderedSpot';
import { readTask } from '../tasks/readTask';
import { showFilterMenu } from '../filter/filterMenu';
import { CreateProject, pickTask } from './pickTask';
import { NewProjectModal } from './NewProjectModal';
import { renderToolbar, TOOLBAR_CLASS } from './renderToolbar';
import { PINNED_CLASS } from '../today/PinnedToday';

// Class on a note's container while completed tasks are hidden (used by reading view CSS).
const HIDE_DONE_CLASS = 'apm-hide-done';

// Adds and removes the role toolbar on open markdown notes.
export class ToolbarManager {
	constructor(private plugin: ProjectManagerPlugin) {}

	// Start listening for note changes and filter changes.
	register(): void {
		const { workspace } = this.plugin.app;
		this.plugin.registerEvent(workspace.on('file-open', () => this.refresh()));
		this.plugin.registerEvent(workspace.on('layout-change', () => this.refresh()));
		this.plugin.registerEvent(this.plugin.filter.on('changed', () => this.refresh()));
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
		document.querySelectorAll(`.${HIDE_DONE_CLASS}`).forEach((el) => el.removeClass(HIDE_DONE_CLASS));
	}

	// Replace this view's toolbar, or leave it off if the note does not qualify.
	private update(view: MarkdownView): void {
		const { plugin } = this;
		const { filter, settings } = plugin;
		view.containerEl.querySelector(`:scope > .${TOOLBAR_CLASS}`)?.remove();
		const show = this.shouldShow(view);
		view.containerEl.toggleClass(HIDE_DONE_CLASS, show && filter.hideDone);
		if (!show) return;

		const bar = renderToolbar({
			roles: visibleRoles(settings.roles),
			hideDone: filter.hideDone,
			filterNames: settings.roles.filter((r) => filter.roles.has(r.id)).map((r) => r.name),
			onRoleClick: (evt, role) => pickTask(evt, role, this.createProject, (choice) => this.addTask(view.editor, choice)),
			onToggleDone: () => filter.toggleDone(),
			onFilter: (evt) => showFilterMenu(evt, settings.roles, filter),
			onSort: () => plugin.sorter.sortEditor(view.editor),
		});
		// Sit between the note header and its content (above the pinned Today panel, if any).
		const below = view.containerEl.querySelector<HTMLElement>(`:scope > .${PINNED_CLASS}`) ?? view.contentEl;
		view.containerEl.insertBefore(bar, below);
	}

	// Add the picked task: at its role/project spot in the list, or at the cursor.
	private addTask(editor: Editor, choice: TaskChoice): void {
		const line = buildTaskLine(choice, newTaskId());
		if (!this.plugin.settings.insertInOrder) return insertTask(editor, line);

		const index = buildBadgeIndex(this.plugin.settings.roles);
		const spot = orderedSpot(
			editor.getValue().split('\n'),
			line,
			this.plugin.sorter.keyMaker(),
			(text) => readTask(text, index) !== null,
			editor.getCursor().line,
		);
		if (spot === null) insertTask(editor, line);
		else insertTaskAt(editor, line, spot);
	}

	// "New project…": popup, save, then carry on picking the task's type.
	private createProject: CreateProject = (role, then) => {
		new NewProjectModal(this.plugin.app, role, (project) => {
			role.projects.push(project);
			void this.plugin.saveSettings().then(() => then(project));
		}).open();
	};

	// Daily notes only (unless the setting says every note), and only with a visible role.
	private shouldShow(view: MarkdownView): boolean {
		if (!visibleRoles(this.plugin.settings.roles).length) return false;
		return isManagedNote(this.plugin.app, view.file, this.plugin.settings.dailyNotesOnly);
	}
}
