import type { Period, Semester, TimeEntry } from './time';

// Minutes between two "HH:mm" times; an end before the start means it ran past midnight.
export function minutesBetween(start: string, end: string): number {
	const [sh, sm] = start.split(':').map(Number);
	const [eh, em] = end.split(':').map(Number);
	if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return 0;
	const diff = eh * 60 + em - (sh * 60 + sm);
	return diff < 0 ? diff + 24 * 60 : diff;
}

// "7h 30m", "45m", "2h".
export function formatMinutes(total: number): string {
	const h = Math.floor(total / 60);
	const m = total % 60;
	if (!h) return `${m}m`;
	return m ? `${h}h ${m}m` : `${h}h`;
}

export const sumMinutes = (entries: TimeEntry[]) => entries.reduce((n, e) => n + e.minutes, 0);

// Entries oldest first.
export const byTime = (a: TimeEntry, b: TimeEntry) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start);

// Minutes logged in every period of a semester.
export function semesterMinutes(entries: TimeEntry[], periods: Period[], semester: Semester, ignoreEntryId = ''): number {
	const ids = new Set(periods.filter((p) => p.semesterId === semester.id).map((p) => p.id));
	return sumMinutes(entries.filter((e) => ids.has(e.periodId) && e.id !== ignoreEntryId));
}

// The period a new entry most likely belongs to: the one whose submit window ends soonest and hasn't passed,
// else the last one.
export function defaultPeriod(periods: Period[], today: string): Period | undefined {
	const sorted = [...periods].filter((p) => !p.submitted).sort((a, b) => a.to.localeCompare(b.to));
	return sorted.find((p) => p.to >= today) ?? sorted[sorted.length - 1] ?? periods[periods.length - 1];
}

// Where today sits against a period's submit window.
export function windowState(period: Period, today: string): 'before' | 'open' | 'after' {
	return today < period.from ? 'before' : today > period.to ? 'after' : 'open';
}

// Periods to show: only those with entries, soonest window first, submitted ones at the bottom.
export function visiblePeriods(periods: Period[], entries: TimeEntry[]): Period[] {
	const used = new Set(entries.map((e) => e.periodId));
	return periods
		.filter((p) => used.has(p.id))
		.sort((a, b) => Number(a.submitted) - Number(b.submitted) || a.from.localeCompare(b.from));
}

// Entries grouped by key, in the order the keys first appear.
export function groupBy<T>(items: T[], keyOf: (item: T) => string): Map<string, T[]> {
	const out = new Map<string, T[]>();
	for (const item of items) {
		const key = keyOf(item);
		out.set(key, [...(out.get(key) ?? []), item]);
	}
	return out;
}

// "7 hours 30mins", "1 hour", "45mins" (the wording the timesheet system text uses).
export function formatMinutesWords(total: number): string {
	const h = Math.floor(total / 60);
	const m = total % 60;
	const hours = h ? `${h} hour${h === 1 ? '' : 's'}` : '';
	const mins = m || !h ? `${m}mins` : '';
	return [hours, mins].filter(Boolean).join(' ');
}
