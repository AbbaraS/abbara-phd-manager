import { setIcon } from 'obsidian';
import type { Project, Role } from '../../models/types';
import type { TimeEntry, TimeRole } from '../../models/time';
import { byTime, formatMinutes, groupBy, sumMinutes } from '../../models/timeTotals';
import { slashDate } from '../../utils/dates';
import type { DashboardContext } from '../DashboardContext';
import { typeBadge } from '../look/badges';
import { TimeEntryModal } from '../modals/TimeEntryModal';

// Entries grouped under their type's badge, each group a small table with an edit button per row.
export function entriesByType(el: HTMLElement, ctx: DashboardContext, config: TimeRole, role: Role, project: Project | undefined, entries: TimeEntry[]): void {
	const groups = groupBy([...entries].sort(byTime), (e) => e.typeId);
	for (const [typeId, list] of groups) {
		const head = el.createDiv({ cls: 'apm-type-head' });
		if (typeId) typeBadge(head, ctx.plugin, role, project, typeId);
		else head.createSpan({ cls: 'apm-muted', text: 'No type' });
		head.createSpan({ cls: 'apm-muted', text: formatMinutes(sumMinutes(list)) });

		const table = el.createEl('table', { cls: 'apm-entries' });
		for (const e of list) {
			const tr = table.createEl('tr');
			tr.createEl('td', { cls: 'apm-entry-date', text: slashDate(e.date) });
			tr.createEl('td', { text: e.start && e.end ? `${e.start}-${e.end}` : '' });
			tr.createEl('td', { cls: 'apm-entry-len', text: formatMinutes(e.minutes) });
			tr.createEl('td', { cls: 'apm-entry-note', text: e.note });
			const edit = tr.createEl('td').createEl('button', { cls: 'clickable-icon', attr: { 'aria-label': 'Edit entry' } });
			setIcon(edit, 'pencil');
			edit.addEventListener('click', () => new TimeEntryModal(ctx.plugin.app, ctx.plugin, config, e).open());
		}
	}
}
