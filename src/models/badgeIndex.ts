import { Project, Role, TaskOption } from './types';
import { OptionKind, optionKey, projectKey, roleKey } from './resolve';

// What a badge key points at.
export type BadgeEntry =
	| { kind: 'role'; role: Role }
	| { kind: 'project'; role: Role; project: Project }
	| { kind: OptionKind; role: Role; project?: Project; option: TaskOption };

// Map every badge key the plugin makes to its role / project / option.
export function buildBadgeIndex(roles: Role[]): Map<string, BadgeEntry> {
	const index = new Map<string, BadgeEntry>();
	const addOptions = (kind: OptionKind, role: Role, list: TaskOption[], project?: Project) =>
		list.forEach((option) => index.set(optionKey(kind, role, option, project), { kind, role, project, option }));

	for (const role of roles) {
		index.set(roleKey(role), { kind: 'role', role });
		addOptions('type', role, role.types);
		addOptions('status', role, role.statuses);
		for (const project of role.projects) {
			index.set(projectKey(role, project), { kind: 'project', role, project });
			addOptions('type', role, project.types, project);
			addOptions('status', role, project.statuses, project);
		}
	}
	return index;
}
