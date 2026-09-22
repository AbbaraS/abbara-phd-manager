import { Notice, Plugin, debounce } from 'obsidian';
import { ManagerSettings } from './models/types';
import { DEFAULT_SETTINGS, cloneRoles } from './settings/defaults';
import { SettingsTab } from './settings/SettingsTab';
import { ToolbarManager } from './toolbar/ToolbarManager';
import { syncBadges } from './integrations/customBadges';

// Plugin entry point: wires settings, toolbar and badge sync together.
export default class ProjectManagerPlugin extends Plugin {
	settings!: ManagerSettings;
	private toolbar = new ToolbarManager(this);

	// Save shortly after the user stops typing.
	requestSave = debounce(() => this.saveSettings(), 600, true);

	async onload(): Promise<void> {
		await this.loadSettings();
		this.addSettingTab(new SettingsTab(this.app, this));
		this.toolbar.register();

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

	// Load saved settings on top of the defaults.
	async loadSettings(): Promise<void> {
		const saved = (await this.loadData()) as Partial<ManagerSettings> | null;
		this.settings = { ...DEFAULT_SETTINGS, roles: cloneRoles(), ...saved };
	}

	// Save, then update badges and toolbars to match.
	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		await this.pushBadges(false);
		this.toolbar.refresh();
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
		await this.saveData(this.settings);
		if (loud) new Notice(`Synced ${keys.length} badges.`);
	}
}
