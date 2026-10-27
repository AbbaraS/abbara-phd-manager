import type { Project, Role } from './types';
import type { BadgeEntry } from './badgeIndex';
import type { Priority } from '../tasks/taskDates';
import type { NoteTasks } from '../progress/countProgress';
import { scanTasks, type TaskRecord } from '../progress/scanTasks';
import { copyKey, firstSeenDates } from '../sort/firstSeen';

// When a task was created and finished. Times are "YYYY-MM-DDTHH:mm"; older tasks only know the day.
export interface TaskMeta {
	created: string;
	completed?: string;
}

// One task for the dashboard: all rolled-over copies merged into one row.
export interface TaskRow {
	key: string;            // copyKey: the task id, else its text
	id?: string;
	role: Role;
	project?: Project;
	typeKey?: string;       // badge keys of the type and status, if it has them
	statusKey?: string;
	title: string;
	state: 'open' | 'done' | 'cancelled';
	priority?: Priority;
	due?: string;
	created?: string;       // from the log, else a guess from the notes
	completed?: string;
	createdGuess: string;   // day it was first written down (used to fill the log the first time)
	completedGuess: string; // day it was ticked
	path: string;           // note holding the newest copy, '' = not in a note yet
	line: number;
	scheduledFor?: string;  // future task waiting for its daily note to be created
}

// A note's path with its tasks.
export interface NoteEntry {
	path: string;
	note: NoteTasks;
}

// Role, project, type and status of a task from its badge keys, or null when none is ours.
function readKeys(keys: string[], index: Map<string, BadgeEntry>) {
	let owner: BadgeEntry | undefined;
	let typeKey: string | undefined;
	let statusKey: string | undefined;
	for (const key of keys) {
		const entry = index.get(key);
		if (!entry) continue;
		if (!owner && (entry.kind === 'role' || entry.kind === 'project')) owner = entry;
		else if (entry.kind === 'type') typeKey ??= key;
		else if (entry.kind === 'status') statusKey ??= key;
	}
	if (!owner || owner.kind === 'type' || owner.kind === 'status') return null;
	return { role: owner.role, project: owner.kind === 'project' ? owner.project : undefined, typeKey, statusKey };
}

// Merges copies of the same task across notes into rows. A task is done if any copy is ticked, cancelled if
// one is crossed out and none is done. Tasks with no text yet are left out.
export function buildTaskRows(notes: NoteEntry[], index: Map<string, BadgeEntry>, meta: Record<string, TaskMeta>): TaskRow[] {
	const firstSeen = firstSeenDates(notes.map((n) => n.note));
	const rows = new Map<string, TaskRow & { newest: string }>();

	for (const { path, note } of notes) {
		for (const task of note.tasks) {
			const found = readKeys(task.keys, index);
			if (!found || !task.text) continue;
			const key = copyKey(task);
			const sort = `${note.date}|${String(note.time).padStart(15, '0')}`;
			const row = rows.get(key) ?? mergeStart(key, task, found, firstSeen.get(key) ?? note.date);
			const done = 'xX'.includes(task.mark);
			if (done) {
				row.state = 'done';
				row.completedGuess = [row.completedGuess, task.doneOn ?? note.date].sort().pop() ?? note.date;
			} else if (task.mark === '-' && row.state !== 'done') row.state = 'cancelled';

			// The newest copy decides what the task looks like.
			if (sort >= row.newest) Object.assign(row, { ...found, newest: sort, title: task.title, due: task.due, priority: task.priority, path, line: task.line });
			rows.set(key, row);
		}
	}

	// Cancelled only counts while no copy is done, so a later copy ticked after a cancel wins.
	return [...rows.values()].map(({ newest: _newest, ...row }) => {
		const logged = meta[row.key];
		return { ...row, created: logged?.created ?? row.createdGuess, completed: row.state === 'done' ? logged?.completed ?? row.completedGuess : undefined };
	});
}

// A row that starts from the first copy seen.
function mergeStart(key: string, task: TaskRecord, found: NonNullable<ReturnType<typeof readKeys>>, firstSeen: string): TaskRow & { newest: string } {
	return {
		key, id: task.id, ...found, title: task.title, state: 'open', priority: task.priority, due: task.due,
		createdGuess: task.created ?? firstSeen, completedGuess: '', path: '', line: task.line, newest: '',
	};
}

// A task added for a day whose daily note doesn't exist yet.
export interface ScheduledTask {
	id: string;
	date: string; // "YYYY-MM-DD", the daily note it first appears in
	line: string; // the full task line
}

// Rows for scheduled tasks that aren't in any note yet (`taken` = keys of rows already found in notes).
export function scheduledRows(list: ScheduledTask[], index: Map<string, BadgeEntry>, meta: Record<string, TaskMeta>, taken: Set<string>): TaskRow[] {
	const notes = list.map((s) => ({ path: '', note: { time: 0, date: s.date, tasks: scanTasks(s.line) } }));
	return buildTaskRows(notes, index, meta)
		.filter((row) => !taken.has(row.key))
		.map((row) => ({ ...row, scheduledFor: list.find((s) => s.id === row.id)?.date }));
}
