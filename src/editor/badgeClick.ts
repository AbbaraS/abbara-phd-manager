import { Plugin } from 'obsidian';
import { EditorView } from '@codemirror/view';
import { Role } from '../models/types';
import { buildBadgeIndex } from '../models/badgeIndex';
import { OptionKind } from '../models/resolve';
import { onEveryDocument } from './domEvents';
import { showOptionMenu } from './optionMenu';

// Clicking a type or status badge in the editor opens a dropdown to change it.
export function registerBadgeClick(plugin: Plugin, getRoles: () => Role[]): void {
	// The clicked type/status badge, or null for anything else.
	const findBadge = (evt: MouseEvent): { el: HTMLElement; kind: OptionKind } | null => {
		if (evt.button !== 0 || !(evt.target instanceof HTMLElement)) return null;
		const el = evt.target.closest<HTMLElement>('.cm-editor .inline-badge[data-inline-badge]');
		const entry = el && buildBadgeIndex(getRoles()).get(el.dataset.inlineBadge ?? '');
		return el && entry && (entry.kind === 'type' || entry.kind === 'status') ? { el, kind: entry.kind } : null;
	};

	// Stop the editor moving the cursor into the badge (which would turn it back into text).
	onEveryDocument(plugin, 'mousedown', (evt) => {
		if (findBadge(evt)) evt.preventDefault();
	});

	onEveryDocument(plugin, 'click', (evt) => {
		const hit = findBadge(evt);
		const view = hit && EditorView.findFromDOM(hit.el.closest<HTMLElement>('.cm-editor')!);
		if (!hit || !view) return;

		const line = view.state.doc.lineAt(view.posAtDOM(hit.el));
		const shown = showOptionMenu({ x: evt.clientX, y: evt.clientY }, hit.kind, line.text, getRoles(), (text) =>
			view.dispatch({ changes: { from: line.from, to: line.to, insert: text }, userEvent: 'input' }),
		);
		if (shown) {
			evt.preventDefault();
			evt.stopPropagation();
		}
	});
}
