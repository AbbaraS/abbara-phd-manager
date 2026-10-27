import type { Role } from '../models/types';
import type { TimeRole } from '../models/time';

// One block of the dashboard.
export interface Section {
	id: string;
	name: string;
	icon: string;
}

// Sections in their default page order: summary cards, tasks, then one per time-tracked role ("time:<role id>").
export function dashboardSections(timeRoles: TimeRole[], roles: Role[]): Section[] {
	const out: Section[] = [
		{ id: 'progress', name: 'Project summary', icon: 'gauge' },
		{ id: 'tasks', name: 'Tasks', icon: 'list-checks' },
	];
	for (const config of timeRoles) {
		const role = roles.find((r) => r.id === config.roleId);
		if (role) out.push({ id: `time:${role.id}`, name: `${role.name} hours`, icon: 'clock' });
	}
	return out;
}

// Sections in your saved order; ones missing from it (new ones) keep their default place.
export function orderedSections(order: string[], all: Section[]): Section[] {
	const out = order.map((id) => all.find((x) => x.id === id)).filter((x): x is Section => !!x);
	all.forEach((x, i) => {
		if (out.includes(x)) return;
		const before = all.slice(0, i).reverse().find((y) => out.includes(y)); // after its default neighbour
		out.splice(before ? out.indexOf(before) + 1 : 0, 0, x);
	});
	return out;
}

// The order after moving section `id` before or after `target`.
export function moveSection(order: string[], all: Section[], id: string, target: string, after: boolean): string[] {
	const ids = orderedSections(order, all).map((x) => x.id).filter((x) => x !== id);
	ids.splice(ids.indexOf(target) + (after ? 1 : 0), 0, id);
	return ids;
}
