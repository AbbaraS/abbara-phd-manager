import { Plugin } from 'obsidian';
import { Role } from '../models/types';
import { OptionKind, optionsFor } from '../models/resolve';
import { buildBadgeIndex } from '../models/badgeIndex';
import { readTask } from '../tasks/readTask';
import { onEveryDocument } from './domEvents';
import { showOptionMenu } from './optionMenu';

// Menu entry per kind: title and icon.
const ITEMS: [OptionKind, string, string][] = [
	['type', 'Set task type', 'tag'],
	['status', 'Set task status', 'circle-dot'],
];

// Right-click a task line to add or change its type / status (works when it has none yet).
export function registerTaskContextMenu(plugin: Plugin, getRoles: () => Role[]): void {
	// Where the right-click happened, so the follow-up menu opens there.
	let at = { x: 0, y: 0 };
	onEveryDocument(plugin, 'contextmenu', (evt) => (at = { x: evt.clientX, y: evt.clientY }));

	plugin.registerEvent(plugin.app.workspace.on('editor-menu', (menu, editor) => {
		const lineNo = editor.getCursor().line;
		const text = editor.getLine(lineNo);
		const task = readTask(text, buildBadgeIndex(getRoles()));
		if (!task) return;

		for (const [kind, title, icon] of ITEMS) {
			if (!optionsFor(kind, task.role, task.project).length) continue;
			menu.addItem((i) => i.setTitle(title).setIcon(icon).onClick(() => {
				// Defer so the right-click menu can close first.
				window.setTimeout(() => showOptionMenu(at, kind, text, getRoles(), (t) => editor.setLine(lineNo, t)), 0);
			}));
		}
	}));
}
