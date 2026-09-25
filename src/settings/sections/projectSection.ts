import { Setting } from 'obsidian';
import { Project, Role } from '../../models/types';
import { projectColor, projectIcon, projectKey } from '../../models/resolve';
import { daysUntil } from '../../utils/dates';
import type { SectionContext } from '../SettingsTab';
import { collapsible } from './collapsible';
import { sectionTitle } from './sectionTitle';
import { iconField } from './iconField';
import { moveButtons } from './moveButtons';
import { renderOptionList } from './optionList';
import { visibilityButton } from './visibilityButton';

// Collapsible block for one project, plus its own types/statuses when it overrides the role's.
export function renderProject(el: HTMLElement, role: Role, project: Project, ctx: SectionContext): void {
	const shade = projectColor(role, project);
	const owner = `${role.id}/${project.id}`;
	const { details, summary } = collapsible(el, `project:${owner}`, 'apm-project', ctx);
	details.style.setProperty('--apm-swatch-color', shade);
	details.toggleClass('apm-hidden', project.hidden);

	// Summary line: the project badge as notes show it, due date, then show/hide and move buttons.
	const drawTitle = sectionTitle(summary, 'apm-swatch', ctx);
	const due = summary.createSpan({ cls: 'apm-section-meta' });
	const refreshTitle = () => {
		drawTitle({
			key: projectKey(role, project),
			label: `${role.name} | ${project.name}`, // same label the synced badge gets
			icon: projectIcon(role, project),
			color: projectColor(role, project),
			name: project.name || 'Untitled project',
		});
		due.setText(dueText(project.deadline));
	};
	refreshTitle();
	if (project.hidden) summary.createSpan({ cls: 'apm-hidden-tag', text: 'hidden' });
	const actions = summary.createDiv({ cls: 'apm-summary-actions' });
	actions.append(visibilityButton(project.hidden, () => {
		project.hidden = !project.hidden;
		ctx.saveAndRedraw();
	}));
	actions.append(moveButtons(role.projects, project, ctx));

	// Basics.
	new Setting(details)
		.setName('Name')
		.setDesc(`Badge key: ${role.id}-${project.id}`)
		.addText((t) => t.setValue(project.name).onChange((v) => {
			project.name = v;
			refreshTitle();
			ctx.save();
		}));
	iconField(details, 'Lucide icon name or an emoji. Empty = the role icon.', project.icon, role.icon, (icon) => {
		project.icon = icon;
		refreshTitle();
		ctx.save();
	});
	new Setting(details)
		.setName('Deadline')
		.setDesc('Optional. Shows a card in the progress block.')
		.addText((t) => {
			t.inputEl.type = 'date';
			t.setValue(project.deadline).onChange((v) => {
				project.deadline = v;
				refreshTitle();
				ctx.save();
			});
		});
	new Setting(details)
		.setName('Colour')
		.setDesc(project.color ? 'Custom colour.' : 'Auto shade of the role colour.')
		.addColorPicker((c) => c.setValue(shade).onChange((v) => {
			project.color = v;
			details.style.setProperty('--apm-swatch-color', v);
			refreshTitle();
			ctx.save();
		}))
		.addExtraButton((b) => b.setIcon('rotate-ccw').setTooltip('Use auto shade').onClick(() => {
			project.color = '';
			ctx.saveAndRedraw();
		}));

	// Own lists: start from a copy of the role's so there is something to edit.
	new Setting(details)
		.setName('Own task types')
		.setDesc("Off = uses the role's task types.")
		.addToggle((t) => t.setValue(project.types.length > 0).onChange((on) => {
			project.types = on ? structuredClone(role.types) : [];
			ctx.saveAndRedraw();
		}));
	if (project.types.length) renderOptionList(details, 'type', role, project, ctx);
	new Setting(details)
		.setName('Own statuses')
		.setDesc("Off = uses the role's statuses.")
		.addToggle((t) => t.setValue(project.statuses.length > 0).onChange((on) => {
			project.statuses = on ? structuredClone(role.statuses) : [];
			ctx.saveAndRedraw();
		}));
	if (project.statuses.length) renderOptionList(details, 'status', role, project, ctx);

	// Danger zone.
	new Setting(details)
		.setDesc('Deleting removes its badges. To keep them, hide the project with the eye button instead.')
		.addButton((b) => b.setButtonText('Delete project').setWarning().onClick(() => {
			role.projects.remove(project);
			ctx.saveAndRedraw();
		}));
}

// "due in 38 days" for the summary line, or '' with no deadline.
function dueText(deadline: string): string {
	const days = daysUntil(deadline);
	if (days === null) return '';
	if (days === 0) return 'due today';
	return days > 0 ? `due in ${days} days` : `${-days} days overdue`;
}
