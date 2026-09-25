import { Events, MarkdownView } from 'obsidian';
import type ProjectManagerPlugin from '../main';
import { BadgeEntry, buildBadgeIndex } from '../models/badgeIndex';
import { readTask } from '../tasks/readTask';
import { isTaskLine } from '../tasks/taskBadges';
import { isManagedNote } from '../utils/dailyNotes';
import { editorViewOf } from '../utils/editorView';
import { LineTask } from './planTaskList';
import { TaskListContext, refreshTaskList, taskListField } from './taskListField';

const MARK = /^\s*[-*+] \[(.)\]/;

// "Hide completed" (saved) and the role filter (this session only), shared by every managed note.
// Fires "changed" so the toolbar and Today panels can show the current state.
export class TaskFilter extends Events {
	readonly roles = new Set<string>(); // show only these roles (empty = all)
	private index = new Map<string, BadgeEntry>();

	constructor(private plugin: ProjectManagerPlugin) {
		super();
	}

	// Editor extension, commands, and redraws when notes open.
	register(): void {
		const { plugin } = this;
		this.rolesChanged();
		plugin.registerEditorExtension(taskListField(() => this.context()));

		plugin.addCommand({ id: 'toggle-completed', name: 'Hide / show completed tasks', callback: () => this.toggleDone() });
		plugin.addCommand({ id: 'show-all-roles', name: 'Show tasks from all roles', callback: () => this.showAll() });

		// A leaf can switch notes without a new editor, so redraw whenever the layout changes.
		plugin.registerEvent(plugin.app.workspace.on('file-open', () => this.refreshEditors()));
		plugin.registerEvent(plugin.app.workspace.on('layout-change', () => this.refreshEditors()));
	}

	get hideDone(): boolean {
		return this.plugin.settings.hideCompleted;
	}

	// Role groups folded into their divider (saved).
	get collapsed(): ReadonlySet<string> {
		return new Set(this.plugin.settings.collapsedRoles);
	}

	// Divider chevron: fold a role's group away, or open it again. Remembered across restarts.
	toggleCollapse(role: string): void {
		const list = this.plugin.settings.collapsedRoles;
		this.plugin.settings.collapsedRoles = list.includes(role) ? list.filter((r) => r !== role) : [...list, role];
		void this.plugin.saveOptions();
		this.refreshEditors();
	}

	// Eye button: hide or show ticked and cancelled tasks, remembered across restarts.
	toggleDone(): void {
		this.plugin.settings.hideCompleted = !this.hideDone;
		void this.plugin.saveOptions();
		this.changed();
	}

	// Filter menu: add or remove one role.
	toggleRole(role: string): void {
		if (!this.roles.delete(role)) this.roles.add(role);
		this.changed();
	}

	// Chip or divider click: show only `role`, or everything if it's already the only one.
	showOnly(role: string): void {
		const already = this.roles.size === 1 && this.roles.has(role);
		this.roles.clear();
		if (!already) this.roles.add(role);
		this.changed();
	}

	// Clear the role filter.
	showAll(): void {
		if (!this.roles.size) return;
		this.roles.clear();
		this.changed();
	}

	// Roles or settings changed: rebuild the badge lookup and redraw.
	rolesChanged(): void {
		this.index = buildBadgeIndex(this.plugin.settings.roles);
		const ids = new Set(this.plugin.settings.roles.map((r) => r.id));
		[...this.roles].filter((id) => !ids.has(id)).forEach((id) => this.roles.delete(id));
		this.refreshEditors();
	}

	// Ask every open editor to redraw its hidden lines and dividers.
	refreshEditors(): void {
		this.plugin.app.workspace.getLeavesOfType('markdown').forEach((leaf) => {
			if (leaf.view instanceof MarkdownView) editorViewOf(leaf.view.editor)?.dispatch({ effects: refreshTaskList.of(null) });
		});
	}

	// Tell editors, toolbars and panels.
	private changed(): void {
		this.refreshEditors();
		this.trigger('changed');
	}

	// Role and state of a task line, or null if it's not a task.
	private taskOf = (line: string): LineTask | null => {
		if (!isTaskLine(line)) return null;
		const mark = MARK.exec(line)?.[1] ?? ' ';
		const state = 'xX'.includes(mark) ? 'done' : mark === '-' ? 'cancelled' : 'open';
		return { role: readTask(line, this.index)?.role.id ?? '', state };
	};

	// What the editor extension reads on each redraw.
	private context(): TaskListContext {
		const { app, settings } = this.plugin;
		return {
			applies: (file) => isManagedNote(app, file, settings.dailyNotesOnly),
			hideDone: this.hideDone,
			roles: this.roles,
			dividers: settings.roleDividers,
			collapsed: this.collapsed,
			taskOf: this.taskOf,
			lookOf: (id) => {
				const role = settings.roles.find((r) => r.id === id);
				return role
					? { role: id, name: role.name, icon: role.icon, color: role.color }
					: { role: '', name: 'Other', icon: 'circle-dashed', color: '#888888' };
			},
			actions: {
				onFilter: (id) => this.showOnly(id),
				onToggle: (id) => this.toggleCollapse(id),
			},
		};
	}
}
