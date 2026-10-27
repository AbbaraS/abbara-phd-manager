import type ProjectManagerPlugin from '../main';
import { buildBadgeIndex } from '../models/badgeIndex';
import { buildTaskRows } from '../models/taskRows';
import { nowStamp } from '../utils/dates';

// Records when each task was created and completed (kept in data.json, never written into the notes),
// and marks a period submitted once its "submit hours" task is ticked.
export class TaskLog {
	private started = false;

	constructor(private plugin: ProjectManagerPlugin) {}

	register(): void {
		this.plugin.registerEvent(this.plugin.tasks.on('updated', () => this.update()));
	}

	// Note the creation time of a task made right now (the dashboard knows the exact moment).
	stamp(id: string): void {
		this.plugin.settings.taskMeta[`id:${id}`] = { created: nowStamp() };
		this.plugin.requestSaveOptions();
	}

	// Compare the notes with the log. The first pass only has days to go on (old tasks), later ones have the time.
	private update(): void {
		const { plugin } = this;
		const { settings, tasks } = plugin;
		if (!tasks.ready) return;
		const firstPass = !this.started;
		this.started = true;

		let dirty = false;
		const rows = buildTaskRows(tasks.entries(), buildBadgeIndex(settings.roles), settings.taskMeta);
		for (const row of rows) {
			let meta = settings.taskMeta[row.key];
			if (!meta) {
				meta = settings.taskMeta[row.key] = { created: firstPass ? row.createdGuess : nowStamp() };
				dirty = true;
			}
			if (row.state === 'done' && !meta.completed) {
				meta.completed = firstPass ? row.completedGuess : nowStamp();
				dirty = true;
			} else if (row.state !== 'done' && meta.completed) {
				delete meta.completed; // ticked by mistake and reopened
				dirty = true;
			}
			const period = row.id && settings.periods.find((p) => p.taskId === row.id);
			if (period && period.submitted !== (row.state === 'done')) {
				period.submitted = row.state === 'done';
				dirty = true;
			}
		}
		if (dirty) plugin.requestSaveOptions();
	}
}
