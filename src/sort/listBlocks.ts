// Finding lists in a note's lines (pure text, no Obsidian).

// A list item: "- ", "* ", "+ ", "1. " or "1) ", with any indent.
const LIST_ITEM = /^\s*(?:[-*+]|\d+[.)])\s/;
const FENCE = /^\s*(```|~~~)/;

// One top-level item plus the deeper lines under it (subtasks, notes).
export interface ListItem {
	lines: string[];
}

// Items in a row, with no blank line or paragraph between them.
export interface ListBlock {
	start: number; // line number of the first item
	items: ListItem[];
}

const indentOf = (line: string) => line.length - line.trimStart().length;

// Every list block in the note (code blocks skipped).
export function listBlocks(lines: string[]): ListBlock[] {
	const blocks: ListBlock[] = [];
	let block: ListBlock | undefined;
	let base = 0;       // indent of the current block's top-level items
	let inFence = false;

	lines.forEach((line, i) => {
		// Code blocks: never sorted, and they end any list.
		if (FENCE.test(line)) {
			inFence = !inFence;
			block = undefined;
			return;
		}
		if (inFence) return;

		// Deeper line: belongs to the item above.
		const indent = indentOf(line);
		if (block && line.trim() && indent > base) {
			block.items[block.items.length - 1].lines.push(line);
			return;
		}

		// Top-level item: carry on the block, or start a new one.
		if (LIST_ITEM.test(line)) {
			if (!block || indent !== base) {
				block = { start: i, items: [] };
				base = indent;
				blocks.push(block);
			}
			block.items.push({ lines: [line] });
			return;
		}

		block = undefined; // blank line or paragraph ends the block
	});
	return blocks;
}
