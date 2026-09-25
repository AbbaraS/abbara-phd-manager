import { App, Plugin } from 'obsidian';
import { Project, Role, TaskOption } from '../models/types';
import { OptionKind, optionBadgeColor, optionKey, projectColor, projectKey, roleKey } from '../models/resolve';
import { projectBadgeText } from '../models/projectBadge';

// Shape of one badge in the Custom Badges plugin's settings.
interface BadgeDefinition {
	key: string;
	label: string;
	icon: string;
	prefixIcon: string;  // shown before a "|" divider (Custom Badges 1.4+); empty = none
	prefixLabel: string;
	color: string;
	placeholder: 'default';
	placeholderText: string;
	source: string; // our plugin id, so Custom Badges lists these under our name
}

// The bits of the Custom Badges plugin we use.
interface CustomBadgesPlugin extends Plugin {
	settings: { badges: BadgeDefinition[] };
	saveSettings(): Promise<void>;
	// Newer versions: replaces our badges but keeps styling the user set there (font size etc).
	setPluginBadges?(pluginId: string, badges: Partial<BadgeDefinition>[]): Promise<string[]>;
	// Newer versions: a badge element as notes show it, with unsaved changes applied.
	renderBadge?(key: string, changes: Partial<BadgeDefinition>): HTMLElement;
}

const PLUGIN_ID = 'custom-badges';
const PHD_MANAGER_ID = 'abbara-phd-manager';

// Custom Badges plugin instance, or null if it is not installed/enabled.
export function getCustomBadges(app: App): CustomBadgesPlugin | null {
	// `plugins` is not in the public API types, so reach it loosely.
	const plugins = (app as unknown as { plugins?: { getPlugin(id: string): Plugin | null } }).plugins;
	const plugin = plugins?.getPlugin(PLUGIN_ID) as CustomBadgesPlugin | null;
	return plugin?.settings?.badges ? plugin : null;
}

// Build a badge definition with the fields Custom Badges expects.
const badge = (key: string, label: string, icon: string, color: string, prefixIcon = '', prefixLabel = ''): BadgeDefinition =>
	({ key, label, icon, prefixIcon, prefixLabel, color, placeholder: 'default', placeholderText: '', source: PHD_MANAGER_ID });

// Every badge the current roles need: one per role, project, type and status.
// Hidden roles and projects are included, so tasks already in notes keep their badges.
export function buildBadges(roles: Role[]): BadgeDefinition[] {
	const out: BadgeDefinition[] = [];
	// Badges for a list of types or statuses; `base` seeds the auto colours.
	const addOptions = (kind: OptionKind, role: Role, list: TaskOption[], base: string, project?: Project) =>
		list.forEach((o) => out.push(badge(optionKey(kind, role, o, project), o.name, o.icon, optionBadgeColor(kind, list, o, base))));

	for (const role of roles) {
		out.push(badge(roleKey(role), role.name, role.icon, role.color));
		addOptions('type', role, role.types, role.color);
		addOptions('status', role, role.statuses, role.color);
		for (const project of role.projects) {
			const shade = projectColor(role, project);
			const t = projectBadgeText(role, project);
			out.push(badge(projectKey(role, project), t.label, t.icon, shade, t.prefixIcon, t.prefixLabel));
			addOptions('type', role, project.types, shade, project);
			addOptions('status', role, project.statuses, shade, project);
		}
	}
	return out;
}

// Write our badges into Custom Badges and remove ones we made earlier but no longer need.
// Returns the new list of managed keys, or null if Custom Badges is missing.
export async function syncBadges(app: App, roles: Role[], previousKeys: string[]): Promise<string[] | null> {
	const plugin = getCustomBadges(app);
	if (!plugin) return null;

	const wanted = buildBadges(roles);
	const wantedKeys = wanted.map((b) => b.key);

	if (plugin.setPluginBadges) {
		// Drop untagged copies left by older syncs, then send only the fields we own.
		plugin.settings.badges = plugin.settings.badges.filter(
			(b) => b.source || (!wantedKeys.includes(b.key) && !previousKeys.includes(b.key)),
		);
		return plugin.setPluginBadges(PHD_MANAGER_ID, wanted.map(({ key, label, icon, prefixIcon, prefixLabel, color }) => ({ key, label, icon, prefixIcon, prefixLabel, color })));
	}

	// Keep the user's own badges, drop stale managed ones, then add/replace ours.
	const kept = plugin.settings.badges.filter(
		(b) => !wantedKeys.includes(b.key) && !previousKeys.includes(b.key),
	);
	plugin.settings.badges = [...kept, ...wanted];
	await plugin.saveSettings();
	return wantedKeys;
}

// The fields we can preview live in settings.
// Prefix fields are optional: left out = keep what's saved.
export type BadgeLook = Pick<BadgeDefinition, 'key' | 'label' | 'icon' | 'color'>
	& Partial<Pick<BadgeDefinition, 'prefixIcon' | 'prefixLabel'>>;

// A badge exactly as it will look in a note, or null when Custom Badges can't draw one.
export function renderBadge(app: App, look: BadgeLook): HTMLElement | null {
	return getCustomBadges(app)?.renderBadge?.(look.key, look) ?? null;
}
