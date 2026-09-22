import { App, Plugin } from 'obsidian';
import { Role } from '../models/types';
import { projectColor, projectKey, roleKey, typeKey } from '../models/resolve';

// Shape of one badge in the Custom Badges plugin's settings.
interface BadgeDefinition {
	key: string;
	label: string;
	icon: string;
	color: string;
	placeholder: 'default';
	placeholderText: string;
}

// The bits of the Custom Badges plugin we use.
interface CustomBadgesPlugin extends Plugin {
	settings: { badges: BadgeDefinition[] };
	saveSettings(): Promise<void>;
}

const PLUGIN_ID = 'custom-badges';

// Custom Badges plugin instance, or null if it is not installed/enabled.
export function getCustomBadges(app: App): CustomBadgesPlugin | null {
	// `plugins` is not in the public API types, so reach it loosely.
	const plugins = (app as unknown as { plugins?: { getPlugin(id: string): Plugin | null } }).plugins;
	const plugin = plugins?.getPlugin(PLUGIN_ID) as CustomBadgesPlugin | null;
	return plugin?.settings?.badges ? plugin : null;
}

// Build a badge definition with the fields Custom Badges expects.
const badge = (key: string, label: string, icon: string, color: string): BadgeDefinition =>
	({ key, label, icon, color, placeholder: 'default', placeholderText: '' });

// Every badge the current roles need: one per role, project and type.
export function buildBadges(roles: Role[]): BadgeDefinition[] {
	const out: BadgeDefinition[] = [];
	for (const role of roles) {
		out.push(badge(roleKey(role), role.name, role.icon, role.color));
		role.types.forEach((t) => out.push(badge(typeKey(role, t), t.name, t.icon, t.color || role.color)));
		for (const project of role.projects) {
			const shade = projectColor(role, project);
			out.push(badge(projectKey(role, project), `${role.name} | ${project.name}`, role.icon, shade));
			project.types.forEach((t) => out.push(badge(typeKey(role, t, project), t.name, t.icon, t.color || shade)));
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

	// Keep the user's own badges, drop stale managed ones, then add/replace ours.
	const kept = plugin.settings.badges.filter(
		(b) => !wantedKeys.includes(b.key) && !previousKeys.includes(b.key),
	);
	plugin.settings.badges = [...kept, ...wanted];
	await plugin.saveSettings();
	return wantedKeys;
}
