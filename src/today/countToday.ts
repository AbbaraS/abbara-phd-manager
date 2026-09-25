import { TaskRecord } from '../progress/scanTasks';
import { copyKey } from '../sort/firstSeen';

// Counts for one role, or for the whole note. Cancelled tasks are left out.
export interface Tally {
	done: number;  // ticked
	open: number;  // not ticked yet
	added: number; // first written down on the note's day
}

// Done + open.
export const totalOf = (t: Tally) => t.done + t.open;

// Counts for the whole note and per role id.
export interface TodayStats {
	overall: Tally;
	roles: Map<string, Tally>;
}

const DONE = 'xX';
const CANCELLED = '-';
const empty = (): Tally => ({ done: 0, open: 0, added: 0 });

// Count a daily note's tasks (pure, no Obsidian).
// `roleOf` maps a task's badge keys to its role id (undefined = not one of ours, skipped).
// `isNew` says if the task was first written down on the note's day.
// Copies of the same task in one note count once; tasks with no text yet are skipped.
export function countToday(
	tasks: TaskRecord[],
	roleOf: (keys: string[]) => string | undefined,
	isNew: (task: TaskRecord) => boolean,
): TodayStats {
	const stats: TodayStats = { overall: empty(), roles: new Map() };
	const seen = new Set<string>();

	for (const task of tasks) {
		const role = roleOf(task.keys);
		if (role === undefined || !task.text || task.mark === CANCELLED || seen.has(copyKey(task))) continue;
		seen.add(copyKey(task));

		const tally = stats.roles.get(role) ?? empty();
		stats.roles.set(role, tally);
		for (const t of [tally, stats.overall]) {
			if (DONE.includes(task.mark)) t.done++;
			else t.open++;
			if (isNew(task)) t.added++;
		}
	}
	return stats;
}
