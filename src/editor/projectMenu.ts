import { Menu } from 'obsidian';
import { Project, Role } from '../models/types';
import { projectIcon } from '../models/resolve';
import { buildBadgeIndex } from '../models/badgeIndex';
import { readTask } from '../tasks/readTask';
import { changeProject } from '../tasks/changeProject';

type Point = { x: number; y: number };

// Menu of the task's role projects; `write` gets the edited line.
// Returns false when the line isn't one of our tasks or its role has no projects.
export function showProjectMenu(at: Point, line: string, roles: Role[], write: (text: string) => void): boolean {
	const index = buildBadgeIndex(roles);
	const task = readTask(line, index);
	if (!task) return false;
	const { role } = task;
	const projects = role.projects.filter((p) => !p.hidden || p === task.project);
	if (!projects.length) return false;

	const pick = (project?: Project) => write(changeProject(line, task, index, project));
	const menu = new Menu();
	menu.addItem((i) => i.setTitle(`${role.name} (no project)`).setIcon(role.icon).setChecked(!task.project).onClick(() => pick()));
	menu.addSeparator();
	projects.forEach((project) =>
		menu.addItem((i) => i
			.setTitle(project.name)
			.setIcon(projectIcon(role, project))
			.setChecked(project === task.project)
			.onClick(() => pick(project))),
	);
	menu.showAtPosition(at);
	return true;
}
