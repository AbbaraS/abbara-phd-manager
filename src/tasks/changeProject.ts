import { Project } from '../models/types';
import { BadgeEntry } from '../models/badgeIndex';
import { OptionKind, optionKey, optionsFor, projectKey, roleKey } from '../models/resolve';
import { TaskInfo } from './readTask';
import { setBadge } from './taskBadges';

const KINDS: OptionKind[] = ['type', 'status'];

// Move a task line to another project of its role (undefined = role only).
// Type and status carry over when the new project has one with the same id, else they're removed.
export function changeProject(line: string, task: TaskInfo, index: Map<string, BadgeEntry>, project?: Project): string {
	const { role } = task;
	let out = setBadge(line, task.ownerKey, project ? projectKey(role, project) : roleKey(role), '');

	for (const kind of KINDS) {
		const oldKey = task.keys[kind];
		const entry = oldKey ? index.get(oldKey) : undefined;
		if (!oldKey || !entry || !('option' in entry)) continue;
		const match = optionsFor(kind, role, project).find((o) => o.id === entry.option.id);
		out = setBadge(out, oldKey, match ? optionKey(kind, role, match, project) : null, '');
	}
	return out;
}
