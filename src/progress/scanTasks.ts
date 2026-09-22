import { badgeKeys, taskIdOf } from '../tasks/taskBadges';

// One badge task as found in a note.
export interface TaskRecord {
	keys: string[]; // plain badge keys on the line
	id?: string;    // task id, shared by rolled-over copies
	text: string;   // task text without badges, lower case (used to match copies with no id)
	mark: string;   // checkbox character: ' ', 'x', '-', ...
}

const TASK = /^\s*[-*+] \[(.)\] (.*)$/;
const ANY_BADGE = /`\[!![^\]`]*\]`/g;

// Every badge task in a note's text.
export function scanTasks(text: string): TaskRecord[] {
	const out: TaskRecord[] = [];
	for (const line of text.split('\n')) {
		if (!line.includes('`[!!')) continue;
		const match = TASK.exec(line);
		const keys = match ? badgeKeys(line) : [];
		if (!match || !keys.length) continue;
		const plain = match[2].replace(ANY_BADGE, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
		out.push({ keys, id: taskIdOf(line), text: plain, mark: match[1] });
	}
	return out;
}
