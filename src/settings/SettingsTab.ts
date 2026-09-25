import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import type ProjectManagerPlugin from '../main';
import { cloneRoles } from './defaults';
import { renderRole } from './sections/roleSection';
import { renderRolesFileInfo } from './sections/rolesFileInfo';
import { slugify, uniqueId } from '../utils/ids';
import { BadgeLook, renderBadge } from '../integrations/customBadges';
import { DoneBadgeLook } from '../models/types';

// Shared helpers passed to every settings section.
export interface SectionContext {
	save: () => void;            // save soon (for typing)
	saveAndRedraw: () => void;   // save now and rebuild the page
	openSections: Set<string>;   // collapsible sections expanded in the UI, e.g. "role:phd"
	renderBadge: (look: BadgeLook) => HTMLElement | null; // badge as notes show it, null without Custom Badges
}

// The plugin's page in Obsidian settings.
export class SettingsTab extends PluginSettingTab {
	private openSections = new Set<string>();

	constructor(app: App, private plugin: ProjectManagerPlugin) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl, plugin } = this;
		const settings = plugin.settings;
		containerEl.empty();

		const ctx: SectionContext = {
			save: () => plugin.requestSave(),
			saveAndRedraw: () => {
				void plugin.saveSettings().then(() => this.display());
			},
			openSections: this.openSections,
			renderBadge: (look) => renderBadge(plugin.app, look),
		};

		// General options.
		new Setting(containerEl)
			.setName('Toolbar only visible in daily notes')
			.setDesc('Show the role toolbar only on daily notes.')
			.addToggle((t) => t.setValue(settings.dailyNotesOnly).onChange((v) => {
				settings.dailyNotesOnly = v;
				ctx.save();
			}));
		new Setting(containerEl)
			.setName('Keep task badges on Enter')
			.setDesc('Pressing Enter at the end of a task starts the next task with the same role, project and type.')
			.addToggle((t) => t.setValue(settings.carryOnEnter).onChange((v) => {
				settings.carryOnEnter = v;
				ctx.save();
			}));
		new Setting(containerEl)
			.setName('Sort new daily notes')
			.setDesc('Order tasks by role, project, due date and created date when a daily note is created. Use the "Sort tasks in this note" command any time.')
			.addToggle((t) => t.setValue(settings.sortNewDailyNotes).onChange((v) => {
				settings.sortNewDailyNotes = v;
				ctx.save();
			}));
		new Setting(containerEl)
			.setName('Add new tasks in order')
			.setDesc('Toolbar tasks go straight to their role and project spot in the task list, instead of at the cursor.')
			.addToggle((t) => t.setValue(settings.insertInOrder).onChange((v) => {
				settings.insertInOrder = v;
				ctx.save();
			}));
		new Setting(containerEl)
			.setName('Role dividers')
			.setDesc('Draw a role label above each role\'s group of tasks (not saved in the note). Click a label to show only that role.')
			.addToggle((t) => t.setValue(settings.roleDividers).onChange((v) => {
				settings.roleDividers = v;
				ctx.save();
			}));
		new Setting(containerEl)
			.setName('Badges on completed tasks')
			.setDesc('How badges look once a task is ticked or cancelled.')
			.addDropdown((d) => d
				.addOptions({ 'grey-strike': 'Grey + strikethrough', grey: 'Grey', strike: 'Strikethrough', none: 'Unchanged' })
				.setValue(settings.doneBadgeLook)
				.onChange((v) => {
					settings.doneBadgeLook = v as DoneBadgeLook;
					ctx.save();
				}));
		new Setting(containerEl)
			.setName('Sync with Custom Badges')
			.setDesc('Create a badge for every role, project, task type and status.')
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
		renderRolesFileInfo(containerEl, plugin.rolesFile);
		settings.roles.forEach((role) => renderRole(containerEl, settings.roles, role, ctx));

		new Setting(containerEl)
			.addButton((b) => b.setButtonText('Add role').setCta().onClick(() => {
				const id = uniqueId(slugify('role'), settings.roles.map((r) => r.id));
				settings.roles.push({ id, name: 'New role', icon: 'circle', color: '#888888', hidden: false, projects: [], types: [], statuses: [] });
				this.openSections.add(`role:${id}`);
				ctx.saveAndRedraw();
			}))
			.addButton((b) => b.setButtonText('Reset to defaults').setWarning().onClick(() => {
				settings.roles = cloneRoles();
				plugin.rolesFile.error = ''; // an explicit reset may overwrite a broken file
				ctx.saveAndRedraw();
			}));
	}

	// Redraw if the page is showing (e.g. after the roles file was edited).
	refreshIfOpen(): void {
		if (this.containerEl.isConnected) this.display();
	}
}
