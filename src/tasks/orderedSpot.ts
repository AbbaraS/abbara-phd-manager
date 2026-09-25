import { listBlocks } from '../sort/listBlocks';
import { SortKey, compareKeys } from '../sort/sortKey';

// Where a new task goes so the list stays grouped (pure text, no Obsidian).
// Returns the 0-based line to insert before, or null when there's no task list (use the cursor).
export function orderedSpot(
	lines: string[],
	newLine: string,
	keyOf: (line: string) => SortKey,
	isRoleTask: (line: string) => boolean,
	cursorLine: number,
): number | null {
	// The task list: the one the cursor is in, else the one with the most role tasks.
	const blocks = listBlocks(lines).map((block) => {
		const size = block.items.reduce((n, item) => n + item.lines.length, 0);
		const tasks = block.items.filter((item) => isRoleTask(item.lines[0])).length;
		return { ...block, end: block.start + size, tasks };
	}).filter((block) => block.tasks > 0);
	const list = blocks.find((b) => cursorLine >= b.start && cursorLine < b.end)
		?? [...blocks].sort((a, b) => b.tasks - a.tasks)[0];
	if (!list) return null;

	// Start line of each item.
	let at = list.start;
	const starts = list.items.map((item) => {
		const start = at;
		at += item.lines.length;
		return start;
	});
	const after = (i: number) => starts[i] + list.items[i].lines.length;
	const keys = list.items.map((item) => keyOf(item.lines[0]));
	const key = keyOf(newLine);

	// Sorted list: before the first task that sorts after the new one.
	const sorted = keys.every((k, i) => i === 0 || compareKeys(keys[i - 1], k) <= 0);
	if (sorted) {
		const i = keys.findIndex((k) => compareKeys(k, key) > 0);
		return i < 0 ? list.end : starts[i];
	}

	// Unsorted: after the last task of the same project, else of the same role, else at the end.
	let i = lastIndexOf(keys, (k) => k.role === key.role && k.project === key.project);
	if (i < 0) i = lastIndexOf(keys, (k) => k.role === key.role);
	return i < 0 ? list.end : after(i);
}

// Index of the last item matching `test`, or -1.
function lastIndexOf<T>(list: T[], test: (item: T) => boolean): number {
	for (let i = list.length - 1; i >= 0; i--) if (test(list[i])) return i;
	return -1;
}
