import { Setting } from 'obsidian';
import type { ManagerSettings } from '../../models/types';
import type { TimeKind } from '../../models/time';
import { newTaskId, slugify, uniqueId } from '../../utils/ids';
import type { SectionContext } from '../SettingsTab';

// Which roles track time, how their reminder tasks read, and the semesters (with hours limits) periods belong to.
export function renderTimeTracking(el: HTMLElement, settings: ManagerSettings, ctx: SectionContext): void {
	new Setting(el).setName('Time tracking').setHeading();
	el.createDiv({ cls: 'apm-hint', text: 'Roles that log hours on the dashboard. "Periods" = hours per course submitted in windows (GTA). "Timesheet" = one list handed in every week or so (ResLife). In reminder text, {period}, {from}, {to} and {last} are filled in.' });

	settings.timeRoles.forEach((config, i) => {
		const role = settings.roles.find((r) => r.id === config.roleId);
		new Setting(el).setName(role?.name ?? config.roleId).setDesc(role ? '' : 'This role no longer exists.')
			.addDropdown((d) => d.addOptions({ periods: 'Periods (courses)', timesheet: 'Timesheet' }).setValue(config.kind).onChange((v) => {
				config.kind = v as TimeKind;
				ctx.saveAndRedraw();
			}))
			.addButton((b) => b.setButtonText('Stop tracking').setWarning().onClick(() => {
				settings.timeRoles.splice(i, 1);
				ctx.saveAndRedraw();
			}));
		new Setting(el).setName('Reminder task').setDesc(config.kind === 'periods' ? 'Added during a period\'s submit window.' : 'Added when the timesheet is due.')
			.addText((t) => t.setValue(config.taskText).onChange((v) => { config.taskText = v; ctx.save(); }));
		if (config.kind !== 'timesheet') return;
		new Setting(el).setName('Remind after (days)').setDesc('Days since the last submission before the reminder task appears.')
			.addText((t) => { t.inputEl.type = 'number'; t.setValue(String(config.remindDays)).onChange((v) => { config.remindDays = Math.max(0, Number(v) || 0); ctx.save(); }); });
		new Setting(el).setName('Last submitted on').setDesc('Set when you press "Mark as submitted" on the dashboard.')
			.addText((t) => { t.inputEl.type = 'date'; t.setValue(config.lastSubmitted).onChange((v) => { config.lastSubmitted = v; config.taskId ||= newTaskId(); ctx.save(); }); });
	});

	// Add a role to track.
	const free = settings.roles.filter((r) => !settings.timeRoles.some((t) => t.roleId === r.id));
	if (free.length) {
		let picked = free[0].id;
		new Setting(el).setName('Track time for a role')
			.addDropdown((d) => d.addOptions(Object.fromEntries(free.map((r) => [r.id, r.name]))).setValue(picked).onChange((v) => (picked = v)))
			.addButton((b) => b.setButtonText('Add').onClick(() => {
				settings.timeRoles.push({ roleId: picked, kind: 'periods', taskText: 'Submit {period} hours between {from}-{to}', remindDays: 10, lastSubmitted: '', taskId: '' });
				ctx.saveAndRedraw();
			}));
	}

	// Semesters.
	el.createEl('h5', { text: 'Semesters' });
	settings.semesters.forEach((semester, i) => {
		new Setting(el).setName(semester.name || 'Semester')
			.addText((t) => t.setPlaceholder('Name').setValue(semester.name).onChange((v) => { semester.name = v; ctx.save(); }))
			.addText((t) => { t.inputEl.type = 'number'; t.setPlaceholder('Hours').setValue(String(semester.limitHours)).onChange((v) => { semester.limitHours = Number(v) || 0; ctx.save(); }); })
			.addButton((b) => b.setButtonText('Delete').setWarning().onClick(() => {
				settings.semesters.splice(i, 1);
				ctx.saveAndRedraw();
			}));
	});
	new Setting(el).addButton((b) => b.setButtonText('Add semester').onClick(() => {
		const name = `Semester ${settings.semesters.length + 1}`;
		settings.semesters.push({ id: uniqueId(slugify(name), settings.semesters.map((s) => s.id)), name, limitHours: 120 });
		ctx.saveAndRedraw();
	}));
}
