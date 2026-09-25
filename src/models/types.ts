// An optional pick on a task: a type ("Bug", "Reading") or a status ("In progress", "Done").
export interface TaskOption {
	id: string;    // short key used in badge names
	name: string;  // display name
	icon: string;  // Lucide icon name
	color: string; // hex colour, empty = auto (pastel for types, status palette for statuses)
}

// Same shape, named for readability where it matters.
export type TaskType = TaskOption;
export type TaskStatus = TaskOption;

// A piece of work inside a role.
export interface Project {
	id: string;
	name: string;
	icon: string;           // Lucide icon name, empty = the role's icon
	color: string;          // hex override, empty = auto shade of the role colour
	hidden: boolean;        // true = left out of the toolbar menu, badges still kept
	deadline: string;       // "YYYY-MM-DD", empty = none
	types: TaskType[];      // own types, empty = inherit the role's types
	statuses: TaskStatus[]; // own statuses, empty = inherit the role's statuses
}

// A hat you wear, e.g. "PhD" or "ResLife".
export interface Role {
	id: string;
	name: string;
	icon: string;           // Lucide icon name for the badge and toolbar
	color: string;          // theme colour, projects are shades of it
	hidden: boolean;        // true = left out of the toolbar, badges still kept
	projects: Project[];
	types: TaskType[];      // default task types for every project in this role
	statuses: TaskStatus[]; // default task statuses for every project in this role
}

// Everything the plugin saves to data.json.
export interface ManagerSettings {
	roles: Role[];
	dailyNotesOnly: boolean;     // show the toolbar only on daily notes
	carryOnEnter: boolean;       // Enter on a badge task starts a new task with the same badges
	sortNewDailyNotes: boolean;  // sort tasks in a new daily note (after Rollover adds them)
	syncBadges: boolean;         // push role/project/type/status badges into Custom Badges
	managedBadgeKeys: string[];  // badge keys this plugin created, so it can tidy them up
}
