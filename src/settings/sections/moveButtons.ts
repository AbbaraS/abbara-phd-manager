import { setIcon } from 'obsidian';
import { moveItem } from '../../utils/move';
import type { SectionContext } from '../SettingsTab';

const MOVES = [['arrow-up', 'Move up', -1], ['arrow-down', 'Move down', 1]] as const;

// Up/down buttons that move `item` within `list` (the order the toolbar and task sort use).
export function moveButtons<T>(list: T[], item: T, ctx: SectionContext): HTMLElement {
	const box = createDiv({ cls: 'apm-move' });
	const index = list.indexOf(item);

	for (const [icon, label, delta] of MOVES) {
		const button = box.createEl('button', { cls: 'clickable-icon', attr: { 'aria-label': label } });
		setIcon(button, icon);
		button.disabled = index + delta < 0 || index + delta >= list.length;
		button.addEventListener('click', (evt) => {
			evt.preventDefault(); // inside a <summary>: don't open/close the role
			if (moveItem(list, index, delta)) ctx.saveAndRedraw();
		});
	}
	return box;
}
