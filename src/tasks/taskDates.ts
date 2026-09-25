// Tasks-plugin dates on a task line (pure text, no Obsidian).

const DUE = /(?:📅|📆|🗓️?)\s*(\d{4}-\d{2}-\d{2})/u;
const CREATED = /➕\s*(\d{4}-\d{2}-\d{2})/u;

// Due date, e.g. "📅 2026-10-01" -> "2026-10-01".
export const dueDateOf = (line: string) => DUE.exec(line)?.[1];

// Created date, e.g. "➕ 2026-09-21" -> "2026-09-21".
export const createdDateOf = (line: string) => CREATED.exec(line)?.[1];
