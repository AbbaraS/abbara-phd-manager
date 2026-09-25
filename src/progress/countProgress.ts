import { BadgeEntry } from '../models/badgeIndex';
import { TaskRecord } from './scanTasks';

// Tasks done / total for one project.
export interface Progress {
	done: number;
	total: number;
}

// One note's tasks, with its last-modified time (the newest copy decides the project).
export interface NoteTasks {
	time: number;
	date: string; // "YYYY-MM-DD": the daily note's day, else the day the file was created
	tasks: TaskRecord[];
}

const DONE = 'xX';
const CANCELLED = '-';

// Count tasks per project badge key, merging copies of the same task across notes:
// by id when the task has one, else by project + text. A task is done if any copy is ticked.
// Cancelled tasks ([-]) and tasks with no text yet are left out.
export function countProgress(notes: Iterable<NoteTasks>, index: Map<string, BadgeEntry>): Map<string, Progress> {
	const groups = new Map<string, { project: string; time: number; done: boolean; cancelled: boolean }>();

	// Merge copies.
	for (const note of notes) {
		for (const task of note.tasks) {
			const project = task.keys.find((k) => index.get(k)?.kind === 'project');
			if (!project || !task.text) continue;
			const key = task.id ? `id:${task.id}` : `text:${project}:${task.text}`;
			const group = groups.get(key) ?? { project, time: -1, done: false, cancelled: false };
			if (note.time >= group.time) {
				group.project = project;
				group.time = note.time;
			}
			group.done ||= DONE.includes(task.mark);
			group.cancelled ||= task.mark === CANCELLED;
			groups.set(key, group);
		}
	}

	// Tally.
	const out = new Map<string, Progress>();
	for (const group of groups.values()) {
		if (group.cancelled && !group.done) continue;
		const progress = out.get(group.project) ?? { done: 0, total: 0 };
		progress.total++;
		if (group.done) progress.done++;
		out.set(group.project, progress);
	}
	return out;
}
