import { TaskRecord } from '../progress/scanTasks';

// Key shared by every copy of a task (rolled-over copies): its id, else its text.
export const copyKey = (task: TaskRecord) => (task.id ? `id:${task.id}` : `text:${task.text}`);

// A note's tasks plus the day the note belongs to.
export interface DatedTasks {
	date: string; // "YYYY-MM-DD"
	tasks: TaskRecord[];
}

// Earliest note date each task appears in, i.e. the day it was first written down.
export function firstSeenDates(notes: Iterable<DatedTasks>): Map<string, string> {
	const out = new Map<string, string>();
	for (const note of notes) {
		for (const task of note.tasks) {
			const key = copyKey(task);
			const seen = out.get(key);
			if (!seen || note.date < seen) out.set(key, note.date);
		}
	}
	return out;
}
