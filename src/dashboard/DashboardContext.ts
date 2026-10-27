import type ProjectManagerPlugin from '../main';
import type { ManagerSettings } from '../models/types';
import type { Section } from './sections';

// The new-task form's current picks, kept across redraws so typing isn't lost.
export interface NewTaskForm {
	roleId: string;
	projectId: string;
	typeId: string;
	text: string;
	priority: string;
	due: string;
	date: string; // daily note the task first appears in
}

// Everything a dashboard section needs to draw itself.
export interface DashboardContext {
	plugin: ProjectManagerPlugin;
	settings: ManagerSettings;
	sections: Section[];                               // every section, default order
	columns: Record<string, 'left' | 'right'>;         // where each half-width section is drawn now (filled while drawing)
	filterRoles: Set<string>;                          // roles shown in the task table (empty = all)
	form: NewTaskForm;
	redraw: () => void;                                // draw again without saving
	saveLayout: () => void;                            // save settings, then draw again
}
