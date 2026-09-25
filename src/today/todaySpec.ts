import { TFile, moment } from 'obsidian';
import type ProjectManagerPlugin from '../main';
import { buildBadgeIndex, roleIdOf } from '../models/badgeIndex';
import { copyKey } from '../sort/firstSeen';
import { dailyNoteDate } from '../utils/dailyNotes';
import { countToday } from './countToday';
import { TodayRole, TodaySpec } from './renderToday';

// Everything the Today panel shows for one note, with its buttons wired to the plugin.
export function todaySpec(plugin: ProjectManagerPlugin, sourcePath: string): TodaySpec {
	const { app, settings, tasks, filter, pinnedToday } = plugin;
	const file = app.vault.getAbstractFileByPath(sourcePath);
	const today = moment().format('YYYY-MM-DD');
	const date = dailyNoteDate(app, file instanceof TFile ? file : null) ?? today;

	// "Added" = the task's ➕ date, else the first daily note it appears in, is this note's day.
	const index = buildBadgeIndex(settings.roles);
	const firstSeen = tasks.firstSeen();
	const stats = countToday(
		tasks.tasksIn(sourcePath),
		(keys) => roleIdOf(keys, index),
		(task) => (task.created ?? firstSeen.get(copyKey(task))) === date,
	);

	const roles: TodayRole[] = settings.roles
		.filter((role) => stats.roles.has(role.id))
		.map((role) => ({ id: role.id, name: role.name, icon: role.icon, color: role.color, tally: stats.roles.get(role.id)! }));

	return {
		title: date === today ? 'Today' : moment(date, 'YYYY-MM-DD').format('ddd D MMM'),
		overall: stats.overall,
		roles,
		filter: filter.roles,
		hideDone: filter.hideDone,
		pinned: pinnedToday.pinned,
		onToggleDone: () => filter.toggleDone(),
		onTogglePin: () => pinnedToday.toggle(),
		onRoleClick: (id) => filter.showOnly(id),
	};
}
