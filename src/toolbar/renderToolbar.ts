import { setIcon } from 'obsidian';
import { Role } from '../models/types';

export const TOOLBAR_CLASS = 'apm-toolbar';

// Build the toolbar: one coloured button per role.
export function renderToolbar(roles: Role[], onRoleClick: (evt: MouseEvent, role: Role) => void): HTMLElement {
	const bar = createDiv({ cls: TOOLBAR_CLASS });

	for (const role of roles) {
		const button = bar.createEl('button', { cls: 'apm-role-button', attr: { 'aria-label': `New ${role.name} task` } });
		button.style.setProperty('--apm-role-color', role.color);
		setIcon(button.createSpan({ cls: 'apm-role-icon' }), role.icon);
		button.createSpan({ cls: 'apm-role-name', text: role.name });
		button.addEventListener('click', (evt) => onRoleClick(evt, role));
	}
	return bar;
}
