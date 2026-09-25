import { Project, Role } from './types';
import { slugify, uniqueId } from '../utils/ids';

// A new project for `role` with a unique id made from its name.
export function blankProject(role: Role, name: string): Project {
	const id = uniqueId(slugify(name) || 'project', role.projects.map((p) => p.id));
	return { id, name, icon: '', color: '', hidden: false, deadline: '', types: [], statuses: [] };
}
