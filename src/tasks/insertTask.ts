import { Editor } from 'obsidian';

// Put `line` on its own line below the cursor and leave the cursor at its end.
export function insertTask(editor: Editor, line: string): void {
	const cursor = editor.getCursor();
	const current = editor.getLine(cursor.line);

	// Reuse the current line if it is empty, otherwise open a new one below.
	if (current.trim() === '') {
		editor.setLine(cursor.line, line);
		editor.setCursor({ line: cursor.line, ch: line.length });
	} else {
		const end = { line: cursor.line, ch: current.length };
		editor.replaceRange('\n' + line, end);
		editor.setCursor({ line: cursor.line + 1, ch: line.length });
	}
	editor.focus();
}
