import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import type ProjectManagerPlugin from '../main';
import { cloneRoles } from './defaults';
import { renderRole } from './sections/roleSection';
import { slugify, uniqueId } from '../utils/ids';

// Shared helpers passed to every settings section.
export interface SectionContext {
	save: () => void;            // save soon (for typing)
	saveAndRedraw: () => void;   // save now and rebuild the page
	openRoles: Set<string>;      // roles expanded in the UI
}

// The plugin's page in Obsidian settings.
export class SettingsTab extends PluginSettingTab {
	private openRoles = new Set<string>();

	constructor(app: App, private plugin: ProjectManagerPlugin) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl, plugin } = this;
		const settings = plugin.settings;
		containerEl.empty();

		const ctx: SectionContext = {
			save: () => plugin.requestSave(),
			saveAndRedraw: async () => {
				await plugin.saveSettings();
				this.display();
			},
			openRoles: this.openRoles,
		};

		// General options.
		new Setting(containerEl)
			.setName('Daily notes only')
			.setDesc('Show the role toolbar only on daily notes.')
			.addToggle((t) => t.setValue(settings.dailyNotesOnly).onChange((v) => {
				settings.dailyNotesOnly = v;
				ctx.save();
			}));
		new Setting(containerEl)
			.setName('Sync with Custom Badges')
			.setDesc('Create a badge for every role, project and task type.')
			.addToggle((t) => t.setValue(settings.syncBadges).onChange((v) => {
				settings.syncBadges = v;
				ctx.save();
			}))
			.addButton((b) => b.setButtonText('Sync now').onClick(async () => {
				await plugin.saveSettings();
				new Notice('Badges synced');
			}));

		// Roles.
		new Setting(containerEl).setName('Roles').setHeading();
		settings.roles.forEach((role) => renderRole(containerEl, settings.roles, role, ctx));

		new Setting(containerEl)
			.addButton((b) => b.setButtonText('Add role').setCta().onClick(() => {
				const id = uniqueId(slugify('role'), settings.roles.map((r) => r.id));
				settings.roles.push({ id, name: 'New role', icon: 'circle', color: '#888888', projects: [], types: [] });
				this.openRoles.add(id);
				ctx.saveAndRedraw();
			}))
			.addButton((b) => b.setButtonText('Reset to defaults').setWarning().onClick(() => {
				settings.roles = cloneRoles();
				ctx.saveAndRedraw();
			}));
	}
}
