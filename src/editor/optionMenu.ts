import { Menu } from 'obsidian';
import { Role } from '../models/types';
import { OptionKind, optionKey, optionsFor } from '../models/resolve';
import { buildBadgeIndex } from '../models/badgeIndex';
import { insertAfter, readTask } from '../tasks/readTask';
import { setBadge } from '../tasks/taskBadges';

type Point = { x: number; y: number };

// Menu title for the "clear" item, per kind.
const NONE: Record<OptionKind, string> = { type: 'No type', status: 'No status' };

// Show a menu of types or statuses for the task `line`; `write` gets the edited line.
// Returns false when the line isn't one of our tasks or has nothing to offer.
export function showOptionMenu(at: Point, kind: OptionKind, line: string, roles: Role[], write: (text: string) => void): boolean {
	const task = readTask(line, buildBadgeIndex(roles));
	if (!task) return false;
	const options = optionsFor(kind, task.role, task.project);
	if (!options.length) return false;

	const current = task.keys[kind];
	const pick = (key: string | null) => write(setBadge(line, current, key, insertAfter(task, kind)));

	const menu = new Menu();
	for (const option of options) {
		const key = optionKey(kind, task.role, option, task.project);
		menu.addItem((i) => i.setTitle(option.name).setIcon(option.icon).setChecked(key === current).onClick(() => pick(key)));
	}
	if (current) {
		menu.addSeparator();
		menu.addItem((i) => i.setTitle(NONE[kind]).setIcon('x').onClick(() => pick(null)));
	}
	menu.showAtPosition(at);
	return true;
}
