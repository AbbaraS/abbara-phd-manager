import { Notice, normalizePath } from 'obsidian';
import type ProjectManagerPlugin from '../main';
import { Role } from '../models/types';
import { parseRoles, stringifyRoles } from '../models/rolesJson';

export const ROLES_FILE_NAME = 'roles-projects-themes.json';
const POLL_MS = 1500; // how often to look for edits made outside Obsidian

// Keeps roles-projects-themes.json (in the plugin folder) and the settings page in sync, both ways.
export class RolesFile {
	error = '';             // last read problem; while set, the settings page won't overwrite the file
	private lastText = '';  // text we last read or wrote, so our own writes are ignored
	private lastMtime = 0;
	private checking = false;

	// `onEdited` gets the new roles, or null if the edited file has an error.
	constructor(private plugin: ProjectManagerPlugin, private onEdited: (roles: Role[] | null) => void) {}

	// Vault-relative path, e.g. ".obsidian/plugins/abbara-phd-manager/roles-projects-themes.json".
	get path(): string {
		const { app, manifest } = this.plugin;
		const dir = manifest.dir ?? `${app.vault.configDir}/plugins/${manifest.id}`;
		return normalizePath(`${dir}/${ROLES_FILE_NAME}`);
	}

	// Roles from the file, or null if it is missing or has an error (see `error`).
	async load(): Promise<Role[] | null> {
		const adapter = this.plugin.app.vault.adapter;
		const stat = await adapter.stat(this.path);
		if (!stat) return null;
		this.lastMtime = stat.mtime;
		return this.parse(await adapter.read(this.path));
	}

	// Write roles to the file, unless it has an error the user still needs to fix.
	async save(roles: Role[]): Promise<void> {
		if (this.error) {
			new Notice(`Not saved: fix the error in ${ROLES_FILE_NAME} first.`);
			return;
		}
		const text = stringifyRoles(roles);
		if (text === this.lastText) return;

		const adapter = this.plugin.app.vault.adapter;
		await adapter.write(this.path, text);
		this.lastText = text;
		this.lastMtime = (await adapter.stat(this.path))?.mtime ?? Date.now();
	}

	// Start looking for outside edits.
	watch(): void {
		this.plugin.registerInterval(window.setInterval(() => void this.check(), POLL_MS));
	}

	// Reload if the file changed since we last read or wrote it.
	private async check(): Promise<void> {
		if (this.checking) return;
		this.checking = true;
		try {
			const adapter = this.plugin.app.vault.adapter;
			const stat = await adapter.stat(this.path);
			if (!stat || stat.mtime === this.lastMtime) return;
			this.lastMtime = stat.mtime;

			const text = await adapter.read(this.path);
			if (text === this.lastText) return;
			const roles = this.parse(text);
			if (roles) new Notice(`Roles reloaded from ${ROLES_FILE_NAME}`);
			this.onEdited(roles);
		} finally {
			this.checking = false;
		}
	}

	// Parse file text, recording (and showing) any error.
	private parse(text: string): Role[] | null {
		this.lastText = text;
		try {
			const roles = parseRoles(text);
			this.error = '';
			return roles;
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
			new Notice(`${ROLES_FILE_NAME} was not loaded:\n${this.error}`, 10000);
			return null;
		}
	}
}
