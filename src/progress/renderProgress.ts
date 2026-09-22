import { moment, setIcon } from 'obsidian';
import { weeksAndDays } from '../utils/dates';
import { ProgressRow } from './progressRows';

// Plural helper: 1 day, 2 days.
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

// Big number + label for the time left.
function countdown(days: number): { value: string; label: string } {
	if (days === 0) return { value: 'Today', label: 'due' };
	return { value: String(Math.abs(days)), label: days > 0 ? (days === 1 ? 'day left' : 'days left') : 'days overdue' };
}

// Draw the deadline dashboard: one card per project.
export function renderProgress(el: HTMLElement, rows: ProgressRow[]): void {
	const grid = el.createDiv({ cls: 'apm-progress' });
	if (!rows.length) {
		grid.createDiv({ cls: 'apm-progress-empty', text: 'No project deadlines yet. Add one to a project in the PhD Manager settings.' });
		return;
	}
	rows.forEach((row) => renderCard(grid, row));
}

// One project card.
function renderCard(grid: HTMLElement, row: ProgressRow): void {
	const card = grid.createDiv({ cls: 'apm-card' });
	card.style.setProperty('--apm-card-color', row.color);
	card.toggleClass('is-overdue', row.daysLeft < 0);
	card.toggleClass('is-soon', row.daysLeft >= 0 && row.daysLeft <= 7);

	// Header.
	const head = card.createDiv({ cls: 'apm-card-head' });
	setIcon(head.createSpan({ cls: 'apm-card-icon' }), row.icon);
	const title = head.createDiv({ cls: 'apm-card-title' });
	title.createDiv({ cls: 'apm-card-name', text: row.project.name });
	title.createDiv({ cls: 'apm-card-role', text: row.role.name });

	// Countdown.
	const { value, label } = countdown(row.daysLeft);
	const count = card.createDiv({ cls: 'apm-card-count' });
	count.createSpan({ cls: 'apm-card-days', text: value });
	count.createSpan({ cls: 'apm-card-label', text: label });

	const { weeks, days } = weeksAndDays(row.daysLeft);
	const due = moment(row.project.deadline, 'YYYY-MM-DD').format('ddd D MMM YYYY');
	card.createDiv({ cls: 'apm-card-meta', text: `${plural(weeks, 'week')} ${plural(days, 'day')} · ${due}` });

	// Tasks bar.
	const pct = row.total ? Math.round((row.done / row.total) * 100) : 0;
	const bar = card.createDiv({ cls: 'apm-card-bar', attr: { role: 'progressbar', 'aria-valuenow': String(pct) } });
	bar.createDiv({ cls: 'apm-card-fill', attr: { style: `width:${pct}%` } });
	const tasks = card.createDiv({ cls: 'apm-card-tasks' });
	tasks.createSpan({ text: `${row.done} / ${plural(row.total, 'task')} done` });
	tasks.createSpan({ cls: 'apm-card-pct', text: `${pct}%` });
}
