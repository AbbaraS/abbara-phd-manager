import { Plugin } from 'obsidian';
import { EditorView } from '@codemirror/view';
import { nextTaskLine } from '../tasks/nextTaskLine';

// Enter at the end of a badge task starts a new task with the same badges.
// Listens before the editor does (capture phase), so plugins that also take over Enter,
// like Outliner's "Enhance the Enter key", can't get there first.
export function registerCarryOnEnter(plugin: Plugin, isOn: () => boolean): void {
	const onKeyDown = (evt: KeyboardEvent) => {
		if (!isOn() || !isPlainEnter(evt)) return;
		const target = evt.target instanceof HTMLElement ? evt.target : null;
		const editorEl = target?.closest<HTMLElement>('.cm-editor');
		if (!target || !editorEl) return;

		// Leave Enter to any open autocomplete popup ([[links]], tags, ...).
		if (target.ownerDocument.querySelector('.suggestion-container, .cm-tooltip-autocomplete')) return;

		const view = EditorView.findFromDOM(editorEl);
		if (view && handleEnter(view)) {
			evt.preventDefault();
			evt.stopPropagation();
		}
	};

	// Main window now, plus any pop-out windows opened later.
	plugin.registerDomEvent(document, 'keydown', onKeyDown, { capture: true });
	plugin.registerEvent(plugin.app.workspace.on('window-open', (win) =>
		plugin.registerDomEvent(win.doc, 'keydown', onKeyDown, { capture: true }),
	));
}

// Enter with no modifiers and not mid-way through typing an accented/IME character.
const isPlainEnter = (evt: KeyboardEvent) =>
	evt.key === 'Enter' && !evt.shiftKey && !evt.altKey && !evt.metaKey && !evt.ctrlKey
	&& !evt.isComposing && !evt.defaultPrevented;

// Returns true when we handled Enter, false to fall back to Obsidian's own behaviour.
function handleEnter(view: EditorView): boolean {
	const { state } = view;
	const cursor = state.selection.main;
	if (state.selection.ranges.length !== 1 || !cursor.empty) return false;

	// Only at the end of the line, so Enter mid-line still splits text normally.
	const line = state.doc.lineAt(cursor.head);
	if (cursor.head !== line.to) return false;

	const next = nextTaskLine(line.text);
	if (next === null) return false;

	// Empty task: clear it, like Obsidian does for an empty list item.
	if (next === '') {
		view.dispatch({ changes: { from: line.from, to: line.to, insert: '' }, userEvent: 'input' });
		return true;
	}

	const insert = '\n' + next;
	view.dispatch({
		changes: { from: line.to, insert },
		selection: { anchor: line.to + insert.length },
		scrollIntoView: true,
		userEvent: 'input',
	});
	return true;
}
