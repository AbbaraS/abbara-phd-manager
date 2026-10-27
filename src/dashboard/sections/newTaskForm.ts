import { Notice } from 'obsidian';
import { typesFor, visibleProjects, visibleRoles } from '../../models/resolve';
import { PRIORITIES, Priority } from '../../tasks/taskDates';
import { todayIso } from '../../utils/dates';
import type { DashboardContext } from '../DashboardContext';

// Adds a select with `options` ([value, label]) and returns it.
function select(parent: HTMLElement, label: string, options: [string, string][], value: string, onChange: (v: string) => void): HTMLSelectElement {
	const box = parent.createDiv({ cls: 'apm-field' });
	box.createEl('label', { text: label });
	const el = box.createEl('select', { cls: 'dropdown' });
	options.forEach(([v, text]) => el.createEl('option', { value: v, text }));
	el.value = value;
	el.addEventListener('change', () => onChange(el.value));
	return el;
}

// The "add a task" form: role, project, type, text, priority, due date and the day's daily note it first appears in.
// A later day keeps the task out of today's note until then; it rolls over from there like any other task.
export function newTaskForm(el: HTMLElement, ctx: DashboardContext): void {
	const { plugin, settings, form } = ctx;
	const roles = visibleRoles(settings.roles);
	if (!roles.length) return;
	const role = roles.find((r) => r.id === form.roleId) ?? roles[0];
	form.roleId = role.id;
	const project = role.projects.find((p) => p.id === form.projectId);
	if (!project) form.projectId = '';
	const types = typesFor(role, project);
	if (!types.some((t) => t.id === form.typeId)) form.typeId = '';

	const box = el.createDiv({ cls: 'apm-newtask' });
	const row = box.createDiv({ cls: 'apm-newtask-row' });
	select(row, 'Role', roles.map((r) => [r.id, r.name]), role.id, (v) => { form.roleId = v; ctx.redraw(); });
	select(row, 'Project', [['', 'No project'], ...visibleProjects(role).map((p): [string, string] => [p.id, p.name])], form.projectId, (v) => { form.projectId = v; ctx.redraw(); });
	select(row, 'Type', [['', 'No type'], ...types.map((t): [string, string] => [t.id, t.name])], form.typeId, (v) => (form.typeId = v));
	select(row, 'Priority', [['', 'None'], ...PRIORITIES.map((p): [string, string] => [p.id, `${p.emoji} ${p.name}`])], form.priority, (v) => (form.priority = v));

	const row2 = box.createDiv({ cls: 'apm-newtask-row' });
	const text = row2.createEl('input', { cls: 'apm-newtask-text', type: 'text', placeholder: 'New task…', value: form.text });
	text.addEventListener('input', () => (form.text = text.value));
	const due = dateField(row2, 'Due', form.due, (v) => (form.due = v));
	due.min = '';
	dateField(row2, 'Show in daily note of', form.date, (v) => (form.date = v || todayIso())).min = todayIso();

	const add = row2.createEl('button', { cls: 'mod-cta', text: 'Add task' });
	const submit = async () => {
		const title = form.text.trim();
		if (!title) return void new Notice('Type the task first.');
		await plugin.dailyTasks.addTask({ role, project, type: types.find((t) => t.id === form.typeId) },
			{ text: title, priority: (form.priority || undefined) as Priority | undefined, due: form.due || undefined }, form.date || todayIso());
		Object.assign(form, { text: '', priority: '', due: '', date: todayIso() });
		ctx.redraw();
	};
	add.addEventListener('click', () => void submit());
	text.addEventListener('keydown', (e) => { if (e.key === 'Enter') void submit(); });
	if (form.date > todayIso()) box.createDiv({ cls: 'apm-muted', text: 'Future task: it appears in that day\'s daily note, then rolls over until it is done.' });
}

// A labelled date box.
function dateField(parent: HTMLElement, label: string, value: string, onChange: (v: string) => void): HTMLInputElement {
	const box = parent.createDiv({ cls: 'apm-field' });
	box.createEl('label', { text: label });
	const input = box.createEl('input', { type: 'date', value });
	input.addEventListener('input', () => onChange(input.value));
	return input;
}
