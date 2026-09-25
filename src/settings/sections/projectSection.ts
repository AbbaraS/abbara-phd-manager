import { Setting, setIcon } from 'obsidian';
import { Project, Role } from '../../models/types';
import { projectColor, projectIcon } from '../../models/resolve';
import { renderOptionList } from './optionList';
import { moveButtons } from './moveButtons';
import { daysUntil } from '../../utils/dates';
import type { SectionContext } from '../SettingsTab';

// One project row, plus its own types/statuses when it overrides the role's.
export function renderProject(el: HTMLElement, role: Role, project: Project, ctx: SectionContext): void {
	const shade = projectColor(role, project);
	const index = role.projects.indexOf(project);

	const row = new Setting(el)
		.setClass('apm-project-row')
		.setName(project.name || 'Untitled project')
		.setDesc(`Badge key: ${role.id}-${project.id}${dueText(project.deadline)}`)
		.addText((t) => t.setPlaceholder('Name').setValue(project.name).onChange((v) => {
			project.name = v;
			ctx.save();
		}))
		.addText((t) => t.setPlaceholder(`Icon (${role.icon})`).setValue(project.icon).onChange((v) => {
			project.icon = v.trim();
			ctx.save();
		}))
		.addText((t) => {
			t.inputEl.type = 'date';
			t.inputEl.title = 'Deadline (optional)';
			t.setValue(project.deadline).onChange((v) => {
				project.deadline = v;
				ctx.save();
			});
		})
		.addColorPicker((c) => c.setValue(shade).onChange((v) => {
			project.color = v;
			ctx.save();
		}))
		.addExtraButton((b) => b.setIcon('rotate-ccw').setTooltip('Use auto shade').onClick(() => {
			project.color = '';
			ctx.saveAndRedraw();
		}))
		.addToggle((t) => t.setTooltip('Own task types').setValue(project.types.length > 0).onChange((on) => {
			// Start from a copy of the role's list so there is something to edit.
			project.types = on ? structuredClone(role.types) : [];
			ctx.saveAndRedraw();
		}))
		.addToggle((t) => t.setTooltip('Own statuses').setValue(project.statuses.length > 0).onChange((on) => {
			project.statuses = on ? structuredClone(role.statuses) : [];
			ctx.saveAndRedraw();
		}))
		.addExtraButton((b) => b
			.setIcon(project.hidden ? 'eye-off' : 'eye')
			.setTooltip(project.hidden ? 'Hidden from the toolbar (badges kept). Click to show.' : 'Hide from the toolbar, keep badges')
			.onClick(() => {
				project.hidden = !project.hidden;
				ctx.saveAndRedraw();
			}))
		.addExtraButton((b) => b.setIcon('trash').setTooltip('Delete project (removes its badges)').onClick(() => {
			role.projects.splice(index, 1);
			ctx.saveAndRedraw();
		}));

	// Colour swatch with the project icon next to the name.
	const swatch = createSpan({ cls: 'apm-swatch', attr: { style: `--apm-swatch-color:${shade}` } });
	setIcon(swatch, projectIcon(role, project));
	row.nameEl.prepend(swatch);
	row.controlEl.prepend(moveButtons(role.projects, project, ctx));
	row.settingEl.toggleClass('apm-hidden', project.hidden);

	// Project-level lists, only when it has its own.
	const nested = (title: string, render: (box: HTMLElement) => void) => {
		const box = el.createDiv({ cls: 'apm-nested' });
		box.createEl('h6', { text: `${project.name} ${title}` });
		render(box);
	};
	if (project.types.length) nested('types', (box) => renderOptionList(box, 'type', project.types, shade, ctx));
	if (project.statuses.length) nested('statuses', (box) => renderOptionList(box, 'status', project.statuses, shade, ctx));
}

// " · due in 38 days" for the row description, or '' with no deadline.
function dueText(deadline: string): string {
	const days = daysUntil(deadline);
	if (days === null) return '';
	if (days === 0) return ' · due today';
	return days > 0 ? ` · due in ${days} days` : ` · ${-days} days overdue`;
}
