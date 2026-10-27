import { badgeKeys, taskIdOf } from '../tasks/taskBadges';
import { DATE_MARKERS, Priority, PRIORITY_EMOJI, createdDateOf, doneDateOf, dueDateOf, priorityOf } from '../tasks/taskDates';

// One badge task as found in a note.
export interface TaskRecord {
	keys: string[]; // plain badge keys on the line
	id?: string;    // task id, shared by rolled-over copies
	text: string;   // task text without badges, lower case (used to match copies with no id)
	title: string;  // task text without badges, dates or priority, as written
	mark: string;   // checkbox character: ' ', 'x', '-', ...
	line: number;   // 0-based line in the note
	created?: string; // "YYYY-MM-DD" from a ➕ date on the line
	doneOn?: string;  // "YYYY-MM-DD" from a ✅ date on the line
	due?: string;     // "YYYY-MM-DD" from a 📅 date on the line
	priority?: Priority;
}

const TASK = /^\s*[-*+] \[(.)\] (.*)$/;
const ANY_BADGE = /`\[!![^\]`]*\]`/g;

// Every badge task in a note's text.
export function scanTasks(text: string): TaskRecord[] {
	const out: TaskRecord[] = [];
	text.split('\n').forEach((line, at) => {
		if (!line.includes('`[!!')) return;
		const match = TASK.exec(line);
		const keys = match ? badgeKeys(line) : [];
		if (!match || !keys.length) return;
		const plain = match[2].replace(ANY_BADGE, ' ').replace(/\s+/g, ' ').trim();
		const title = plain.replace(DATE_MARKERS, ' ').replace(PRIORITY_EMOJI, ' ').replace(/\s+/g, ' ').trim();
		out.push({
			keys, id: taskIdOf(line), text: plain.toLowerCase(), title, mark: match[1], line: at,
			created: createdDateOf(line), doneOn: doneDateOf(line), due: dueDateOf(line), priority: priorityOf(line),
		});
	});
	return out;
}
