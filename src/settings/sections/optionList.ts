import { Setting } from 'obsidian';
import { Project, Role } from '../../models/types';
import { OptionKind, projectColor } from '../../models/resolve';
import { starterStatuses } from '../../defaults/statuses';
import { slugify, uniqueId } from '../../utils/ids';
import type { SectionContext } from '../SettingsTab';
import { renderOption } from './optionSection';

// Editable list of task types or statuses: the project's own list, or the role's when `project` is undefined.
export function renderOptionList(el: HTMLElement, kind: OptionKind, role: Role, project: Project | undefined, ctx: SectionContext): void {
	const owner = project ?? role;
	const list = kind === 'type' ? owner.types : owner.statuses;
	const base = project ? projectColor(role, project) : role.color; // auto colours are made from this
	const prefix = `${kind}:${role.id}${project ? `/${project.id}` : ''}`; // keeps section keys unique

	const box = el.createDiv({ cls: 'apm-option-list' });
	list.forEach((option) => renderOption(box, kind, role, project, list, option, base, `${prefix}/${option.id}`, ctx));

	// Add a new option with a unique id, opened ready to edit.
	const add = new Setting(box).addButton((b) => b.setButtonText(`Add ${kind}`).onClick(() => {
		const id = uniqueId(slugify(`New ${kind}`), list.map((t) => t.id));
		list.push({ id, name: `New ${kind}`, icon: 'circle', color: '' });
		ctx.openSections.add(`${prefix}/${id}`);
		ctx.saveAndRedraw();
	}));

	// Quick start for an empty status list.
	if (kind === 'status' && !list.length) {
		add.addButton((b) => b.setButtonText('Add starter statuses').onClick(() => {
			list.push(...starterStatuses());
			ctx.saveAndRedraw();
		}));
	}
}
