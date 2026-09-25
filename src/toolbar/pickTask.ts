import { Menu } from 'obsidian';
import { Project, Role } from '../models/types';
import { projectIcon, typesFor, visibleProjects } from '../models/resolve';
import { TaskChoice } from '../tasks/taskLine';
import { titleAndIcon } from '../utils/icon';

type Point = { x: number; y: number };

// Asks for a new project in `role`, then calls `then` with it once saved.
export type CreateProject = (role: Role, then: (project: Project) => void) => void;

// Step 2: pick a type (skipped when there are none).
function pickType(at: Point, role: Role, project: Project | undefined, done: (c: TaskChoice) => void): void {
	const types = typesFor(role, project);
	if (!types.length) return done({ role, project });

	const menu = new Menu();
	menu.addItem((i) => i.setTitle('No type').setIcon('circle').onClick(() => done({ role, project })));
	menu.addSeparator();
	types.forEach((type) =>
		menu.addItem((i) => titleAndIcon(i, type.name, type.icon).onClick(() => done({ role, project, type }))),
	);
	menu.showAtPosition(at);
}

// Step 1: pick a project for `role` (or make a new one), then hand over to the type picker.
export function pickTask(evt: MouseEvent, role: Role, createProject: CreateProject, done: (c: TaskChoice) => void): void {
	const at = { x: evt.clientX, y: evt.clientY };
	// Defer the next menu so the first one can close cleanly.
	const next = (project?: Project): void => {
		window.setTimeout(() => pickType(at, role, project, done), 0);
	};

	const menu = new Menu();
	menu.addItem((i) => titleAndIcon(i, `${role.name} (no project)`, role.icon).onClick(() => next()));
	menu.addSeparator();
	visibleProjects(role).forEach((project) =>
		menu.addItem((i) => titleAndIcon(i, project.name, projectIcon(role, project)).onClick(() => next(project))),
	);
	menu.addSeparator();
	menu.addItem((i) => i.setTitle('New project…').setIcon('plus').onClick(() => createProject(role, next)));
	menu.showAtMouseEvent(evt);
}
