// Tasks-plugin dates and priority on a task line (pure text, no Obsidian).

const DUE = /(?:📅|📆|🗓️?)\s*(\d{4}-\d{2}-\d{2})/u;
const CREATED = /➕\s*(\d{4}-\d{2}-\d{2})/u;
const DONE_ON = /✅\s*(\d{4}-\d{2}-\d{2})/u;

// Every date marker, with its date, so they can be taken out of the task text.
export const DATE_MARKERS = /(?:📅|📆|🗓️?|➕|✅|❌|⏳|🛫)\s*\d{4}-\d{2}-\d{2}/gu;

// Priority levels, highest first, with the emoji the Tasks plugin writes.
export const PRIORITIES = [
	{ id: 'highest', emoji: '🔺', name: 'Highest' },
	{ id: 'high', emoji: '⏫', name: 'High' },
	{ id: 'medium', emoji: '🔼', name: 'Medium' },
	{ id: 'low', emoji: '🔽', name: 'Low' },
	{ id: 'lowest', emoji: '⏬', name: 'Lowest' },
] as const;

export type Priority = typeof PRIORITIES[number]['id'];

// Matches any priority emoji.
export const PRIORITY_EMOJI = /[🔺⏫🔼🔽⏬]/gu;

// Due date, e.g. "📅 2026-10-01" -> "2026-10-01".
export const dueDateOf = (line: string) => DUE.exec(line)?.[1];

// Created date, e.g. "➕ 2026-09-21" -> "2026-09-21".
export const createdDateOf = (line: string) => CREATED.exec(line)?.[1];

// Done date, e.g. "✅ 2026-09-21" -> "2026-09-21".
export const doneDateOf = (line: string) => DONE_ON.exec(line)?.[1];

// The line's priority, if it has one.
export const priorityOf = (line: string): Priority | undefined =>
	PRIORITIES.find((p) => line.includes(p.emoji))?.id;
