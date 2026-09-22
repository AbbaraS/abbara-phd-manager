// A task line that starts with badges: indent, "- [ ] ", the badges, then the task text.
const TASK_WITH_BADGES = /^(\s*)[-*+] \[.\] ((?:`\[!![^\]`]+\]`\s*)+)(.*)$/;

// What pressing Enter at the end of `line` should do:
// null = not a badge task (let Obsidian handle it),
// ''   = the task has no text yet, so clear it and end the list,
// else = the next task line, carrying the same badges except those `dropKey` rejects (e.g. statuses).
export function nextTaskLine(line: string, dropKey: (key: string) => boolean = () => false): string | null {
	const match = TASK_WITH_BADGES.exec(line);
	if (!match) return null;

	const [, indent, badges, text] = match;
	if (!text.trim()) return '';
	const kept = (badges.match(/`\[!![^\]`]+\]`/g) ?? []).filter((b) => !dropKey(b.slice(4, -2).trim().toLowerCase()));
	return `${indent}- [ ] ${kept.map((b) => b + ' ').join('')}`;
}
