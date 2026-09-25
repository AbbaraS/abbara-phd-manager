import { Plugin } from 'obsidian';
import { EditorView } from '@codemirror/view';
import { Role } from '../models/types';
import { buildBadgeIndex } from '../models/badgeIndex';
import { readTask } from '../tasks/readTask';
import { onEveryDocument } from './domEvents';
import { showOptionMenu } from './optionMenu';
import { showProjectMenu } from './projectMenu';

// Clicking a badge on a task opens a dropdown to change it:
// role/project badge -> project, type badge -> type, status badge -> status.
export function registerBadgeClick(plugin: Plugin, getRoles: () => Role[]): void {
	// The clicked badge of ours on a task line, or null for anything else.
	const findBadge = (evt: MouseEvent) => {
		if (evt.button !== 0 || !(evt.target instanceof HTMLElement)) return null;
		const el = evt.target.closest<HTMLElement>('.cm-editor .inline-badge[data-inline-badge]');
		const view = el && EditorView.findFromDOM(el.closest<HTMLElement>('.cm-editor')!);
		if (!el || !view) return null;

		const roles = getRoles();
		const index = buildBadgeIndex(roles);
		const entry = index.get(el.dataset.inlineBadge ?? '');
		const line = view.state.doc.lineAt(view.posAtDOM(el));
		return entry && readTask(line.text, index) ? { kind: entry.kind, view, line, roles } : null;
	};

	// Stop the editor moving the cursor into the badge (which would turn it back into text).
	onEveryDocument(plugin, 'mousedown', (evt) => {
		if (findBadge(evt)) evt.preventDefault();
	});

	onEveryDocument(plugin, 'click', (evt) => {
		const hit = findBadge(evt);
		if (!hit) return;

		const { kind, view, line, roles } = hit;
		const at = { x: evt.clientX, y: evt.clientY };
		const write = (text: string) => view.dispatch({ changes: { from: line.from, to: line.to, insert: text }, userEvent: 'input' });
		const shown = kind === 'role' || kind === 'project'
			? showProjectMenu(at, line.text, roles, write)
			: showOptionMenu(at, kind, line.text, roles, write);
		if (shown) {
			evt.preventDefault();
			evt.stopPropagation();
		}
	});
}
