import { Project, Role, TaskType } from '../models/types';
import { starterStatuses } from './statuses';

// Starting roles, projects, themes and task types, built into the plugin.
// Only used for a fresh install and "Reset to defaults".
// Your live roles are in roles-projects-themes.json in the plugin folder (edit that to change them now).

// Small helpers so the lists below stay short.
const type = (id: string, name: string, icon: string, color = ''): TaskType => ({ id, name, icon, color });
const project = (id: string, name: string, icon = ''): Project =>
	({ id, name, icon, color: '', hidden: false, deadline: '', types: [], statuses: [] });

export const DEFAULT_ROLES: Role[] = [
	{
		id: 'phd', name: 'PhD', icon: 'book-heart', color: '#C62525', hidden: false, statuses: starterStatuses(),
		projects: [
			project('tts-3d', 'TTS 3D', 'box'),
			project('tts-2d', 'TTS 2D multiview', 'layers'),
			project('jan-report', 'January Report', 'file-text'),
		],
		types: [
			type('code', 'Code', 'code'),
			type('write', 'Write', 'pen-line'),
			type('email', 'Email', 'mail'),
		],
	},
	{
		id: 'reslife', name: 'ResLife', icon: 'handshake', color: '#339933', hidden: false, statuses: starterStatuses(),
		projects: [
			project('schedule', 'Schedule'),
			project('timesheet', 'Timesheet'),
		],
		types: [
			type('shiftswap', 'Shift swap', 'calendar-clock'),
		],
	},
	{
		id: 'obsidian', name: 'Obsidian', icon: 'obsidian-new', color: '#CACACA', hidden: false, statuses: starterStatuses(),
		projects: [
			project('custom-badges', 'custom-badges'),
			project('phd-manager', 'abbara-phd-manager'),
		],
		types: [
			type('feature', 'Feature', 'sparkles'),
			type('bug', 'Bug', 'bug', '#f44336'),
			type('docs', 'Docs', 'file-text'),
		],
	},
	{
		id: 'vscode', name: 'VS Code', icon: 'code-xml', color: '#4F6BED', hidden: false, statuses: starterStatuses(),
		projects: [
			project('abbara-theme', 'Abbara theme'),
		],
		types: [],
	},
];
