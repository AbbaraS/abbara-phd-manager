// Date helpers for "YYYY-MM-DD" deadlines (pure, no Obsidian).

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

// Today as "YYYY-MM-DD" in local time.
export function todayIso(now = new Date()): string {
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// Local date and time as "YYYY-MM-DDTHH:mm".
export function nowStamp(now = new Date()): string {
	return `${todayIso(now)}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

// "2026-10-26" -> "Mon 26 Oct" ('' for anything else).
export function shortDate(date: string): string {
	const m = ISO_DATE.exec(date);
	if (!m) return '';
	const d = new Date(+m[1], +m[2] - 1, +m[3]);
	return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

// "2026-10-26" -> "26/10/2026".
export function slashDate(date: string): string {
	const m = ISO_DATE.exec(date);
	return m ? `${m[3]}/${m[2]}/${m[1]}` : date;
}

// "2026-10-26T14:05" -> "14:05" ('' for a plain date).
export const timeOfStamp = (stamp: string) => stamp.split('T')[1] ?? '';
