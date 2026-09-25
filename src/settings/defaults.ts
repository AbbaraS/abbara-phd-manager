import { ManagerSettings } from '../models/types';
import { DEFAULT_ROLES } from '../defaults/roles-projects-themes';

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
	doneBadgeLook: 'grey-strike',
	syncBadges: true,
	managedBadgeKeys: [],
};
