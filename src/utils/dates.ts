// Date helpers for "YYYY-MM-DD" deadlines (pure, no Obsidian).

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

// True for a "YYYY-MM-DD" string.
export const isIsoDate = (value: string) => ISO_DATE.test(value);

// Whole calendar days from `today` to `date` (negative = past), or null if not a date.
export function daysUntil(date: string, today = new Date()): number | null {
	const m = ISO_DATE.exec(date);
	if (!m) return null;
	// Compare as UTC midnights so clock changes never give half days.
	const target = Date.UTC(+m[1], +m[2] - 1, +m[3]);
	const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
	return Math.round((target - now) / 86_400_000);
}

// Split a day count into weeks + days, e.g. 38 -> { weeks: 5, days: 3 }.
export function weeksAndDays(total: number): { weeks: number; days: number } {
	const abs = Math.abs(total);
	return { weeks: Math.floor(abs / 7), days: abs % 7 };
}
