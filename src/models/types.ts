// A kind of task, e.g. "Bug", "Reading" or "Meeting".
export interface TaskType {
	id: string;    // short key used in badge names
	name: string;  // display name
	icon: string;  // Lucide icon name
	color: string; // hex colour, empty = use the project shade
}

// A piece of work inside a role.
export interface Project {
	id: string;
	name: string;
	color: string;       // hex override, empty = auto shade of the role colour
	types: TaskType[];   // own types, empty = inherit the role's types
}

// A hat you wear, e.g. "PhD" or "ResLife".
export interface Role {
	id: string;
	name: string;
	icon: string;        // Lucide icon name for the badge and toolbar
	color: string;       // theme colour, projects are shades of it
	projects: Project[];
	types: TaskType[];   // default task types for every project in this role
}

// Everything the plugin saves to data.json.
export interface ManagerSettings {
	roles: Role[];
	dailyNotesOnly: boolean;     // show the toolbar only on daily notes
	syncBadges: boolean;         // push role/project/type badges into Custom Badges
	managedBadgeKeys: string[];  // badge keys this plugin created, so it can tidy them up
}
