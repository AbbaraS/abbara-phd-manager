import type { Period, TimeRole } from './time';
import { daysUntil, shortDate } from '../utils/dates';

// A reminder task that should exist today.
export interface DueTimeTask {
	id: string;
	roleId: string;
	text: string;
}

// Fills {period}, {from}, {to} and {last} in a task description.
export function fillText(template: string, values: Record<string, string>): string {
	return template.replace(/\{(\w+)\}/g, (all, key: string) => values[key] ?? all);
}

// Reminder tasks due today: one per period whose submit window is open and not yet submitted, and one per
// timesheet role that was last submitted `remindDays` or more days ago.
export function dueTimeTasks(timeRoles: TimeRole[], periods: Period[], today: string): DueTimeTask[] {
	const out: DueTimeTask[] = [];
	for (const period of periods) {
		const config = timeRoles.find((t) => t.roleId === period.roleId && t.kind === 'periods');
		if (!config || period.submitted || today < period.from || today > period.to) continue;
		const text = fillText(config.taskText, { period: period.name, from: shortDate(period.from), to: shortDate(period.to) });
		out.push({ id: period.taskId, roleId: period.roleId, text });
	}
	for (const config of timeRoles) {
		if (config.kind !== 'timesheet' || !config.lastSubmitted || !config.taskId) continue;
		const since = daysUntil(config.lastSubmitted, new Date(today + 'T00:00:00'));
		if (since === null || -since < config.remindDays) continue;
		out.push({ id: config.taskId, roleId: config.roleId, text: fillText(config.taskText, { last: shortDate(config.lastSubmitted) }) });
	}
	return out;
}
