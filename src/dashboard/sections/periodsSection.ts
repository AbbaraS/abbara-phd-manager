import { setIcon } from 'obsidian';
import type { Period, TimeEntry, TimeRole } from '../../models/time';
import { formatMinutes, groupBy, semesterMinutes, sumMinutes, visiblePeriods, windowState } from '../../models/timeTotals';
import { shortDate, todayIso } from '../../utils/dates';
import type { DashboardContext } from '../DashboardContext';
import { projectBadge, roleBadge } from '../look/badges';
import { PeriodModal } from '../modals/PeriodModal';
import { TimeEntryModal } from '../modals/TimeEntryModal';
import { entriesByType } from './entryTable';

// Hours for a role with submission windows (GTA): semester totals, then a collapsible card per period.
export function periodsSection(el: HTMLElement, ctx: DashboardContext, config: TimeRole): void {
	const { plugin, settings } = ctx;
	const role = settings.roles.find((r) => r.id === config.roleId);
	if (!role) return;
	const entries = settings.timeEntries.filter((e) => e.roleId === config.roleId);
	const periods = settings.periods.filter((p) => p.roleId === config.roleId);

	const actions = el.createDiv({ cls: 'apm-actions' });
	actions.createEl('button', { cls: 'mod-cta', text: 'Log time' }).addEventListener('click', () => new TimeEntryModal(plugin.app, plugin, config).open());
	actions.createEl('button', { text: 'New period' }).addEventListener('click', () => new PeriodModal(plugin.app, plugin, config).open());

	// Semester totals against their limits.
	for (const semester of settings.semesters.filter((s) => periods.some((p) => p.semesterId === s.id))) {
		const used = semesterMinutes(settings.timeEntries, settings.periods, semester);
		const pct = Math.min(100, Math.round((used / (semester.limitHours * 60)) * 100));
		const row = el.createDiv({ cls: 'apm-semester' });
		row.createSpan({ cls: 'apm-semester-name', text: semester.name });
		row.createSpan({ text: `${formatMinutes(used)} of ${semester.limitHours}h` });
		row.toggleClass('is-full', used >= semester.limitHours * 60);
		row.createDiv({ cls: 'apm-bar' }).createDiv({ cls: 'apm-bar-fill', attr: { style: `width:${pct}%` } });
	}

	const shown = visiblePeriods(periods, entries);
	if (!shown.length) el.createDiv({ cls: 'apm-muted', text: periods.length ? 'A period appears here once you log time in it.' : 'Add a period (e.g. Sep/Oct) and the days its hours are submitted, then log time.' });
	shown.forEach((period) => periodCard(el, ctx, config, period, entries.filter((e) => e.periodId === period.id)));
}

// One period: title with its submit window, totals, and (when open) the entries by course then type.
function periodCard(el: HTMLElement, ctx: DashboardContext, config: TimeRole, period: Period, entries: TimeEntry[]): void {
	const { plugin, settings } = ctx;
	const role = settings.roles.find((r) => r.id === config.roleId)!;
	const today = todayIso();
	const open = period.submitted ? settings.dashOpenPeriods.includes(period.id) : !settings.dashClosedPeriods.includes(period.id);
	const card = el.createDiv({ cls: 'apm-period' });
	card.style.setProperty('--apm-role-color', role.color);
	card.toggleClass('is-open', open);
	card.toggleClass('is-submitted', period.submitted);

	const head = card.createDiv({ cls: 'apm-period-head', attr: { tabindex: '0', role: 'button', 'aria-expanded': String(open) } });
	setIcon(head.createSpan({ cls: 'apm-chev' }), open ? 'chevron-down' : 'chevron-right');
	const title = head.createDiv({ cls: 'apm-period-title' });
	roleBadge(title, plugin, role);
	title.createSpan({ cls: 'apm-period-name', text: `- ${period.name}` });
	title.createSpan({ cls: 'apm-period-window', text: `submit between ${shortDate(period.from)}-${shortDate(period.to)}` });

	// Where today sits against the window.
	const state = windowState(period, today);
	const status = period.submitted ? 'Submitted' : state === 'open' ? 'Submit now' : state === 'after' ? 'Overdue' : '';
	if (status) head.createSpan({ cls: `apm-pill is-${period.submitted ? 'done' : state}`, text: status });
	const edit = head.createEl('button', { cls: 'clickable-icon', attr: { 'aria-label': 'Edit period' } });
	setIcon(edit, 'pencil');
	edit.addEventListener('click', (e) => {
		e.stopPropagation();
		new PeriodModal(plugin.app, plugin, config, period).open();
	});
	const toggle = () => {
		const key = period.submitted ? 'dashOpenPeriods' : 'dashClosedPeriods';
		const list = settings[key];
		// For a submitted card the list holds the ones opened by hand, for the others the ones closed by hand.
		const listed = list.includes(period.id);
		settings[key] = listed ? list.filter((id) => id !== period.id) : [...list, period.id];
		ctx.saveLayout();
	};
	head.addEventListener('click', toggle);
	head.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });

	// Totals: this period, per course, and the semester so far.
	const courses = groupBy(entries, (e) => e.projectId);
	const sums = card.createDiv({ cls: 'apm-period-sums' });
	sums.createSpan({ cls: 'apm-total', text: `${formatMinutes(sumMinutes(entries))} this period` });
	for (const [projectId, list] of courses) {
		const project = role.projects.find((p) => p.id === projectId);
		const chip = sums.createSpan({ cls: 'apm-sum' });
		if (project) projectBadge(chip, plugin, role, project);
		chip.createSpan({ text: formatMinutes(sumMinutes(list)) });
	}
	const semester = settings.semesters.find((s) => s.id === period.semesterId);
	if (semester) sums.createSpan({ cls: 'apm-muted', text: `${semester.name}: ${formatMinutes(semesterMinutes(settings.timeEntries, settings.periods, semester))} of ${semester.limitHours}h` });
	if (!open) return;

	// Entries by course, then type.
	for (const [projectId, list] of courses) {
		const project = role.projects.find((p) => p.id === projectId);
		const course = card.createDiv({ cls: 'apm-course' });
		const head = course.createDiv({ cls: 'apm-course-head' });
		if (project) projectBadge(head, plugin, role, project);
		else head.createSpan({ text: 'No course' });
		head.createSpan({ cls: 'apm-muted', text: formatMinutes(sumMinutes(list)) });
		entriesByType(course, ctx, config, role, project, list);
	}
}
