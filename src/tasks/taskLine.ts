import { Project, Role, TaskType } from '../models/types';
import { projectKey, roleKey, typeKey } from '../models/resolve';

// What the user picked in the toolbar.
export interface TaskChoice {
	role: Role;
	project?: Project;
	type?: TaskType;
}

// Inline badge syntax used by Custom Badges.
const badge = (key: string) => `\`[!!${key}]\``;

// Build a new task line, e.g. "- [ ] `[!!phd-tts-3d]` `[!!phd-t-code]` ".
export function buildTaskLine({ role, project, type }: TaskChoice): string {
	const parts = ['- [ ]', badge(project ? projectKey(role, project) : roleKey(role))];
	if (type) parts.push(badge(typeKey(role, type, project)));
	return parts.join(' ') + ' ';
}
