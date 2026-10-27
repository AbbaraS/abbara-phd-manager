import { Notice } from 'obsidian';
import type { TimeRole } from '../../models/time';
import { formatMinutesWords, groupBy, sumMinutes } from '../../models/timeTotals';
import { timesheetText } from '../../models/timesheetText';
import { newTaskId } from '../../utils/ids';
import { daysUntil, shortDate, slashDate, todayIso } from '../../utils/dates';
import type { DashboardContext } from '../DashboardContext';
import { DateModal, TextModal } from '../modals/SmallModals';
import { TimeEntryModal } from '../modals/TimeEntryModal';
import { entriesByType } from './entryTable';

// Hours for a role handed in every week or so (ResLife): when it was last submitted, what's waiting, and a button
// that writes the waiting entries out as text to paste into the timesheet system.
export function timesheetSection(el: HTMLElement, ctx: DashboardContext, config: TimeRole): void {
	const { plugin, settings } = ctx;
	const role = settings.roles.find((r) => r.id === config.roleId);
	if (!role) return;
	const entries = settings.timeEntries.filter((e) => e.roleId === config.roleId);
	const pending = entries.filter((e) => !e.submittedOn);

	// Last submitted.
	const since = config.lastSubmitted ? -(daysUntil(config.lastSubmitted) ?? 0) : null;
	const last = el.createDiv({ cls: 'apm-last' });
	last.createSpan({ text: 'Last submitted on ' });
	last.createEl('strong', { text: config.lastSubmitted ? shortDate(config.lastSubmitted) : 'never' });
	if (since !== null) last.createSpan({ cls: 'apm-muted', text: ` (${since === 0 ? 'today' : `${since} day${since === 1 ? '' : 's'} ago`})` });
	last.toggleClass('is-late', since !== null && since >= config.remindDays);

	const actions = el.createDiv({ cls: 'apm-actions' });
	actions.createEl('button', { cls: 'mod-cta', text: 'Log time' }).addEventListener('click', () => new TimeEntryModal(plugin.app, plugin, config).open());
	actions.createEl('button', { text: 'Timesheet text' }).addEventListener('click', () => {
		if (!pending.length) return void new Notice('No entries waiting to be submitted.');
		const typeName = (id: string) => role.types.concat(...role.projects.map((p) => p.types)).find((t) => t.id === id)?.name ?? '';
		new TextModal(plugin.app, `${role.name} timesheet`, timesheetText(pending, typeName, role.types.map((t) => t.id))).open();
	});
	actions.createEl('button', { text: 'Mark as submitted' }).addEventListener('click', () => {
		if (!pending.length) return void new Notice('No entries waiting to be submitted.');
		new DateModal(plugin.app, 'Mark entries as submitted', 'Mark submitted', todayIso(), (date) => {
			pending.forEach((e) => (e.submittedOn = date));
			config.lastSubmitted = date;
			config.taskId = newTaskId(); // a fresh reminder for the next round
			void plugin.commit();
		}).open();
	});

	// Waiting for submission.
	if (!pending.length) el.createDiv({ cls: 'apm-muted', text: 'Nothing waiting to be submitted.' });
	else {
		el.createDiv({ cls: 'apm-total', text: `${formatMinutesWords(sumMinutes(pending))} waiting` });
		entriesByType(el, ctx, config, role, undefined, pending);
	}

	// Handed in already, newest submission first.
	const done = entries.filter((e) => e.submittedOn);
	if (!done.length) return;
	const details = el.createEl('details', { cls: 'apm-history' });
	details.createEl('summary', { text: `Submitted before (${done.length})` });
	const byDay = [...groupBy(done, (e) => e.submittedOn)].sort((a, b) => b[0].localeCompare(a[0]));
	for (const [day, list] of byDay) {
		details.createDiv({ cls: 'apm-course-head', text: `Submitted ${slashDate(day)} · ${formatMinutesWords(sumMinutes(list))}` });
		entriesByType(details, ctx, config, role, undefined, list);
	}
}
