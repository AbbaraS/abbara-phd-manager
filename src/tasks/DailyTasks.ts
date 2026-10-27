import { TAbstractFile, TFile, debounce } from 'obsidian';
import type ProjectManagerPlugin from '../main';
import { dueTimeTasks } from '../models/timeTasks';
import { dailyNoteDate, dailyNoteFile } from '../utils/dailyNotes';
import { newTaskId } from '../utils/ids';
import { todayIso } from '../utils/dates';
import { addTaskToNote } from './noteEdit';
import { TaskChoice, TaskText, buildTaskLine } from './taskLine';

const NEW_NOTE_MS = 4000;       // wait after a daily note is created so Rollover has finished
const CHECK_MS = 15 * 60 * 1000; // how often reminders are looked at while Obsidian stays open

// Puts tasks into daily notes: ones added from the dashboard for a day, and the reminder tasks for time tracking.
export class DailyTasks {
	constructor(private plugin: ProjectManagerPlugin) {}

	// Check once the tasks are indexed, when a daily note appears or opens, and now and then.
	register(): void {
		const { plugin } = this;
		const { app } = plugin;
		const check = debounce(() => void this.checkToday(), 2000, true);

		app.workspace.onLayoutReady(() => {
			plugin.registerEvent(app.vault.on('create', (file) => this.onCreate(file)));
			plugin.registerEvent(app.workspace.on('file-open', check));
			plugin.registerInterval(window.setInterval(check, CHECK_MS));
		});
		const once = plugin.tasks.on('updated', () => {
			if (!plugin.tasks.ready) return;
			plugin.tasks.offref(once);
			check();
		});
		plugin.registerEvent(once);
	}

	// Add a task from the dashboard. It goes in the daily note of `date` if that exists, else it waits for it.
	async addTask(choice: TaskChoice, full: TaskText, date: string): Promise<void> {
		const { plugin } = this;
		const id = newTaskId();
		const line = buildTaskLine(choice, id, full);
		plugin.taskLog.stamp(id);

		const file = dailyNoteFile(plugin.app, date);
		if (file) await addTaskToNote(plugin, file, line);
		else {
			plugin.settings.scheduledTasks.push({ id, date, line });
			await plugin.saveOptions();
		}
		plugin.tasks.changed();
		plugin.refreshDashboards();
	}

	// A daily note was created: fill it once Rollover is done.
	private onCreate(file: TAbstractFile): void {
		if (!(file instanceof TFile) || dailyNoteDate(this.plugin.app, file) === null) return;
		window.setTimeout(() => void this.fill(file), NEW_NOTE_MS);
	}

	private async checkToday(): Promise<void> {
		const file = dailyNoteFile(this.plugin.app, todayIso());
		if (file) await this.fill(file);
	}

	// Adds waiting future tasks (dated up to this note's day) and, for today's note, the reminder tasks.
	private async fill(file: TFile): Promise<void> {
		const { plugin } = this;
		const { settings, tasks } = plugin;
		const date = dailyNoteDate(plugin.app, file);
		if (!date || !tasks.ready) return;

		const waiting = settings.scheduledTasks.filter((t) => t.date <= date);
		if (waiting.length) {
			settings.scheduledTasks = settings.scheduledTasks.filter((t) => t.date > date);
			for (const task of waiting) await addTaskToNote(plugin, file, task.line);
			await plugin.saveOptions();
		}
		if (date === todayIso()) await this.addReminders(file, date);
	}

	// Submit-hours and timesheet reminders, at the top of their role's tasks. Done ones are never added again.
	private async addReminders(file: TFile, today: string): Promise<void> {
		const { settings, tasks } = this.plugin;
		for (const config of settings.timeRoles) {
			if (config.kind === 'timesheet' && config.lastSubmitted && !config.taskId) config.taskId = newTaskId();
		}
		for (const due of dueTimeTasks(settings.timeRoles, settings.periods, today)) {
			const role = settings.roles.find((r) => r.id === due.roleId);
			if (!role || tasks.isClosed(due.id)) continue;
			await addTaskToNote(this.plugin, file, buildTaskLine({ role }, due.id, { text: due.text }), true);
		}
		this.plugin.requestSaveOptions();
	}
}
