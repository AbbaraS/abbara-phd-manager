import { idBadge } from './taskBadges';

// A task line that starts with badges: indent, "- [ ] ", the badges, then the task text.
const TASK_WITH_BADGES = /^(\s*)[-*+] \[.\] ((?:`\[!![^\]`]+\]`\s*)+)(.*)$/;

// What pressing Enter at the end of `line` should do:
// null = not a badge task (let Obsidian handle it),
// ''   = the task has no text yet, so clear it and end the list,
// else = the next task line, carrying the same badges except those `dropKey` rejects (e.g. statuses)
//        and the old id; `newId` (if given) becomes the new task's id.
export function nextTaskLine(line: string, dropKey: (key: string) => boolean = () => false, newId?: string): string | null {
	const match = TASK_WITH_BADGES.exec(line);
	if (!match) return null;

	const [, indent, badges, text] = match;
	if (!text.trim()) return '';
	const kept = (badges.match(/`\[!![^\]`]+\]`/g) ?? [])
		.filter((b) => !b.startsWith('`[!!id:') && !dropKey(b.slice(4, -2).trim().toLowerCase()));
	if (newId) kept.push(idBadge(newId));
	return `${indent}- [ ] ${kept.map((b) => b + ' ').join('')}`;
}
