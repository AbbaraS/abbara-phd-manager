import { Setting } from 'obsidian';
import { TaskOption } from '../../models/types';
import { OptionKind, autoOptionColor } from '../../models/resolve';
import { starterStatuses } from '../../defaults/statuses';
import { slugify, uniqueId } from '../../utils/ids';
import type { SectionContext } from '../SettingsTab';

// Heading text, per kind.
const NOUN: Record<OptionKind, string> = { type: 'type', status: 'status' };

// Editable list of task types or statuses (used for both roles and projects).
// `base` is the role/project colour that auto colours are made from.
export function renderOptionList(el: HTMLElement, kind: OptionKind, list: TaskOption[], base: string, ctx: SectionContext): void {
	const noun = NOUN[kind];

	list.forEach((option, index) => {
		new Setting(el)
			.setClass('apm-type-row')
			.addText((t) => t.setPlaceholder('Name').setValue(option.name).onChange((v) => {
				option.name = v;
				ctx.save();
			}))
			.addText((t) => t.setPlaceholder('Icon').setValue(option.icon).onChange((v) => {
				option.icon = v.trim();
				ctx.save();
			}))
			.addColorPicker((c) => c.setValue(option.color || autoOptionColor(kind, list, option, base)).onChange((v) => {
				option.color = v;
				ctx.save();
			}))
			.addExtraButton((b) => b.setIcon('rotate-ccw').setTooltip('Use auto colour').onClick(() => {
				option.color = '';
				ctx.saveAndRedraw();
			}))
			.addExtraButton((b) => b.setIcon('trash').setTooltip(`Delete ${noun}`).onClick(() => {
				list.splice(index, 1);
				ctx.saveAndRedraw();
			}));
	});

	// Add a new option with a unique id.
	const add = new Setting(el).addButton((b) => b.setButtonText(`Add ${noun}`).onClick(() => {
		const id = uniqueId(slugify(`New ${noun}`), list.map((t) => t.id));
		list.push({ id, name: `New ${noun}`, icon: 'circle', color: '' });
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
