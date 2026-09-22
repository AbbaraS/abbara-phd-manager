import { Project, Role, TaskType } from './types';
import { shadeOf } from '../utils/colour';

// Final colour of a project: its override, or an auto shade of the role colour.
export function projectColor(role: Role, project: Project): string {
	if (project.color) return project.color;
	const index = role.projects.indexOf(project);
	return shadeOf(role.color, Math.max(index, 0), role.projects.length);
}

// Types offered for a task: the project's own, or the role's.
export function typesFor(role: Role, project?: Project): TaskType[] {
	return project && project.types.length ? project.types : role.types;
}

// Badge key for a role, e.g. "phd".
export const roleKey = (role: Role) => role.id;

// Badge key for a project, e.g. "phd-tts-3d".
export const projectKey = (role: Role, project: Project) => `${role.id}-${project.id}`;

// Badge key for a type, scoped to the project if it owns the type, else the role.
export function typeKey(role: Role, type: TaskType, project?: Project): string {
	const owner = project && project.types.includes(type) ? projectKey(role, project) : roleKey(role);
	return `${owner}-t-${type.id}`;
}
