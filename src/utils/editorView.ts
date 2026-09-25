import type { Editor } from 'obsidian';
import type { EditorView } from '@codemirror/view';

// Obsidian's Editor wraps a CodeMirror 6 view but keeps it private; this is the only place we reach it.
export const editorViewOf = (editor: Editor): EditorView | undefined =>
	(editor as unknown as { cm?: EditorView }).cm;
