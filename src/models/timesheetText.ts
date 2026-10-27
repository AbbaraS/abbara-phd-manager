import type { TimeEntry } from './time';
import { byTime, formatMinutesWords, groupBy, sumMinutes } from './timeTotals';
import { slashDate } from '../utils/dates';

// One line: "26/10/2026 - 18:00-18:30 (30mins) - note", or "26/10/2026 - 30mins - note" with no times.
function entryLine(e: TimeEntry): string {
	const when = e.start && e.end ? `${e.start}-${e.end} (${e.minutes}mins)` : `${e.minutes}mins`;
	return [slashDate(e.date), when, e.note.trim()].filter(Boolean).join(' - ');
}

// The text to paste into the timesheet system: entries under their type in capitals, then the total.
// `typeName` gives a type's display name from its id ('' = no type); `typeOrder` lists type ids in the order to show.
export function timesheetText(entries: TimeEntry[], typeName: (id: string) => string, typeOrder: string[]): string {
	const sorted = [...entries].sort(byTime);
	const groups = groupBy(sorted, (e) => e.typeId);
	const ids = [...typeOrder.filter((id) => groups.has(id)), ...[...groups.keys()].filter((id) => !typeOrder.includes(id))];
	const blocks = ids.map((id) => {
		const name = (id && typeName(id)) || 'OTHER';
		return [`${name.toUpperCase()}:`, ...(groups.get(id) ?? []).map(entryLine)].join('\n');
	});
	return `${blocks.join('\n\n')}\n\n≈${formatMinutesWords(sumMinutes(sorted))} total`;
}
