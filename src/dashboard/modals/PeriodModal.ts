import { App, Modal, Notice, Setting } from 'obsidian';
import type ProjectManagerPlugin from '../../main';
import type { Period, TimeRole } from '../../models/time';
import { newTaskId, slugify, uniqueId } from '../../utils/ids';

const NEW_SEMESTER = '__new';

// Popup to add or edit a period: its name (e.g. "Sep/Oct"), its semester and the days hours are submitted on.
export class PeriodModal extends Modal {
	private f = { name: '', semesterId: '', from: '', to: '', semesterName: '', limit: '120' };

	constructor(app: App, private plugin: ProjectManagerPlugin, private config: TimeRole, private existing?: Period) {
		super(app);
		const { semesters } = plugin.settings;
		this.f.semesterId = existing?.semesterId ?? semesters[semesters.length - 1]?.id ?? NEW_SEMESTER;
		this.f.semesterName = `Semester ${semesters.length + 1}`;
		if (existing) Object.assign(this.f, { name: existing.name, from: existing.from, to: existing.to });
	}

	onOpen(): void {
		this.draw();
	}

	onClose(): void {
		this.contentEl.empty();
	}

	private draw(): void {
		const { f, plugin, contentEl } = this;
		const { semesters } = plugin.settings;
		contentEl.empty();
		this.titleEl.setText(this.existing ? 'Edit period' : 'New period');

		new Setting(contentEl).setName('Period').setDesc('e.g. Sep/Oct, Nov, Dec.').addText((t) => t.setValue(f.name).onChange((v) => (f.name = v)));
		new Setting(contentEl).setName('Semester').addDropdown((d) => d
			.addOptions({ ...Object.fromEntries(semesters.map((s) => [s.id, `${s.name} (${s.limitHours}h)`])), [NEW_SEMESTER]: 'New semester…' })
			.setValue(f.semesterId).onChange((v) => { f.semesterId = v; this.draw(); }));
		if (f.semesterId === NEW_SEMESTER) {
			new Setting(contentEl).setName('Semester name').addText((t) => t.setValue(f.semesterName).onChange((v) => (f.semesterName = v)));
			new Setting(contentEl).setName('Hours limit').setDesc('The most hours you can log in the semester.').addText((t) => {
				t.inputEl.type = 'number';
				t.setValue(f.limit).onChange((v) => (f.limit = v));
			});
		}
		new Setting(contentEl).setName('Submit from').addText((t) => { t.inputEl.type = 'date'; t.setValue(f.from).onChange((v) => (f.from = v)); });
		new Setting(contentEl).setName('Submit until').addText((t) => { t.inputEl.type = 'date'; t.setValue(f.to).onChange((v) => (f.to = v)); });

		const buttons = new Setting(contentEl);
		if (this.existing) buttons.addButton((b) => b.setButtonText('Delete').setWarning().onClick(() => void this.remove()));
		buttons.addButton((b) => b.setButtonText('Cancel').onClick(() => this.close()));
		buttons.addButton((b) => b.setButtonText('Save').setCta().onClick(() => void this.save()));
	}

	private async remove(): Promise<void> {
		const { settings } = this.plugin;
		const id = this.existing?.id;
		if (settings.timeEntries.some((e) => e.periodId === id)) return void new Notice('Move or delete this period\'s time entries first.');
		settings.periods = settings.periods.filter((p) => p.id !== id);
		await this.plugin.commit();
		this.close();
	}

	private async save(): Promise<void> {
		const { f, plugin, config } = this;
		const { settings } = plugin;
		const name = f.name.trim();
		if (!name) return void new Notice('Name the period.');
		if (!f.from || !f.to || f.to < f.from) return void new Notice('Pick the submit dates, from first.');

		let semesterId = f.semesterId;
		if (semesterId === NEW_SEMESTER) {
			const limitHours = Number(f.limit);
			if (!f.semesterName.trim() || !(limitHours > 0)) return void new Notice('Give the semester a name and an hours limit.');
			semesterId = uniqueId(slugify(f.semesterName) || 'semester', settings.semesters.map((s) => s.id));
			settings.semesters.push({ id: semesterId, name: f.semesterName.trim(), limitHours });
		}
		const period: Period = {
			id: this.existing?.id ?? uniqueId(slugify(name) || 'period', settings.periods.map((p) => p.id)),
			roleId: config.roleId, semesterId, name, from: f.from, to: f.to,
			taskId: this.existing?.taskId ?? newTaskId(), submitted: this.existing?.submitted ?? false,
		};
		settings.periods = [...settings.periods.filter((p) => p.id !== period.id), period];
		await plugin.commit();
		this.close();
	}
}
