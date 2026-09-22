import { Project, Role } from '../models/types';
import { OptionKind } from '../models/resolve';
import { BadgeEntry } from '../models/badgeIndex';
import { badgeKeys, isTaskLine } from './taskBadges';

// What a task line's badges say about it.
export interface TaskInfo {
	role: Role;
	project?: Project;
	ownerKey: string;                          // the role or project badge key
	keys: Partial<Record<OptionKind, string>>; // current type / status badge keys
}

// Role, project, type and status of a task line, or null if it has no role badge of ours.
export function readTask(line: string, index: Map<string, BadgeEntry>): TaskInfo | null {
	if (!isTaskLine(line)) return null;
	let info: TaskInfo | null = null;

	for (const key of badgeKeys(line)) {
		const entry = index.get(key);
		if (!entry) continue;
		if (!info && (entry.kind === 'role' || entry.kind === 'project')) {
			info = { role: entry.role, project: entry.kind === 'project' ? entry.project : undefined, ownerKey: key, keys: {} };
		} else if (info && (entry.kind === 'type' || entry.kind === 'status') && entry.role === info.role) {
			info.keys[entry.kind] ??= key;
		}
	}
	return info;
}

// Where a new type/status badge goes: types after the role/project, statuses after the type.
export function insertAfter(info: TaskInfo, kind: OptionKind): string {
	return kind === 'status' ? info.keys.type ?? info.ownerKey : info.ownerKey;
}
