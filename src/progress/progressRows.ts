import { Project, Role } from '../models/types';
import { projectColor, projectIcon, projectKey, visibleProjects, visibleRoles } from '../models/resolve';
import { daysUntil } from '../utils/dates';
import { Progress } from './countProgress';

// Everything one dashboard card shows.
export interface ProgressRow {
	role: Role;
	project: Project;
	color: string;
	icon: string;
	daysLeft: number; // negative = overdue
	done: number;
	total: number;
}

// Cards for visible projects with a deadline, soonest first.
// `filter` = role ids or project keys to include (empty = all).
export function progressRows(roles: Role[], counts: Map<string, Progress>, filter: string[], today = new Date()): ProgressRow[] {
	const rows: ProgressRow[] = [];
	for (const role of visibleRoles(roles)) {
		for (const project of visibleProjects(role)) {
			const key = projectKey(role, project);
			const daysLeft = daysUntil(project.deadline, today);
			if (daysLeft === null) continue;
			if (filter.length && !filter.includes(role.id) && !filter.includes(key)) continue;
			const { done, total } = counts.get(key) ?? { done: 0, total: 0 };
			rows.push({ role, project, color: projectColor(role, project), icon: projectIcon(role, project), daysLeft, done, total });
		}
	}
	return rows.sort((a, b) => a.daysLeft - b.daysLeft);
}
