import { Role } from './types';
import { buildBadgeIndex } from './badgeIndex';
import { autoOptionColor, optionsFor, projectColor } from './resolve';
import { toHex } from '../utils/colour';

// The badge fields Custom Badges sends back after an edit in its settings.
export interface EditedBadge {
	key: string;
	label: string;
	icon: string;
	color: string;
}

// Auto colour of a project, ignoring its override.
function autoProjectColor(role: Role, project: Role['projects'][number]): string {
	const saved = project.color;
	project.color = '';
	const auto = projectColor(role, project);
	project.color = saved;
	return toHex(auto);
}

// Copies a badge edited in Custom Badges onto its role, project, type or status.
// A colour equal to the auto one clears the override. false = not one of our keys.
export function applyBadgeEdit(roles: Role[], badge: EditedBadge): boolean {
	const entry = buildBadgeIndex(roles).get(badge.key);
	if (!entry) return false;
	const label = badge.label.trim();
	const icon = badge.icon.trim();
	const color = toHex(badge.color); // '' = can't store it (e.g. var(--…)), keep the old one

	// Role.
	if (entry.kind === 'role') {
		if (label) entry.role.name = label;
		entry.role.icon = icon;
		if (color) entry.role.color = color;
		return true;
	}

	// Project: its badge label is "Role | Project", keep only the project part.
	if (entry.kind === 'project') {
		const { role, project } = entry;
		const prefix = `${role.name} | `;
		const name = (label.startsWith(prefix) ? label.slice(prefix.length) : label).trim();
		if (name) project.name = name;
		project.icon = icon === role.icon ? '' : icon; // same as the role = keep inheriting
		if (color) project.color = color === autoProjectColor(role, project) ? '' : color;
		return true;
	}

	// Type or status.
	const { kind, role, project, option } = entry;
	if (label) option.name = label;
	option.icon = icon;
	if (color) {
		const base = project ? projectColor(role, project) : role.color;
		const auto = toHex(autoOptionColor(kind, optionsFor(kind, role, project), option, base));
		option.color = color === auto ? '' : color;
	}
	return true;
}
