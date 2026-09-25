import { WidgetType } from '@codemirror/view';
import { setTooltip } from 'obsidian';
import { setIconOrEmoji } from '../utils/icon';

// What a divider shows.
export interface DividerLook {
	role: string;   // role id ('' = tasks with no role)
	name: string;
	icon: string;   // Lucide name or emoji
	color: string;  // hex
	done: number;
	total: number;
	active: boolean; // this role is the current filter
}

// Role label drawn above a group of tasks. Not part of the note's text.
export class DividerWidget extends WidgetType {
	constructor(readonly look: DividerLook, private onClick: (role: string) => void) {
		super();
	}

	eq(other: DividerWidget): boolean {
		const a = this.look, b = other.look;
		return a.role === b.role && a.name === b.name && a.icon === b.icon && a.color === b.color
			&& a.done === b.done && a.total === b.total && a.active === b.active;
	}

	toDOM(): HTMLElement {
		const { look } = this;
		// Outer block for the editor; the row inside does the layout (the editor styles its direct children).
		const el = createDiv({ cls: 'apm-divider' });
		el.style.setProperty('--apm-role-color', look.color);
		const row = el.createDiv({ cls: 'apm-divider-row' });

		// Label: click to show only this role (click again for all).
		const label = row.createEl('button', { cls: 'apm-divider-label' });
		label.toggleClass('is-active', look.active);
		setIconOrEmoji(label.createSpan({ cls: 'apm-divider-icon' }), look.icon);
		label.createSpan({ text: look.name });
		setTooltip(label, look.active ? 'Show all roles' : `Show only ${look.name}`);
		label.addEventListener('click', (evt) => {
			evt.preventDefault();
			this.onClick(look.role);
		});

		row.createDiv({ cls: 'apm-divider-rule' });
		if (look.total) row.createSpan({ cls: 'apm-divider-count', text: `${look.done}/${look.total} done` });
		return el;
	}

	// Rough height so the editor can lay out before measuring.
	get estimatedHeight(): number {
		return 28;
	}

	// Clicks stay with the label instead of moving the cursor.
	ignoreEvent(): boolean {
		return true;
	}
}
