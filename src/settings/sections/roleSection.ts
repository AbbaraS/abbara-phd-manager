import { Setting, setIcon } from 'obsidian';
import { Role } from '../../models/types';
import { slugify, uniqueId } from '../../utils/ids';
import { renderProject } from './projectSection';
import { renderTypeList } from './typeList';
import type { SectionContext } from '../SettingsTab';

// Collapsible block for one role: details, projects and types.
export function renderRole(el: HTMLElement, roles: Role[], role: Role, ctx: SectionContext): void {
	const details = el.createEl('details', { cls: 'apm-role' });
	details.style.setProperty('--apm-role-color', role.color);
	details.open = ctx.openRoles.has(role.id);
	details.addEventListener('toggle', () => {
		if (details.open) ctx.openRoles.add(role.id);
		else ctx.openRoles.delete(role.id);
	});

	// Summary line: coloured icon + name.
	const summary = details.createEl('summary', { cls: 'apm-role-summary' });
	setIcon(summary.createSpan({ cls: 'apm-role-icon' }), role.icon);
	summary.createSpan({ text: role.name || 'Untitled role' });

	// Basics.
	new Setting(details).setName('Name').addText((t) => t.setValue(role.name).onChange((v) => {
		role.name = v;
		ctx.save();
	}));
	new Setting(details)
		.setName('Badge key')
		.setDesc('Used in badge names. Changing it breaks badges already in your notes.')
		.addText((t) => t.setValue(role.id).onChange((v) => {
			role.id = slugify(v) || role.id;
			ctx.save();
		}));
	new Setting(details)
		.setName('Icon')
		.setDesc('Lucide icon name, e.g. book-heart.')
		.addText((t) => t.setValue(role.icon).onChange((v) => {
			role.icon = v.trim();
			ctx.save();
		}));
	new Setting(details)
		.setName('Theme colour')
		.setDesc('Projects get shades of this colour.')
		.addColorPicker((c) => c.setValue(role.color).onChange((v) => {
			role.color = v;
			ctx.saveAndRedraw();
		}));

	// Projects.
	details.createEl('h5', { text: 'Projects' });
	role.projects.forEach((project) => renderProject(details, role, project, ctx));
	new Setting(details).addButton((b) => b.setButtonText('Add project').onClick(() => {
		const id = uniqueId('project', role.projects.map((p) => p.id));
		role.projects.push({ id, name: 'New project', color: '', types: [] });
		ctx.saveAndRedraw();
	}));

	// Role-wide task types.
	details.createEl('h5', { text: 'Task types' });
	renderTypeList(details, role.types, role.color, ctx);

	// Danger zone.
	new Setting(details).addButton((b) => b.setButtonText('Delete role').setWarning().onClick(() => {
		roles.splice(roles.indexOf(role), 1);
		ctx.saveAndRedraw();
	}));
}
