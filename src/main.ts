import { Notice, Plugin, debounce } from 'obsidian';
import { ManagerSettings, Role } from './models/types';
import { DEFAULT_SETTINGS, cloneRoles } from './settings/defaults';
import { SettingsTab } from './settings/SettingsTab';
import { ToolbarManager } from './toolbar/ToolbarManager';
import { syncBadges } from './integrations/customBadges';
import { RolesFile } from './storage/RolesFile';
import { registerCarryOnEnter } from './editor/carryOnEnter';
import { registerBadgeClick } from './editor/badgeClick';
import { registerTaskContextMenu } from './editor/taskContextMenu';
import { buildBadgeIndex } from './models/badgeIndex';

// Plugin entry point: wires settings, toolbar and badge sync together.
export default class ProjectManagerPlugin extends Plugin {
	settings!: ManagerSettings;
	rolesFile = new RolesFile(this, (roles) => void this.onRolesFileEdited(roles));
	private toolbar = new ToolbarManager(this);
	private settingsTab = new SettingsTab(this.app, this);

	// Save shortly after the user stops typing.
	requestSave = debounce(() => this.saveSettings(), 600, true);

	async onload(): Promise<void> {
		await this.loadSettings();
		this.addSettingTab(this.settingsTab);
		this.toolbar.register();
		this.rolesFile.watch();
		const roles = () => this.settings.roles;
		const isStatus = (key: string) => buildBadgeIndex(roles()).get(key)?.kind === 'status';
		registerCarryOnEnter(this, () => this.settings.carryOnEnter, isStatus);
		registerBadgeClick(this, roles);
		registerTaskContextMenu(this, roles);

		// Custom Badges may load after us, so sync once everything is ready.
		this.app.workspace.onLayoutReady(() => this.pushBadges(false));

		this.addCommand({
			id: 'sync-badges',
			name: 'Sync badges with Custom Badges',
			callback: () => this.pushBadges(true),
		});
	}

	onunload(): void {
		this.toolbar.removeAll();
	}

	// Load options from data.json and roles from roles-projects-themes.json.
	async loadSettings(): Promise<void> {
		const saved = ((await this.loadData()) ?? {}) as Partial<ManagerSettings>;
		const oldRoles = saved.roles; // older versions kept roles in data.json
		this.settings = { ...DEFAULT_SETTINGS, ...saved, roles: [] };

		const fromFile = await this.rolesFile.load();
		this.settings.roles = fromFile ?? oldRoles ?? cloneRoles();

		// No roles file yet: create it from what we have.
		if (!fromFile && !this.rolesFile.error) await this.rolesFile.save(this.settings.roles);
		// Roles now live in the file, so drop them from data.json.
		if (oldRoles) await this.saveOptions();
	}

	// Save, then update badges and toolbars to match.
	async saveSettings(): Promise<void> {
		await this.saveOptions();
		await this.rolesFile.save(this.settings.roles);
		await this.pushBadges(false);
		this.toolbar.refresh();
	}

	// Save everything except roles to data.json.
	private async saveOptions(): Promise<void> {
		const options: Partial<ManagerSettings> = { ...this.settings };
		delete options.roles;
		await this.saveData(options);
	}

	// roles-projects-themes.json was edited outside the settings page.
	private async onRolesFileEdited(roles: Role[] | null): Promise<void> {
		if (roles) {
			this.settings.roles = roles;
			await this.pushBadges(false);
			this.toolbar.refresh();
		}
		this.settingsTab.refreshIfOpen();
	}

	// Send badges to Custom Badges; `loud` shows a notice with the result.
	private async pushBadges(loud: boolean): Promise<void> {
		if (!this.settings.syncBadges) return;
		const keys = await syncBadges(this.app, this.settings.roles, this.settings.managedBadgeKeys);

		if (!keys) {
			if (loud) new Notice('Custom Badges is not enabled.');
			return;
		}
		this.settings.managedBadgeKeys = keys;
		await this.saveOptions();
		if (loud) new Notice(`Synced ${keys.length} badges.`);
	}
}
