import { Menu } from 'obsidian';
import { Project, Role } from '../models/types';
import { projectIcon, typesFor, visibleProjects } from '../models/resolve';
import { TaskChoice } from '../tasks/taskLine';

type Point = { x: number; y: number };

// Step 2: pick a type (skipped when there are none).
function pickType(at: Point, role: Role, project: Project | undefined, done: (c: TaskChoice) => void): void {
	const types = typesFor(role, project);
	if (!types.length) return done({ role, project });

	const menu = new Menu();
	menu.addItem((i) => i.setTitle('No type').setIcon('circle').onClick(() => done({ role, project })));
	menu.addSeparator();
	types.forEach((type) =>
		menu.addItem((i) => i.setTitle(type.name).setIcon(type.icon).onClick(() => done({ role, project, type }))),
	);
	menu.showAtPosition(at);
}

// Step 1: pick a project for `role`, then hand over to the type picker.
export function pickTask(evt: MouseEvent, role: Role, done: (c: TaskChoice) => void): void {
	const at = { x: evt.clientX, y: evt.clientY };
	// Defer the next menu so the first one can close cleanly.
	const next = (project?: Project): void => {
		window.setTimeout(() => pickType(at, role, project, done), 0);
	};

	const projects = visibleProjects(role);
	if (!projects.length) return next();

	const menu = new Menu();
	menu.addItem((i) => i.setTitle(`${role.name} (no project)`).setIcon(role.icon).onClick(() => next()));
	menu.addSeparator();
	projects.forEach((project) =>
		menu.addItem((i) => i.setTitle(project.name).setIcon(projectIcon(role, project)).onClick(() => next(project))),
	);
	menu.showAtMouseEvent(evt);
}
