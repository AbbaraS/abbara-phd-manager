import { Role } from '../models/types';
import { BadgeEntry } from '../models/badgeIndex';
import { readTask } from '../tasks/readTask';
import { isTaskLine } from '../tasks/taskBadges';
import { createdDateOf, dueDateOf } from '../tasks/taskDates';

// What a task is sorted by, in priority order.
export interface SortKey {
	role: number;    // position in settings, no role = last
	project: number; // position in its role, role-only tasks = -1 (first)
	due: string;     // "YYYY-MM-DD", '' = none
	created: string; // "YYYY-MM-DD", '' = unknown
}

const LAST = Number.MAX_SAFE_INTEGER;

// Plain list items (not tasks) all share this key, so they never reorder among themselves.
const NOT_A_TASK: SortKey = { role: LAST, project: LAST, due: '', created: '' };

// Sort key for one task line. `createdOf` looks it up when the line has no ➕ date.
export function sortKeyOf(
	line: string,
	roles: Role[],
	index: Map<string, BadgeEntry>,
	createdOf: (line: string) => string | undefined,
): SortKey {
	if (!isTaskLine(line)) return NOT_A_TASK;
	const info = readTask(line, index);
	return {
		role: info ? roles.indexOf(info.role) : LAST,
		project: info?.project ? info.role.projects.indexOf(info.project) : -1,
		due: dueDateOf(line) ?? '',
		created: createdDateOf(line) ?? createdOf(line) ?? '',
	};
}

// Earlier ISO date first, blanks last.
const byDate = (a: string, b: string) => (a === b ? 0 : !a ? 1 : !b ? -1 : a < b ? -1 : 1);

// Role, then project, then due date (soonest first), then created date (oldest first).
export function compareKeys(a: SortKey, b: SortKey): number {
	return a.role - b.role || a.project - b.project || byDate(a.due, b.due) || byDate(a.created, b.created);
}
