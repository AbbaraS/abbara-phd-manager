import type { Project, Role, TaskType } from './types';
import { slugify, uniqueId } from '../utils/ids';

// Adds a task type for `project`. A project with its own types gets it there; one that shares its role's types
// puts it in the role's list (copying the list into the project would change the badges of existing tasks).
export function addType(role: Role, project: Project | undefined, name: string, icon: string): TaskType {
	const list = project && project.types.length ? project.types : role.types;
	const type: TaskType = { id: uniqueId(slugify(name) || 'type', list.map((t) => t.id)), name, icon: icon || 'tag', color: '' };
	list.push(type);
	return type;
}
