import { Menu } from 'obsidian';
import { Role } from '../models/types';
import { titleAndIcon } from '../utils/icon';
import type { TaskFilter } from './TaskFilter';

// Toolbar filter button: tick the roles to show (none ticked = all).
export function showFilterMenu(evt: MouseEvent, roles: Role[], filter: TaskFilter): void {
	const menu = new Menu();
	menu.addItem((i) => i.setTitle('All roles').setIcon('layers').setChecked(!filter.roles.size).onClick(() => filter.showAll()));
	menu.addSeparator();
	roles.forEach((role) =>
		menu.addItem((i) => titleAndIcon(i, role.name, role.icon)
			.setChecked(filter.roles.has(role.id))
			.onClick(() => filter.toggleRole(role.id))),
	);
	menu.showAtMouseEvent(evt);
}
