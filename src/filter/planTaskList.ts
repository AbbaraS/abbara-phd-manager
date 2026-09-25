import { listBlocks } from '../sort/listBlocks';

// Plans which task lines to hide and where role dividers go (pure text, no Obsidian).

// What the view needs to know about one task line.
export interface LineTask {
	role: string; // role id, '' = no role of ours
	state: 'open' | 'done' | 'cancelled';
}

// What to show.
export interface ViewOptions {
	hideDone: boolean;            // hide ticked and cancelled tasks
	roles: ReadonlySet<string>;   // show only these roles' tasks (empty = all)
	dividers: boolean;            // label each role's group of tasks
	collapsed: ReadonlySet<string>; // roles whose group is folded into its divider
	keep: ReadonlySet<number>;    // lines never hidden (where the cursor is)
}

// A role label drawn above a group of tasks.
export interface Divider {
	line: number;  // 0-based line it sits above
	role: string;  // role id, '' = tasks with no role
	done: number;  // ticked tasks in the group
	total: number; // tasks in the group, not counting cancelled
}

// A collapsed group: lines `line` to `last` are replaced by its divider.
export interface Fold extends Divider {
	last: number; // inclusive
}

// The result: lines to hide (inclusive ranges), dividers to draw, and folded groups.
export interface TaskListPlan {
	hidden: Array<[number, number]>;
	dividers: Divider[];
	folds: Fold[];
}

// One top-level list item with its line span and task info.
interface Item {
	start: number;
	end: number; // inclusive
	task: LineTask | null;
}

const indentOf = (line: string) => line.length - line.trimStart().length;
const isClosed = (task: LineTask) => task.state !== 'open';

// Plan the whole note. `taskOf` returns null for lines that are not tasks.
export function planTaskList(lines: string[], taskOf: (line: string) => LineTask | null, opts: ViewOptions): TaskListPlan {
	const hide = new Set<number>();
	const dividers: Divider[] = [];
	const folds: Fold[] = [];

	for (const block of listBlocks(lines)) {
		let at = block.start;
		const items: Item[] = block.items.map((item) => {
			const start = at;
			at += item.lines.length;
			return { start, end: at - 1, task: taskOf(item.lines[0]) };
		});

		// Hide whole items, or just their ticked subtasks.
		for (const item of items) {
			if (hidesItem(item.task, opts) && !touches(item.start, item.end, opts.keep)) {
				for (let n = item.start; n <= item.end; n++) hide.add(n);
			} else if (opts.hideDone) {
				hideClosedSubtasks(lines, item, taskOf, opts.keep, hide);
			}
		}
		if (opts.dividers) blockDividers(items, hide, opts, dividers, folds);
	}

	// A fold replaces its lines, plus any hidden lines straight after it, so they aren't hidden twice.
	for (const fold of folds) for (let n = fold.line; n <= fold.last; n++) hide.delete(n);
	for (const fold of folds) while (hide.delete(fold.last + 1)) fold.last++;
	return { hidden: toRanges(hide), dividers, folds };
}

// Hidden by "hide completed" or by the role filter. Plain list items always stay.
function hidesItem(task: LineTask | null, opts: ViewOptions): boolean {
	if (!task) return false;
	if (opts.hideDone && isClosed(task)) return true;
	return opts.roles.size > 0 && !opts.roles.has(task.role);
}

// True if any line from `start` to `end` is in `keep`.
function touches(start: number, end: number, keep: ReadonlySet<number>): boolean {
	for (let n = start; n <= end; n++) if (keep.has(n)) return true;
	return false;
}

// Ticked subtasks inside an item that stays: hide each with the lines nested under it.
function hideClosedSubtasks(lines: string[], item: Item, taskOf: (line: string) => LineTask | null, keep: ReadonlySet<number>, hide: Set<number>): void {
	for (let n = item.start + 1; n <= item.end; n++) {
		const task = taskOf(lines[n]);
		if (!task || !isClosed(task)) continue;
		let last = n;
		while (last + 1 <= item.end && indentOf(lines[last + 1]) > indentOf(lines[n])) last++;
		if (!touches(n, last, keep)) for (let k = n; k <= last; k++) hide.add(k);
		n = last;
	}
}

// One divider above each run of same-role tasks, only in lists with two or more roles.
// Plain list items join the run above them. A run with every task hidden gets no divider.
// A collapsed run becomes a fold instead, unless the cursor is inside it.
function blockDividers(items: Item[], hide: Set<number>, opts: ViewOptions, dividers: Divider[], folds: Fold[]): void {
	const roles = new Set(items.flatMap((item) => (item.task ? [item.task.role] : [])));
	if (roles.size < 2) return;

	// Split into runs.
	const runs: { role: string; items: Item[] }[] = [];
	for (const item of items) {
		const current = runs[runs.length - 1];
		if (!item.task) current?.items.push(item);
		else if (current?.role === item.task.role) current.items.push(item);
		else runs.push({ role: item.task.role, items: [item] });
	}

	// Count and place.
	for (const run of runs) {
		const first = run.items.find((item) => item.task && !hide.has(item.start));
		if (!first) continue;
		const tasks = run.items.flatMap((item) => (item.task ? [item.task] : []));
		const counts = {
			role: run.role,
			done: tasks.filter((t) => t.state === 'done').length,
			total: tasks.filter((t) => t.state !== 'cancelled').length,
		};
		const start = run.items[0].start;
		const end = run.items[run.items.length - 1].end;
		if (opts.collapsed.has(run.role) && !touches(start, end, opts.keep)) folds.push({ ...counts, line: start, last: end });
		else dividers.push({ ...counts, line: first.start });
	}
}

// Line numbers -> sorted inclusive ranges, e.g. {3,4,5,9} -> [[3,5],[9,9]].
function toRanges(lines: Set<number>): Array<[number, number]> {
	const out: Array<[number, number]> = [];
	for (const n of [...lines].sort((a, b) => a - b)) {
		const last = out[out.length - 1];
		if (last && last[1] === n - 1) last[1] = n;
		else out.push([n, n]);
	}
	return out;
}
