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

// Put `line` before line `at` (or at the very end), then move the cursor to its end.
export function insertTaskAt(editor: Editor, line: string, at: number): void {
	const count = editor.lineCount();
	if (at < count) {
		editor.replaceRange(line + '\n', { line: at, ch: 0 });
	} else {
		const last = count - 1;
		editor.replaceRange('\n' + line, { line: last, ch: editor.getLine(last).length });
		at = count;
	}
	const end = { line: at, ch: line.length };
	editor.setCursor(end);
	editor.scrollIntoView({ from: end, to: end }, true);
	editor.focus();
}
