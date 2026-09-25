import { setIcon } from 'obsidian';
import { Role } from '../models/types';

export const TOOLBAR_CLASS = 'apm-toolbar';

// Build the toolbar: one coloured button per role, and a sort button on the right.
export function renderToolbar(roles: Role[], onRoleClick: (evt: MouseEvent, role: Role) => void, onSort: () => void): HTMLElement {
	const bar = createDiv({ cls: TOOLBAR_CLASS });

	for (const role of roles) {
		const button = bar.createEl('button', { cls: 'apm-role-button', attr: { 'aria-label': `New ${role.name} task` } });
		button.style.setProperty('--apm-role-color', role.color);
		setIcon(button.createSpan({ cls: 'apm-role-icon' }), role.icon);
		button.createSpan({ cls: 'apm-role-name', text: role.name });
		button.addEventListener('click', (evt) => onRoleClick(evt, role));
	}

	const sort = bar.createEl('button', {
		cls: 'apm-sort-button clickable-icon',
		attr: { 'aria-label': 'Sort tasks by role, project, due date, created date' },
	});
	setIcon(sort, 'arrow-down-wide-narrow');
	sort.addEventListener('click', onSort);
	return bar;
}
