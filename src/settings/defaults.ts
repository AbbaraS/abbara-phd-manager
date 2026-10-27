import { ManagerSettings } from '../models/types';
import { DEFAULT_ROLES } from '../defaults/roles-projects-themes';
import { DEFAULT_TIME_ROLES } from '../models/time';

// Deep copy so edits in settings never change the defaults file.
export const cloneRoles = () => structuredClone(DEFAULT_ROLES);

// Settings a fresh install starts with.
export const DEFAULT_SETTINGS: ManagerSettings = {
	roles: cloneRoles(),
	dailyNotesOnly: true,
	carryOnEnter: true,
	sortNewDailyNotes: true,
	insertInOrder: true,
	roleDividers: true,
	hideCompleted: false,
	collapsedRoles: [],
	pinToday: false,
	doneBadgeLook: 'grey-strike',
	syncBadges: true,
	managedBadgeKeys: [],
	dashOrder: [],
	dashHidden: [],
	dashCollapsed: [],
	dashHalf: [],
	dashColumns: {},
	dashCollapsedGroups: [],
	dashHideDone: false,
	dashClosedPeriods: [],
	dashOpenPeriods: [],
	taskMeta: {},
	scheduledTasks: [],
	timeRoles: structuredClone(DEFAULT_TIME_ROLES),
	semesters: [],
	periods: [],
	timeEntries: [],
};
