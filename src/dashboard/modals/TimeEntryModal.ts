import { App, Modal, Notice, Setting } from 'obsidian';
import type ProjectManagerPlugin from '../../main';
import type { TimeEntry, TimeRole } from '../../models/time';
import { addType } from '../../models/newType';
import { typesFor } from '../../models/resolve';
import { defaultPeriod, formatMinutes, minutesBetween, semesterMinutes } from '../../models/timeTotals';
import { newTaskId } from '../../utils/ids';
import { todayIso } from '../../utils/dates';

const NEW_TYPE = '__new';

// Popup to log time (or edit an entry): date, course and period for periods-based roles, hours and minutes
// or start and end, an optional type (or a new one) and a note.
export class TimeEntryModal extends Modal {
	private f = {
		date: todayIso(), projectId: '', periodId: '', typeId: '', range: false,
		hours: '', mins: '', start: '', end: '', note: '', newName: '', newIcon: '',
	};
	private preview!: HTMLElement;

	constructor(app: App, private plugin: ProjectManagerPlugin, private config: TimeRole, private existing?: TimeEntry) {
		super(app);
		const { f } = this;
		if (existing) {
			Object.assign(f, {
				date: existing.date, projectId: existing.projectId, periodId: existing.periodId, typeId: existing.typeId, note: existing.note,
				range: !!(existing.start && existing.end), start: existing.start, end: existing.end,
				hours: String(Math.floor(existing.minutes / 60)), mins: String(existing.minutes % 60),
			});
		} else if (config.kind === 'periods') {
			f.periodId = defaultPeriod(plugin.settings.periods.filter((p) => p.roleId === config.roleId), f.date)?.id ?? '';
		}
	}

	onOpen(): void {
		this.draw();
	}

	onClose(): void {
		this.contentEl.empty();
	}

	// Minutes the current inputs add up to.
	private minutes(): number {
		const { f } = this;
		return f.range ? minutesBetween(f.start, f.end) : (Number(f.hours) || 0) * 60 + (Number(f.mins) || 0);
	}

	private draw(): void {
		const { f, config, plugin, contentEl } = this;
		const { settings } = plugin;
		const role = settings.roles.find((r) => r.id === config.roleId);
		contentEl.empty();
		this.titleEl.setText(`${this.existing ? 'Edit' : 'Log'} ${role?.name ?? ''} time`);
		if (!role) return;
		const periods = config.kind === 'periods';

		new Setting(contentEl).setName('Date').addText((t) => {
			t.inputEl.type = 'date';
			t.setValue(f.date).onChange((v) => (f.date = v));
		});

		const project = role.projects.find((p) => p.id === f.projectId);
		if (periods) {
			new Setting(contentEl).setName('Course').setDesc('The project this time counts towards.').addDropdown((d) => d
				.addOptions(Object.fromEntries([['', 'Choose…'], ...role.projects.map((p): [string, string] => [p.id, p.name])]))
				.setValue(f.projectId).onChange((v) => { f.projectId = v; f.typeId = ''; this.draw(); }));
			const list = settings.periods.filter((p) => p.roleId === config.roleId);
			new Setting(contentEl).setName('Period').setDesc('Which submission it goes in.').addDropdown((d) => d
				.addOptions(Object.fromEntries([['', list.length ? 'Choose…' : 'Add a period first'], ...list.map((p): [string, string] => [p.id, p.name])]))
				.setValue(f.periodId).onChange((v) => (f.periodId = v)));
		}

		// Hours and minutes, or start and end.
		new Setting(contentEl).setName('Time').addDropdown((d) => d
			.addOptions({ duration: 'Hours and minutes', range: 'Start and end' }).setValue(f.range ? 'range' : 'duration')
			.onChange((v) => { f.range = v === 'range'; this.draw(); }));
		const time = new Setting(contentEl).setName(f.range ? 'Start and end' : 'Hours and minutes');
		const update = () => this.preview.setText(this.minutes() ? `= ${formatMinutes(this.minutes())}` : '');
		if (f.range) {
			time.addText((t) => { t.inputEl.type = 'time'; t.setValue(f.start).onChange((v) => { f.start = v; update(); }); });
			time.addText((t) => { t.inputEl.type = 'time'; t.setValue(f.end).onChange((v) => { f.end = v; update(); }); });
		} else {
			time.addText((t) => { t.inputEl.type = 'number'; t.inputEl.min = '0'; t.setPlaceholder('hours').setValue(f.hours).onChange((v) => { f.hours = v; update(); }); });
			time.addText((t) => { t.inputEl.type = 'number'; t.inputEl.min = '0'; t.setPlaceholder('mins').setValue(f.mins).onChange((v) => { f.mins = v; update(); }); });
		}
		this.preview = time.controlEl.createSpan({ cls: 'apm-muted' });
		update();

		// Type: the project's (or role's) types, or a new one.
		const types = typesFor(role, project);
		const typeOptions: Record<string, string> = { '': 'No type', ...Object.fromEntries(types.map((t) => [t.id, t.name])), [NEW_TYPE]: 'New type…' };
		new Setting(contentEl).setName('Type').setDesc('Optional. New types are also offered when adding tasks.').addDropdown((d) => d
			.addOptions(typeOptions).setValue(f.typeId).onChange((v) => { f.typeId = v; this.draw(); }));
		if (f.typeId === NEW_TYPE) {
			new Setting(contentEl).setName('New type name').addText((t) => t.setValue(f.newName).onChange((v) => (f.newName = v)));
			new Setting(contentEl).setName('New type icon').setDesc('Lucide icon name or an emoji.').addText((t) => t.setPlaceholder('tag').setValue(f.newIcon).onChange((v) => (f.newIcon = v.trim())));
		}

		new Setting(contentEl).setName('Note').setDesc('Optional.').addText((t) => t.setValue(f.note).onChange((v) => (f.note = v)));

		const buttons = new Setting(contentEl);
		if (this.existing) buttons.addButton((b) => b.setButtonText('Delete').setWarning().onClick(() => void this.remove()));
		buttons.addButton((b) => b.setButtonText('Cancel').onClick(() => this.close()));
		buttons.addButton((b) => b.setButtonText('Save').setCta().onClick(() => void this.save()));
	}

	private async remove(): Promise<void> {
		const { settings } = this.plugin;
		settings.timeEntries = settings.timeEntries.filter((e) => e.id !== this.existing?.id);
		await this.plugin.commit();
		this.close();
	}

	private async save(): Promise<void> {
		const { f, config, plugin } = this;
		const { settings } = plugin;
		const role = settings.roles.find((r) => r.id === config.roleId);
		const minutes = this.minutes();
		if (!role) return;
		if (!f.date) return void new Notice('Pick a date.');
		if (minutes <= 0) return void new Notice('Enter the time worked.');
		const periods = config.kind === 'periods';
		if (periods && (!f.projectId || !f.periodId)) return void new Notice('Choose a course and a period.');
		if (f.typeId === NEW_TYPE && !f.newName.trim()) return void new Notice('Name the new type.');

		// A semester can't go over its hours.
		const period = settings.periods.find((p) => p.id === f.periodId);
		const semester = settings.semesters.find((s) => s.id === period?.semesterId);
		if (periods && semester) {
			const used = semesterMinutes(settings.timeEntries, settings.periods, semester, this.existing?.id);
			if (used + minutes > semester.limitHours * 60) {
				return void new Notice(`That would go over the ${semester.limitHours} hour limit for ${semester.name} (${formatMinutes(used)} logged, ${formatMinutes(Math.max(0, semester.limitHours * 60 - used))} left).`, 8000);
			}
		}

		let typeId = f.typeId;
		if (typeId === NEW_TYPE) {
			typeId = addType(role, role.projects.find((p) => p.id === f.projectId), f.newName.trim(), f.newIcon).id;
			await plugin.saveSettings();
		}
		const entry: TimeEntry = {
			id: this.existing?.id ?? newTaskId() + newTaskId(), roleId: config.roleId, projectId: f.projectId, typeId,
			periodId: periods ? f.periodId : '', date: f.date, start: f.range ? f.start : '', end: f.range ? f.end : '',
			minutes, note: f.note.trim(), submittedOn: this.existing?.submittedOn ?? '',
		};
		settings.timeEntries = [...settings.timeEntries.filter((e) => e.id !== entry.id), entry];
		await plugin.commit();
		this.close();
	}
}
