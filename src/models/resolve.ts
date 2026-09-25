import { Project, Role, TaskOption, TaskStatus, TaskType } from './types';
import { pastelOf, shadeOf } from '../utils/colour';
import { STATUS_PALETTE } from '../defaults/statuses';

// Which list an option belongs to; also the letter used in its badge key.
export type OptionKind = 'type' | 'status';
const KIND_LETTER: Record<OptionKind, string> = { type: 't', status: 's' };

// Final colour of a project: its override, or an auto shade of the role colour.
export function projectColor(role: Role, project: Project): string {
	if (project.color) return project.color;
	const index = role.projects.indexOf(project);
	return shadeOf(role.color, Math.max(index, 0), role.projects.length);
}

// Final icon of a project: its own, or the role's.
export const projectIcon = (role: Role, project: Project) => project.icon || role.icon;

// Roles and projects shown in the toolbar (hidden ones keep their badges).
export const visibleRoles = (roles: Role[]) => roles.filter((r) => !r.hidden);
export const visibleProjects = (role: Role) => role.projects.filter((p) => !p.hidden);

// Types offered for a task: the project's own, or the role's.
export function typesFor(role: Role, project?: Project): TaskType[] {
	return project && project.types.length ? project.types : role.types;
}

// Statuses offered for a task: the project's own, or the role's.
export function statusesFor(role: Role, project?: Project): TaskStatus[] {
	return project && project.statuses.length ? project.statuses : role.statuses;
}

// Types or statuses, by kind.
export const optionsFor = (kind: OptionKind, role: Role, project?: Project) =>
	kind === 'type' ? typesFor(role, project) : statusesFor(role, project);

// Badge key for a role, e.g. "phd".
export const roleKey = (role: Role) => role.id;

// Badge key for a project, e.g. "phd-tts-3d".
export const projectKey = (role: Role, project: Project) => `${role.id}-${project.id}`;

// Badge key for a type or status, scoped to the project if it owns it, else the role.
// e.g. "phd-t-code", "phd-tts-3d-s-done".
export function optionKey(kind: OptionKind, role: Role, option: TaskOption, project?: Project): string {
	const own = project && (kind === 'type' ? project.types : project.statuses).includes(option);
	const owner = own && project ? projectKey(role, project) : roleKey(role);
	return `${owner}-${KIND_LETTER[kind]}-${option.id}`;
}

// Badge key for a type (kept for existing callers).
export const typeKey = (role: Role, type: TaskType, project?: Project) => optionKey('type', role, type, project);

// Auto colour shown in settings when an option has none of its own.
export function autoOptionColor(kind: OptionKind, list: TaskOption[], option: TaskOption, base: string): string {
	const index = Math.max(list.indexOf(option), 0);
	return kind === 'type' ? pastelOf(base, index, list.length) : STATUS_PALETTE[index % STATUS_PALETTE.length];
}

// Colour sent to Custom Badges: the picked colour, or the auto one.
export function optionBadgeColor(kind: OptionKind, list: TaskOption[], option: TaskOption, base: string): string {
	return option.color || autoOptionColor(kind, list, option, base);
}
