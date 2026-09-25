import { MarkdownRenderChild, TFile, moment } from 'obsidian';
import type ProjectManagerPlugin from '../main';
import { buildBadgeIndex, roleIdOf } from '../models/badgeIndex';
import { copyKey } from '../sort/firstSeen';
import { dailyNoteDate } from '../utils/dailyNotes';
import { countToday } from './countToday';
import { TodayRole, renderToday } from './renderToday';

// Code block name: ```apm-today``` in a daily note (e.g. the daily template).
export const TODAY_BLOCK = 'apm-today';

const REDRAW_MS = 30 * 60 * 1000; // so "Today" becomes the date after midnight

// A two-line glance at this note's tasks: done / added / open, overall and per role.
export class TodayBlock extends MarkdownRenderChild {
	constructor(el: HTMLElement, private plugin: ProjectManagerPlugin, private sourcePath: string) {
		super(el);
	}

	onload(): void {
		this.render();
		this.registerEvent(this.plugin.tasks.on('updated', () => this.render()));
		this.registerEvent(this.plugin.filter.on('changed', () => this.render()));
		this.registerInterval(window.setInterval(() => this.render(), REDRAW_MS));
	}

	// Count this note's tasks and redraw.
	private render(): void {
		const { app, settings, tasks, filter } = this.plugin;
		const file = app.vault.getAbstractFileByPath(this.sourcePath);
		const today = moment().format('YYYY-MM-DD');
		const date = dailyNoteDate(app, file instanceof TFile ? file : null) ?? today;

		// "Added" = the task's ➕ date, else the first daily note it appears in, is this note's day.
		const index = buildBadgeIndex(settings.roles);
		const firstSeen = tasks.firstSeen();
		const stats = countToday(
			tasks.tasksIn(this.sourcePath),
			(keys) => roleIdOf(keys, index),
			(task) => (task.created ?? firstSeen.get(copyKey(task))) === date,
		);

		const roles: TodayRole[] = settings.roles
			.filter((role) => stats.roles.has(role.id))
			.map((role) => ({ id: role.id, name: role.name, icon: role.icon, color: role.color, tally: stats.roles.get(role.id)! }));

		this.containerEl.empty();
		renderToday(this.containerEl, {
			title: date === today ? 'Today' : moment(date, 'YYYY-MM-DD').format('ddd D MMM'),
			overall: stats.overall,
			roles,
			filter: filter.roles,
			hideDone: filter.hideDone,
			onToggleDone: () => filter.toggleDone(),
			onRoleClick: (id) => filter.showOnly(id),
		});
	}
}
