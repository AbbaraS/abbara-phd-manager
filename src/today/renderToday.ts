import { setIcon } from 'obsidian';
import { tooltip } from '../utils/tooltip';
import { setIconOrEmoji } from '../utils/icon';
import { Tally, totalOf } from './countToday';

// One role chip.
export interface TodayRole {
	id: string;
	name: string;
	icon: string;
	color: string;
	tally: Tally;
}

// Everything the Today panel shows and does.
export interface TodaySpec {
	title: string;          // "Today", or the note's day for older notes
	overall: Tally;
	roles: TodayRole[];     // roles with tasks in this note, in settings order
	filter: ReadonlySet<string>; // roles currently shown (empty = all)
	hideDone: boolean;
	pinned: boolean;        // panel is pinned above the note
	onToggleDone: () => void;
	onTogglePin: () => void;
	onRoleClick: (id: string) => void;
}

const pct = (t: Tally) => (totalOf(t) ? Math.round((t.done / totalOf(t)) * 100) : 0);

// Draw the panel: a summary line, then one chip per role.
export function renderToday(el: HTMLElement, spec: TodaySpec): void {
	const panel = el.createDiv({ cls: 'apm-today' });
	keepClicksInside(panel);
	if (!totalOf(spec.overall)) {
		panel.createDiv({ cls: 'apm-today-empty', text: `${spec.title}: no tasks yet. Add one from the toolbar.` });
		return;
	}
	renderSummary(panel, spec);
	const grid = panel.createDiv({ cls: 'apm-today-roles' });
	spec.roles.forEach((role) => renderRole(grid, role, spec));
}

// Line 1: title, done / added / open, an overall progress bar and the pin button.
function renderSummary(panel: HTMLElement, spec: TodaySpec): void {
	const { overall } = spec;
	const row = panel.createDiv({ cls: 'apm-today-summary' });
	row.createSpan({ cls: 'apm-today-title', text: spec.title });

	// Done, with the hide/show button beside it.
	const done = kpi(row, 'is-done', 'circle-check', String(overall.done), 'done', `/${totalOf(overall)}`);
	const eye = done.createEl('button', { cls: 'apm-today-eye clickable-icon' });
	eye.toggleClass('is-active', spec.hideDone);
	setIcon(eye, spec.hideDone ? 'eye-off' : 'eye');
	tooltip(eye, spec.hideDone ? 'Completed tasks are hidden. Click to show them.' : 'Hide completed tasks');
	eye.addEventListener('click', spec.onToggleDone);

	kpi(row, 'is-added', 'circle-plus', `+${overall.added}`, 'added');
	kpi(row, 'is-open', 'circle-dashed', String(overall.open), 'to do');

	// Overall bar.
	const meter = row.createDiv({ cls: 'apm-today-meter' });
	const bar = meter.createDiv({ cls: 'apm-today-bar', attr: { role: 'progressbar', 'aria-valuenow': String(pct(overall)) } });
	bar.createDiv({ cls: 'apm-today-fill', attr: { style: `width:${pct(overall)}%` } });
	meter.createSpan({ cls: 'apm-today-pct', text: `${pct(overall)}%` });

	// Pin: keep the panel above the note so it never scrolls away.
	const pin = row.createEl('button', { cls: 'apm-today-pin clickable-icon' });
	pin.toggleClass('is-active', spec.pinned);
	setIcon(pin, spec.pinned ? 'pin-off' : 'pin');
	tooltip(pin, spec.pinned ? 'Unpin: put the panel back in the note' : 'Pin to the top of the note');
	pin.addEventListener('click', spec.onTogglePin);
}

// One number with an icon and a word, e.g. "✓ 18/39 done".
function kpi(row: HTMLElement, cls: string, icon: string, value: string, label: string, of = ''): HTMLElement {
	const el = row.createSpan({ cls: `apm-today-kpi ${cls}` });
	setIcon(el.createSpan({ cls: 'apm-today-kpi-icon' }), icon);
	el.createSpan({ cls: 'apm-today-value', text: value });
	if (of) el.createSpan({ cls: 'apm-today-of', text: of });
	el.createSpan({ cls: 'apm-today-label', text: label });
	return el;
}

// Line 2: a chip per role with done/total, tasks added today and a thin bar. Click to filter.
function renderRole(grid: HTMLElement, role: TodayRole, spec: TodaySpec): void {
	const { tally } = role;
	const active = spec.filter.has(role.id);
	const chip = grid.createEl('button', { cls: 'apm-today-role' });
	chip.style.setProperty('--apm-role-color', role.color);
	chip.toggleClass('is-active', active);
	chip.toggleClass('is-dimmed', spec.filter.size > 0 && !active);

	const top = chip.createDiv({ cls: 'apm-today-role-top' });
	setIconOrEmoji(top.createSpan({ cls: 'apm-today-role-icon' }), role.icon);
	top.createSpan({ cls: 'apm-today-role-name', text: role.name });
	const count = top.createSpan({ cls: 'apm-today-role-count' });
	count.createSpan({ cls: 'apm-today-value', text: String(tally.done) });
	count.appendText(`/${totalOf(tally)}`);
	if (tally.added) top.createSpan({ cls: 'apm-today-role-added', text: `+${tally.added}` });

	const bar = chip.createDiv({ cls: 'apm-today-role-bar' });
	bar.createDiv({ cls: 'apm-today-role-fill', attr: { style: `width:${pct(tally)}%` } });

	const action = active && spec.filter.size === 1 ? 'Click to show all roles' : `Click to show only ${role.name}`;
	tooltip(chip, `${role.name}: ${tally.done} of ${totalOf(tally)} done, ${tally.added} added today, ${tally.open} to do. ${action}`);
	chip.addEventListener('click', () => spec.onRoleClick(role.id));
}

// In live preview, a click on a rendered code block moves the cursor into it and shows the source.
// The panel is all buttons, so its clicks stop here (after the buttons have handled them).
function keepClicksInside(panel: HTMLElement): void {
	panel.addEventListener('mousedown', (evt) => {
		evt.preventDefault();
		evt.stopPropagation();
	});
	panel.addEventListener('click', (evt) => evt.stopPropagation());
}
