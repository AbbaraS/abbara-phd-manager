import { Setting } from 'obsidian';
import { Role } from '../../models/types';
import { slugify } from '../../utils/ids';
import { blankProject } from '../../models/newProject';
import type { SectionContext } from '../SettingsTab';
import { collapsible } from './collapsible';
import { sectionTitle } from './sectionTitle';
import { roleKey } from '../../models/resolve';
import { iconField } from './iconField';
import { moveButtons } from './moveButtons';
import { renderOptionList } from './optionList';
import { renderProject } from './projectSection';
import { visibilityButton } from './visibilityButton';

// Collapsible block for one role: details, projects and types.
export function renderRole(el: HTMLElement, roles: Role[], role: Role, ctx: SectionContext): void {
	const { details, summary } = collapsible(el, `role:${role.id}`, 'apm-role', ctx);
	details.style.setProperty('--apm-role-color', role.color);
	details.toggleClass('apm-hidden', role.hidden);

	// == Summary line: the role badge as notes show it, then hidden tag, show/hide and move buttons.
	const drawTitle = sectionTitle(summary, 'apm-role-icon', ctx);
	const refreshTitle = () => drawTitle({
		key: roleKey(role), label: role.name, icon: role.icon, color: role.color, name: role.name || 'Untitled role',
	});
	refreshTitle();
	if (role.hidden) summary.createSpan({ cls: 'apm-hidden-tag', text: 'hidden' });
	const actions = summary.createDiv({ cls: 'apm-summary-actions' });
	actions.append(visibilityButton(role.hidden, () => {
		role.hidden = !role.hidden;
		ctx.saveAndRedraw();
	}));
	actions.append(moveButtons(roles, role, ctx));

	// == Basics.
	new Setting(details).setName('Name').addText((t) => t.setValue(role.name).onChange((v) => {
		role.name = v;
		refreshTitle();
		ctx.save();
	}));
	new Setting(details)
		.setName('Badge key')
		.setDesc('Used in badge names. Changing it breaks badges already in your notes.')
		.addText((t) => t.setValue(role.id).onChange((v) => {
			role.id = slugify(v) || role.id;
			ctx.save();
		}));
	iconField(details, 'Lucide icon name or an emoji, e.g. book-heart or 📚.', role.icon, '', (icon) => {
		role.icon = icon;
		refreshTitle();
		ctx.save();
	});
	new Setting(details)
		.setName('Theme colour')
		.setDesc('Projects get shades of this colour.')
		.addColorPicker((c) => c.setValue(role.color).onChange((v) => {
			role.color = v;
			ctx.saveAndRedraw();
		}));

	// == Projects.
	details.createEl('h5', { text: 'Projects' });
	role.projects.forEach((project) => renderProject(details, role, project, ctx));
	new Setting(details).addButton((b) => b.setButtonText('Add project').onClick(() => {
		const project = blankProject(role, 'New project');
		role.projects.push(project);
		ctx.openSections.add(`project:${role.id}/${project.id}`);
		ctx.saveAndRedraw();
	}));

	// == Role-wide task types and statuses.
	details.createEl('h5', { text: 'Role-wide Task types' });
	details.createDiv({ cls: 'apm-hint', text: 'Shown as rounded chips in the picked colour.' });
	renderOptionList(details, 'type', role, undefined, ctx);
	details.createEl('h5', { text: 'Task statuses' });
	details.createDiv({ cls: 'apm-hint', text: 'Shown as solid badges. Click a status or type badge in a task to change it.' });
	renderOptionList(details, 'status', role, undefined, ctx);

	// Danger zone.
	new Setting(details)
		.setDesc('Deleting also removes its badges, so past tasks show plain text. To keep them, hide the role with the eye button instead.')
		.addButton((b) => b.setButtonText('Delete role').setWarning().onClick(() => {
			roles.splice(roles.indexOf(role), 1);
			ctx.saveAndRedraw();
		}));
}
