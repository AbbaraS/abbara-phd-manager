import { Setting } from 'obsidian';
import { Project, Role } from '../../models/types';
import { projectColor } from '../../models/resolve';
import { renderTypeList } from './typeList';
import type { SectionContext } from '../SettingsTab';

// One project row, plus its own types when it overrides the role's.
export function renderProject(el: HTMLElement, role: Role, project: Project, ctx: SectionContext): void {
	const shade = projectColor(role, project);
	const index = role.projects.indexOf(project);

	const row = new Setting(el)
		.setClass('apm-project-row')
		.setName(project.name || 'Untitled project')
		.setDesc(`Badge key: ${role.id}-${project.id}`)
		.addText((t) => t.setPlaceholder('Name').setValue(project.name).onChange((v) => {
			project.name = v;
			ctx.save();
		}))
		.addColorPicker((c) => c.setValue(shade).onChange((v) => {
			project.color = v;
			ctx.save();
		}))
		.addExtraButton((b) => b.setIcon('rotate-ccw').setTooltip('Use auto shade').onClick(() => {
			project.color = '';
			ctx.saveAndRedraw();
		}))
		.addToggle((t) => t.setTooltip('Own task types').setValue(project.types.length > 0).onChange((on) => {
			// Start from a copy of the role's types so there is something to edit.
			project.types = on ? structuredClone(role.types) : [];
			ctx.saveAndRedraw();
		}))
		.addExtraButton((b) => b.setIcon('trash').setTooltip('Delete project').onClick(() => {
			role.projects.splice(index, 1);
			ctx.saveAndRedraw();
		}));

	// Colour swatch next to the name.
	row.nameEl.prepend(createSpan({ cls: 'apm-swatch', attr: { style: `background:${shade}` } }));

	if (project.types.length) {
		const typesEl = el.createDiv({ cls: 'apm-nested' });
		typesEl.createEl('h6', { text: `${project.name} types` });
		renderTypeList(typesEl, project.types, shade, ctx);
	}
}
