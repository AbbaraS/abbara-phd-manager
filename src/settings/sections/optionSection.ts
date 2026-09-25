import { Setting } from 'obsidian';
import { Project, Role, TaskOption } from '../../models/types';
import { OptionKind, autoOptionColor, optionBadgeColor, optionKey } from '../../models/resolve';
import type { SectionContext } from '../SettingsTab';
import { collapsible } from './collapsible';
import { iconField } from './iconField';
import { moveButtons } from './moveButtons';
import { sectionTitle } from './sectionTitle';

// Collapsible block for one task type or status: name, icon, colour, delete.
export function renderOption(
	el: HTMLElement, kind: OptionKind, role: Role, project: Project | undefined,
	list: TaskOption[], option: TaskOption, base: string, sectionKey: string, ctx: SectionContext,
): void {
	const { details, summary } = collapsible(el, sectionKey, 'apm-option', ctx);
	const colour = () => optionBadgeColor(kind, list, option, base);
	details.style.setProperty('--apm-swatch-color', colour());

	// Summary line: the badge as notes show it, then move buttons.
	const drawTitle = sectionTitle(summary, 'apm-swatch', ctx);
	const refreshTitle = () => drawTitle({
		key: optionKey(kind, role, option, project),
		label: option.name, icon: option.icon, color: colour(), name: option.name || `Untitled ${kind}`,
	});
	refreshTitle();
	summary.createDiv({ cls: 'apm-summary-actions' }).append(moveButtons(list, option, ctx));

	new Setting(details).setName('Name').addText((t) => t.setValue(option.name).onChange((v) => {
		option.name = v;
		refreshTitle();
		ctx.save();
	}));
	iconField(details, 'Lucide icon name or an emoji.', option.icon, '', (icon) => {
		option.icon = icon;
		refreshTitle();
		ctx.save();
	});
	new Setting(details)
		.setName('Colour')
		.setDesc(option.color ? 'Custom colour.' : 'Auto colour.')
		.addColorPicker((c) => c.setValue(option.color || autoOptionColor(kind, list, option, base)).onChange((v) => {
			option.color = v;
			details.style.setProperty('--apm-swatch-color', v);
			refreshTitle();
			ctx.save();
		}))
		.addExtraButton((b) => b.setIcon('rotate-ccw').setTooltip('Use auto colour').onClick(() => {
			option.color = '';
			ctx.saveAndRedraw();
		}));
	new Setting(details).addButton((b) => b.setButtonText(`Delete ${kind}`).setWarning().onClick(() => {
		list.remove(option);
		ctx.saveAndRedraw();
	}));
}
