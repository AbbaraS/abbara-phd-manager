import { listBlocks } from './listBlocks';
import { SortKey, compareKeys } from './sortKey';

// Replace lines [start, end) with `lines`.
export interface LineEdit {
	start: number;
	end: number;
	lines: string[];
}

// Edits that put every list in order, only for blocks that actually change.
// Subtasks move with their parent; ties keep their current order.
export function sortEdits(lines: string[], keyOf: (line: string) => SortKey): LineEdit[] {
	const edits: LineEdit[] = [];
	for (const block of listBlocks(lines)) {
		if (block.items.length < 2) continue;
		const sorted = block.items
			.map((item) => ({ item, key: keyOf(item.lines[0]) }))
			.sort((a, b) => compareKeys(a.key, b.key))
			.flatMap(({ item }) => item.lines);

		const end = block.start + sorted.length;
		if (sorted.some((line, i) => line !== lines[block.start + i])) edits.push({ start: block.start, end, lines: sorted });
	}
	return edits;
}

// Whole note text, sorted.
export function sortText(text: string, keyOf: (line: string) => SortKey): string {
	const lines = text.split('\n');
	for (const edit of sortEdits(lines, keyOf).reverse()) {
		lines.splice(edit.start, edit.end - edit.start, ...edit.lines);
	}
	return lines.join('\n');
}
