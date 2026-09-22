import { Project, Role, TaskType } from '../models/types';

// Starting roles, projects, themes and task types, built into the plugin.
// Only used for a fresh install and "Reset to defaults".
// Your live roles are in roles-projects-themes.json in the plugin folder (edit that to change them now).

// Small helpers so the lists below stay short.
const type = (id: string, name: string, icon: string, color = ''): TaskType => ({ id, name, icon, color });
const project = (id: string, name: string, types: TaskType[] = []): Project => ({ id, name, color: '', types });

export const DEFAULT_ROLES: Role[] = [
	{
		id: 'phd', name: 'PhD', icon: 'book-heart', color: '#C62525',
		projects: [
			project('tts-3d', 'TTS 3D'),
			project('tts-2d', 'TTS 2D multiview'),
			project('jan-report', 'January Report'),
		],
		types: [
			type('code', 'Code', 'code'),
			type('write', 'Write', 'pen-line'),
			type('email', 'Email', 'mail'),
		],
	},
	{
		id: 'gta', name: 'GTA', icon: 'id-card-lanyard', color: '#32C2CC',
		projects: [
			project('comp', 'COMP'),
			project('eeen', 'EEEN'),
		],
		types: [
			type('lab', 'Lab', 'presentation'),
			type('admin', 'Admin', 'clipboard-list'),
		],
	},
	{
		id: 'reslife', name: 'ResLife', icon: 'handshake', color: '#339933',
		projects: [
			project('schedule', 'Schedule'),
			project('timesheet', 'Timesheet'),
		],
		types: [
			type('shiftswap', 'Shift swap', 'calendar-clock'),
		],
	},
	{
		id: 'jobshop', name: 'JobShop', icon: 'cake-slice', color: '#FF7F50',
		projects: [
			project('wp-website', 'WP Website'),
		],
		types: [
			type('addshift', 'Add shift', 'clipboard-list'),
		],
	},
	{
		id: 'obsidian', name: 'Obsidian', icon: 'obsidian-new', color: '#CACACA',
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
		id: 'vscode', name: 'VS Code', icon: 'code-xml', color: '#4F6BED',
		projects: [
			project('abbara-theme', 'Abbara theme'),
		],
		types: [],
	},
];
