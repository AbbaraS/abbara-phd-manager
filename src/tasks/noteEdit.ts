import type { TFile } from 'obsidian';
import type ProjectManagerPlugin from '../main';
import { buildBadgeIndex } from '../models/badgeIndex';
import type { TaskRow } from '../models/taskRows';
import { listBlocks } from '../sort/listBlocks';
import { orderedSpot } from './orderedSpot';
import { readTask } from './readTask';
import { idBadge, isTaskLine, taskIdOf } from './taskBadges';

// Puts `line` into the text: at the top of its role's group (`top`), else at its role/project spot,
// else at the end. Pure text, no Obsidian.
export function insertTaskLine(text: string, line: string, spot: (lines: string[]) => number | null): string {
	const lines = text.split('\n');
	const at = spot(lines);
	if (at !== null) lines.splice(at, 0, line);
	else if (lines[lines.length - 1] === '') lines.splice(lines.length - 1, 0, line);
	else lines.push(line);
	return lines.join('\n');
}

// Adds a task to a daily note unless it already has it. `top` puts it first among its role's tasks.
export async function addTaskToNote(plugin: ProjectManagerPlugin, file: TFile, line: string, top = false): Promise<void> {
	const id = taskIdOf(line);
	const index = buildBadgeIndex(plugin.settings.roles);
	const keyOf = plugin.sorter.keyMaker();
	const isRoleTask = (text: string) => readTask(text, index) !== null;
	const roleOf = readTask(line, index)?.role.id;

	await plugin.app.vault.process(file, (text) => {
		if (id && text.includes(idBadge(id))) return text;
		return insertTaskLine(text, line, (lines) => {
			if (top && roleOf) {
				const first = firstOfRole(lines, (item) => readTask(item, index)?.role.id === roleOf, isRoleTask);
				if (first !== null) return first;
			}
			return orderedSpot(lines, line, keyOf, isRoleTask, -1);
		});
	});
}

// Line of the first task of the role, in the task list that has the most tasks of ours (null = none).
function firstOfRole(lines: string[], isRole: (line: string) => boolean, isOurs: (line: string) => boolean): number | null {
	const lists = listBlocks(lines).map((block) => ({ block, ours: block.items.filter((item) => isOurs(item.lines[0])).length }));
	const best = lists.filter((l) => l.ours > 0).sort((a, b) => b.ours - a.ours)[0];
	if (!best) return null;
	let at = best.block.start;
	for (const item of best.block.items) {
		if (isRole(item.lines[0])) return at;
		at += item.lines.length;
	}
	return null;
}

// Ticks or unticks the newest copy of a dashboard task (found by its id, else by its line).
export async function setTaskMark(plugin: ProjectManagerPlugin, row: TaskRow, mark: ' ' | 'x'): Promise<void> {
	const file = plugin.app.vault.getAbstractFileByPath(row.path);
	if (!file || !('extension' in file)) return;
	await plugin.app.vault.process(file as TFile, (text) => {
		const lines = text.split('\n');
		const at = row.id ? lines.findIndex((l) => isTaskLine(l) && taskIdOf(l) === row.id) : row.line;
		if (at < 0 || !lines[at] || !isTaskLine(lines[at])) return text;
		lines[at] = lines[at].replace(/^(\s*[-*+] \[).(\])/, `$1${mark}$2`);
		return lines.join('\n');
	});
}
