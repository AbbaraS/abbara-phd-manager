import { Project, Role, TaskType } from '../models/types';
import { projectKey, roleKey, typeKey } from '../models/resolve';
import { badge, idBadge } from './taskBadges';
import { PRIORITIES, Priority } from './taskDates';

// What the user picked in the toolbar.
export interface TaskChoice {
	role: Role;
	project?: Project;
	type?: TaskType;
}

// A task written out in full (dashboard, reminders) instead of typed into the note afterwards.
export interface TaskText {
	text: string;
	priority?: Priority;
	due?: string; // "YYYY-MM-DD"
}

// Build a new task line, e.g. "- [ ] `[!!phd-tts-3d]` `[!!phd-t-code]` `[!!id:k3f9q]` ".
// With `full` it also carries the text, priority and due date; "created" and "completed" are never written here.
export function buildTaskLine({ role, project, type }: TaskChoice, id: string, full?: TaskText): string {
	const parts = ['- [ ]', badge(project ? projectKey(role, project) : roleKey(role))];
	if (type) parts.push(badge(typeKey(role, type, project)));
	parts.push(idBadge(id));
	const start = parts.join(' ') + ' ';
	if (!full) return start;
	const emoji = PRIORITIES.find((p) => p.id === full.priority)?.emoji;
	return start + [full.text.trim(), emoji, full.due ? `📅 ${full.due}` : ''].filter(Boolean).join(' ');
}
