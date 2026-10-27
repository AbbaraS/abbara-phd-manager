import { setIcon } from 'obsidian';
import { buildBadgeIndex } from '../../models/badgeIndex';
import { buildTaskRows, scheduledRows, type TaskRow } from '../../models/taskRows';
import { setTaskMark } from '../../tasks/noteEdit';
import { PRIORITIES } from '../../tasks/taskDates';
import { setIconOrEmoji } from '../../utils/icon';
import { shortDate, slashDate, timeOfStamp, todayIso } from '../../utils/dates';
import type { DashboardContext } from '../DashboardContext';
import { optionBadge, projectBadge, roleBadge } from '../look/badges';
import { newTaskForm } from './newTaskForm';

const COLUMNS = ['', 'Task', 'Priority', 'Due', 'Created on', 'Completed on'];

// Rank for sorting: open tasks (by priority, due date, age), then done ones (newest first), then cancelled.
function compareRows(a: TaskRow, b: TaskRow): number {
	const order = { open: 0, done: 1, cancelled: 2 };
	if (a.state !== b.state) return order[a.state] - order[b.state];
	if (a.state === 'done') return (b.completed ?? '').localeCompare(a.completed ?? '');
	const rank = (r: TaskRow) => (r.priority ? PRIORITIES.findIndex((p) => p.id === r.priority) : PRIORITIES.length);
	const date = (x?: string) => x || '9999';
	return rank(a) - rank(b) || date(a.due).localeCompare(date(b.due)) || (a.created ?? '').localeCompare(b.created ?? '');
}

// "26/10/2026 14:05", or just the day when the time isn't known.
const stampText = (stamp?: string) => (stamp ? `${slashDate(stamp.slice(0, 10))} ${timeOfStamp(stamp)}`.trim() : '');

// The add-task form, role filter, and a table of every task grouped by role then project.
export function tasksSection(el: HTMLElement, ctx: DashboardContext): void {
	const { plugin, settings } = ctx;
	newTaskForm(el, ctx);

	const index = buildBadgeIndex(settings.roles);
	const found = buildTaskRows(plugin.tasks.entries(), index, settings.taskMeta);
	const rows = [...found, ...scheduledRows(settings.scheduledTasks, index, settings.taskMeta, new Set(found.map((r) => r.key)))];

	// Filters: role chips and the completed-tasks eye.
	const bar = el.createDiv({ cls: 'apm-taskbar' });
	for (const role of settings.roles.filter((r) => rows.some((x) => x.role === r))) {
		const chip = bar.createEl('button', { cls: 'apm-rolechip' });
		chip.style.setProperty('--apm-role-color', role.color);
		chip.toggleClass('is-active', ctx.filterRoles.has(role.id));
		chip.toggleClass('is-dimmed', ctx.filterRoles.size > 0 && !ctx.filterRoles.has(role.id));
		setIconOrEmoji(chip.createSpan({ cls: 'apm-role-icon' }), role.icon);
		chip.createSpan({ text: role.name });
		chip.addEventListener('click', () => {
			if (!ctx.filterRoles.delete(role.id)) ctx.filterRoles.add(role.id);
			ctx.redraw();
		});
	}
	const eye = bar.createEl('button', { cls: 'apm-tool-button clickable-icon', attr: { 'aria-label': settings.dashHideDone ? 'Show completed tasks' : 'Hide completed tasks' } });
	eye.toggleClass('is-active', settings.dashHideDone);
	setIcon(eye, settings.dashHideDone ? 'eye-off' : 'eye');
	eye.addEventListener('click', () => {
		settings.dashHideDone = !settings.dashHideDone;
		ctx.saveLayout();
	});

	// Table.
	const shown = rows.filter((r) => (!ctx.filterRoles.size || ctx.filterRoles.has(r.role.id)) && !(settings.dashHideDone && r.state !== 'open'));
	if (!shown.length) {
		el.createDiv({ cls: 'apm-muted', text: 'No tasks to show.' });
		return;
	}
	const table = el.createEl('table', { cls: 'apm-tasks' });
	const head = table.createTHead().createEl('tr');
	COLUMNS.forEach((c) => head.createEl('th', { text: c }));
	const body = table.createTBody();

	for (const role of settings.roles) {
		const ofRole = shown.filter((r) => r.role === role);
		if (!ofRole.length) continue;
		const roleOpen = !settings.dashCollapsedGroups.includes(role.id);
		groupRow(body, ctx, role.id, 'apm-role-row', ofRole, roleOpen, (cell) => roleBadge(cell, plugin, role), role.color);
		if (!roleOpen) continue;

		// Role-only tasks first, then each project in settings order.
		for (const project of [undefined, ...role.projects]) {
			const group = ofRole.filter((r) => r.project === project).sort(compareRows);
			if (!group.length) continue;
			const key = `${role.id}/${project?.id ?? ''}`;
			const open = !settings.dashCollapsedGroups.includes(key);
			if (project) groupRow(body, ctx, key, 'apm-project-row', group, open, (cell) => projectBadge(cell, plugin, role, project), role.color);
			if (open) group.forEach((row) => taskRow(body, ctx, row));
		}
	}
}

// A role or project heading row: click to fold the group; shows done / total.
function groupRow(body: HTMLElement, ctx: DashboardContext, key: string, cls: string, rows: TaskRow[], open: boolean, badge: (cell: HTMLElement) => void, color: string): void {
	const tr = body.createEl('tr', { cls, attr: { tabindex: '0' } });
	tr.style.setProperty('--apm-role-color', color);
	const cell = tr.createEl('td', { attr: { colspan: String(COLUMNS.length) } });
	setIcon(cell.createSpan({ cls: 'apm-chev' }), open ? 'chevron-down' : 'chevron-right');
	badge(cell);
	const done = rows.filter((r) => r.state === 'done').length;
	cell.createSpan({ cls: 'apm-muted apm-group-count', text: `${done}/${rows.length} done` });
	const toggle = () => {
		const s = ctx.settings;
		s.dashCollapsedGroups = open ? [...s.dashCollapsedGroups, key] : s.dashCollapsedGroups.filter((k) => k !== key);
		ctx.saveLayout();
	};
	tr.addEventListener('click', toggle);
	tr.addEventListener('keydown', (e) => { if (e.key === 'Enter') toggle(); });
}

// One task: tick box, badges and text like a daily note line, then priority, due, created and completed.
function taskRow(body: HTMLElement, ctx: DashboardContext, row: TaskRow): void {
	const { plugin } = ctx;
	const tr = body.createEl('tr', { cls: 'apm-task' });
	tr.toggleClass('is-done', row.state === 'done');
	tr.toggleClass('is-cancelled', row.state === 'cancelled');

	const check = tr.createEl('td', { cls: 'apm-task-check' }).createEl('input', { type: 'checkbox' });
	check.checked = row.state === 'done';
	check.disabled = !row.path || row.state === 'cancelled';
	check.addEventListener('change', () => void setTaskMark(plugin, row, check.checked ? 'x' : ' '));

	const main = tr.createEl('td', { cls: 'apm-task-main' });
	optionBadge(main, plugin, row.typeKey);
	optionBadge(main, plugin, row.statusKey);
	main.createSpan({ cls: 'apm-task-title', text: row.title });
	if (row.scheduledFor) main.createSpan({ cls: 'apm-scheduled', text: `Starts ${shortDate(row.scheduledFor)}` });

	const prio = PRIORITIES.find((p) => p.id === row.priority);
	tr.createEl('td', { cls: 'apm-task-prio', text: prio ? `${prio.emoji} ${prio.name}` : '' });
	const due = tr.createEl('td', { cls: 'apm-task-date', text: row.due ? slashDate(row.due) : '' });
	due.toggleClass('is-overdue', !!row.due && row.due < todayIso() && row.state === 'open');
	tr.createEl('td', { cls: 'apm-task-date', text: stampText(row.created) });
	tr.createEl('td', { cls: 'apm-task-date', text: stampText(row.completed) });
}
