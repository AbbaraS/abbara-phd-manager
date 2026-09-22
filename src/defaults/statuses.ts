import type { TaskStatus } from '../models/types';

// Auto colours for statuses without their own: grey, blue, amber, green, red, purple.
// Strong enough for white text on a solid badge.
export const STATUS_PALETTE = ['#7A7A7A', '#2F80ED', '#D98E04', '#219653', '#D64545', '#8E44AD'];

// Starter statuses offered by "Add starter statuses" and used by the default roles.
export const starterStatuses = (): TaskStatus[] => [
	{ id: 'todo', name: 'To do', icon: 'circle-dashed', color: '#7A7A7A' },
	{ id: 'doing', name: 'In progress', icon: 'loader', color: '#2F80ED' },
	{ id: 'waiting', name: 'Waiting', icon: 'hourglass', color: '#D98E04' },
	{ id: 'done', name: 'Done', icon: 'circle-check', color: '#219653' },
];
