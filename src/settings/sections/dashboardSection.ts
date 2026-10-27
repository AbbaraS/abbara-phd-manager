import { Setting } from 'obsidian';
import { dashboardSections, moveSection, orderedSections } from '../../dashboard/sections';
import type { ManagerSettings } from '../../models/types';
import type { SectionContext } from '../SettingsTab';

// Dashboard sections in page order: shown or not, full or half width, and up / down to move them.
export function renderDashboardSections(el: HTMLElement, settings: ManagerSettings, ctx: SectionContext): void {
	new Setting(el).setName('Dashboard sections').setHeading();
	el.createDiv({ cls: 'apm-hint', text: 'Shown in this order. On the dashboard you can also drag a section by its grip, switch its width, and click its title to collapse it.' });

	const all = dashboardSections(settings.timeRoles, settings.roles);
	const list = orderedSections(settings.dashOrder, all);
	list.forEach((section, i) => {
		const move = (to: number) => {
			settings.dashOrder = moveSection(settings.dashOrder, all, section.id, list[to].id, to > i);
			ctx.saveAndRedraw();
		};
		const half = settings.dashHalf.includes(section.id);
		new Setting(el)
			.setName(section.name)
			.addDropdown((d) => d.addOptions({ full: 'Full width', left: 'Half · left column', right: 'Half · right column' })
				.setValue(half ? settings.dashColumns[section.id] ?? 'left' : 'full').onChange((v) => {
					settings.dashHalf = [...settings.dashHalf.filter((id) => id !== section.id), ...(v === 'full' ? [] : [section.id])];
					if (v !== 'full') settings.dashColumns = { ...settings.dashColumns, [section.id]: v as 'left' | 'right' };
					ctx.save();
				}))
			.addExtraButton((b) => b.setIcon('arrow-up').setTooltip('Move up').setDisabled(i === 0).onClick(() => move(i - 1)))
			.addExtraButton((b) => b.setIcon('arrow-down').setTooltip('Move down').setDisabled(i === list.length - 1).onClick(() => move(i + 1)))
			.addToggle((t) => t.setValue(!settings.dashHidden.includes(section.id)).onChange((show) => {
				settings.dashHidden = settings.dashHidden.filter((id) => id !== section.id);
				if (!show) settings.dashHidden.push(section.id);
				ctx.save();
			}));
	});
}
