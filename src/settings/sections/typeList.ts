import { Setting } from 'obsidian';
import { TaskType } from '../../models/types';
import { slugify, uniqueId } from '../../utils/ids';
import type { SectionContext } from '../SettingsTab';

// Editable list of task types (used for both roles and projects).
// `fallbackColor` is shown when a type has no colour of its own.
export function renderTypeList(el: HTMLElement, types: TaskType[], fallbackColor: string, ctx: SectionContext): void {
	types.forEach((type, index) => {
		new Setting(el)
			.setClass('apm-type-row')
			.addText((t) => t.setPlaceholder('Name').setValue(type.name).onChange((v) => {
				type.name = v;
				ctx.save();
			}))
			.addText((t) => t.setPlaceholder('Icon').setValue(type.icon).onChange((v) => {
				type.icon = v.trim();
				ctx.save();
			}))
			.addColorPicker((c) => c.setValue(type.color || fallbackColor).onChange((v) => {
				type.color = v;
				ctx.save();
			}))
			.addExtraButton((b) => b.setIcon('rotate-ccw').setTooltip('Use project colour').onClick(() => {
				type.color = '';
				ctx.saveAndRedraw();
			}))
			.addExtraButton((b) => b.setIcon('trash').setTooltip('Delete type').onClick(() => {
				types.splice(index, 1);
				ctx.saveAndRedraw();
			}));
	});

	// Add a new type with a unique id.
	new Setting(el).addButton((b) => b.setButtonText('Add type').onClick(() => {
		const id = uniqueId(slugify('New type'), types.map((t) => t.id));
		types.push({ id, name: 'New type', icon: 'circle', color: '' });
		ctx.saveAndRedraw();
	}));
}
