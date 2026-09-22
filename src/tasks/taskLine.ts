import { Project, Role, TaskType } from '../models/types';
import { projectKey, roleKey, typeKey } from '../models/resolve';
import { badge, idBadge } from './taskBadges';

// What the user picked in the toolbar.
export interface TaskChoice {
	role: Role;
	project?: Project;
	type?: TaskType;
}

// Build a new task line, e.g. "- [ ] `[!!phd-tts-3d]` `[!!phd-t-code]` `[!!id:k3f9q]` ".
export function buildTaskLine({ role, project, type }: TaskChoice, id: string): string {
	const parts = ['- [ ]', badge(project ? projectKey(role, project) : roleKey(role))];
	if (type) parts.push(badge(typeKey(role, type, project)));
	parts.push(idBadge(id));
	return parts.join(' ') + ' ';
}
