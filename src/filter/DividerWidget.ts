import { WidgetType } from '@codemirror/view';
import { setIcon } from 'obsidian';
import { tooltip } from '../utils/tooltip';
import { setIconOrEmoji } from '../utils/icon';

// What a divider shows.
export interface DividerLook {
	role: string;   // role id ('' = tasks with no role)
	name: string;
	icon: string;   // Lucide name or emoji
	color: string;  // hex
	done: number;
	total: number;
	active: boolean;    // this role is the current filter
	collapsed: boolean; // the group is folded into this divider
}

// What clicking a divider does.
export interface DividerActions {
	onFilter: (role: string) => void; // label: show only this role
	onToggle: (role: string) => void; // chevron: collapse / expand the group
}

// Role label drawn above a group of tasks (or in place of a collapsed group). Not part of the note's text.
export class DividerWidget extends WidgetType {
	constructor(readonly look: DividerLook, private actions: DividerActions) {
		super();
	}

	eq(other: DividerWidget): boolean {
		const a = this.look, b = other.look;
		return a.role === b.role && a.name === b.name && a.icon === b.icon && a.color === b.color
			&& a.done === b.done && a.total === b.total && a.active === b.active && a.collapsed === b.collapsed;
	}

	toDOM(): HTMLElement {
		const { look, actions } = this;
		// Outer block for the editor; the row inside does the layout (the editor styles its direct children).
		const el = createDiv({ cls: 'apm-divider' });
		el.toggleClass('is-collapsed', look.collapsed);
		el.style.setProperty('--apm-role-color', look.color);
		const row = el.createDiv({ cls: 'apm-divider-row' });

		// Chevron: fold the group away, or open it again.
		const chevron = row.createEl('button', { cls: 'apm-divider-chevron clickable-icon' });
		setIcon(chevron, look.collapsed ? 'chevron-right' : 'chevron-down');
		tooltip(chevron, look.collapsed ? `Expand ${look.name}` : `Collapse ${look.name}`);
		onClick(chevron, () => actions.onToggle(look.role));

		// Label: click to show only this role (click again for all).
		const label = row.createEl('button', { cls: 'apm-divider-label' });
		label.toggleClass('is-active', look.active);
		setIconOrEmoji(label.createSpan({ cls: 'apm-divider-icon' }), look.icon);
		label.createSpan({ text: look.name });
		tooltip(label, look.active ? 'Show all roles' : `Show only ${look.name}`);
		onClick(label, () => actions.onFilter(look.role));

		row.createDiv({ cls: 'apm-divider-rule' });
		if (look.total) row.createSpan({ cls: 'apm-divider-count', text: countText(look) });
		return el;
	}

	// Rough height so the editor can lay out before measuring.
	get estimatedHeight(): number {
		return 28;
	}

	// Clicks stay with the buttons instead of moving the cursor.
	ignoreEvent(): boolean {
		return true;
	}
}

// "2/7 done", plus how many are still open when the group is folded away.
function countText(look: DividerLook): string {
	const open = look.total - look.done;
	return look.collapsed && open ? `${open} open · ${look.done}/${look.total} done` : `${look.done}/${look.total} done`;
}

// Click handler that keeps the editor from reacting too.
function onClick(el: HTMLElement, run: () => void): void {
	el.addEventListener('mousedown', (evt) => evt.preventDefault());
	el.addEventListener('click', (evt) => {
		evt.preventDefault();
		evt.stopPropagation();
		run();
	});
}
