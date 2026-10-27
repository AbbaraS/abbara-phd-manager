import type ProjectManagerPlugin from '../../main';
import { renderBadge, type BadgeLook } from '../../integrations/customBadges';
import { buildBadgeIndex } from '../../models/badgeIndex';
import { projectBadgeText } from '../../models/projectBadge';
import { OptionKind, optionBadgeColor, projectColor, projectKey, roleKey } from '../../models/resolve';
import type { Project, Role, TaskOption } from '../../models/types';
import { setIconOrEmoji } from '../../utils/icon';

// Draws a badge as notes show it (through Custom Badges); a plain tinted chip when that plugin isn't there.
function drawBadge(parent: HTMLElement, plugin: ProjectManagerPlugin, look: BadgeLook, kind: 'role' | 'project' | OptionKind): void {
	const badge = renderBadge(plugin.app, look);
	if (badge) {
		parent.append(badge);
		return;
	}
	const chip = parent.createSpan({ cls: `apm-chip is-${kind}` });
	chip.style.setProperty('--apm-chip-color', look.color);
	setIconOrEmoji(chip.createSpan({ cls: 'apm-chip-icon' }), look.icon);
	chip.createSpan({ text: look.prefixLabel ? `${look.prefixLabel} | ${look.label}` : look.label });
}

// The role's badge.
export function roleBadge(parent: HTMLElement, plugin: ProjectManagerPlugin, role: Role): void {
	drawBadge(parent, plugin, { key: roleKey(role), label: role.name, icon: role.icon, color: role.color }, 'role');
}

// The project's badge ("Role | Project", or with the role's own icon in front, as set on the role).
export function projectBadge(parent: HTMLElement, plugin: ProjectManagerPlugin, role: Role, project: Project): void {
	const text = projectBadgeText(role, project);
	drawBadge(parent, plugin, { key: projectKey(role, project), color: projectColor(role, project), ...text }, 'project');
}

// A type or status badge, found by its badge key (nothing drawn for an unknown key).
export function optionBadge(parent: HTMLElement, plugin: ProjectManagerPlugin, key: string | undefined): void {
	const entry = key ? buildBadgeIndex(plugin.settings.roles).get(key) : undefined;
	if (!key || !entry || !('option' in entry)) return;
	const { kind, role, project, option } = entry;
	const own = project && (kind === 'type' ? project.types : project.statuses);
	const list: TaskOption[] = own ?? (kind === 'type' ? role.types : role.statuses);
	const base = project ? projectColor(role, project) : role.color;
	drawBadge(parent, plugin, { key, label: option.name, icon: option.icon, color: optionBadgeColor(kind, list, option, base) }, kind);
}

// A type badge for a type picked by id in a role or project (nothing drawn when it has none).
export function typeBadge(parent: HTMLElement, plugin: ProjectManagerPlugin, role: Role, project: Project | undefined, typeId: string): void {
	const list = project && project.types.length ? project.types : role.types;
	const type = list.find((t) => t.id === typeId);
	if (!type) return;
	const own = project && project.types.length ? project : undefined;
	const key = `${own ? projectKey(role, own) : roleKey(role)}-t-${type.id}`;
	drawBadge(parent, plugin, { key, label: type.name, icon: type.icon, color: optionBadgeColor('type', list, type, own ? projectColor(role, own) : role.color) }, 'type');
}
