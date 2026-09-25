import { setIcon, setTooltip } from 'obsidian';
import { Role } from '../models/types';
import { setIconOrEmoji } from '../utils/icon';

export const TOOLBAR_CLASS = 'apm-toolbar';

// What the toolbar shows and does.
export interface ToolbarSpec {
	roles: Role[];                 // one "new task" button each
	hideDone: boolean;             // completed tasks are hidden
	filterNames: string[];         // roles in the filter (empty = all)
	onRoleClick: (evt: MouseEvent, role: Role) => void;
	onToggleDone: () => void;
	onFilter: (evt: MouseEvent) => void;
	onSort: () => void;
}

// Build the toolbar: one coloured button per role, then eye, filter and sort buttons on the right.
export function renderToolbar(spec: ToolbarSpec): HTMLElement {
	const bar = createDiv({ cls: TOOLBAR_CLASS });

	for (const role of spec.roles) {
		const button = bar.createEl('button', { cls: 'apm-role-button', attr: { 'aria-label': `New ${role.name} task` } });
		button.style.setProperty('--apm-role-color', role.color);
		setIconOrEmoji(button.createSpan({ cls: 'apm-role-icon' }), role.icon);
		button.createSpan({ cls: 'apm-role-name', text: role.name });
		button.addEventListener('click', (evt) => spec.onRoleClick(evt, role));
	}

	// Right-hand group.
	const tools = bar.createDiv({ cls: 'apm-toolbar-tools' });
	const eye = iconButton(tools, spec.hideDone ? 'eye-off' : 'eye', spec.hideDone ? 'Show completed tasks' : 'Hide completed tasks', spec.hideDone);
	eye.addEventListener('click', spec.onToggleDone);

	const filtering = spec.filterNames.length > 0;
	const filter = iconButton(tools, 'list-filter', filtering ? `Showing ${spec.filterNames.join(', ')}` : 'Show only some roles', filtering);
	if (filtering) filter.createSpan({ cls: 'apm-tool-count', text: String(spec.filterNames.length) });
	filter.addEventListener('click', spec.onFilter);

	const sort = iconButton(tools, 'arrow-down-wide-narrow', 'Sort tasks by role, project, due date, created date', false);
	sort.addEventListener('click', spec.onSort);
	return bar;
}

// Small icon button, highlighted when `active`.
function iconButton(parent: HTMLElement, icon: string, tooltip: string, active: boolean): HTMLElement {
	const button = parent.createEl('button', { cls: 'apm-tool-button clickable-icon' });
	button.toggleClass('is-active', active);
	setIcon(button, icon);
	setTooltip(button, tooltip);
	return button;
}
