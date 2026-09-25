import { Project, Role } from './types';
import { projectIcon } from './resolve';

// What a project badge shows, before colour.
export interface ProjectBadgeText {
	label: string;
	icon: string;
	prefixIcon: string;  // shown first, before a "|" divider; empty = none
	prefixLabel: string;
}

// Project badge text. With the role's "roleOnProjects" option it reads "[role icon] Role | [project icon] Project",
// otherwise "[project icon] Role | Project".
export function projectBadgeText(role: Role, project: Project): ProjectBadgeText {
	const icon = projectIcon(role, project);
	if (role.roleOnProjects) return { label: project.name, icon, prefixIcon: role.icon, prefixLabel: role.name };
	return { label: `${role.name} | ${project.name}`, icon, prefixIcon: '', prefixLabel: '' };
}
