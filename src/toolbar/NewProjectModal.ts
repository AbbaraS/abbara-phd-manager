import { App, Modal, Notice, Setting } from 'obsidian';
import { Project, Role } from '../models/types';
import { blankProject } from '../models/newProject';
import { shadeOf } from '../utils/colour';
import { slugify } from '../utils/ids';

// Popup to add a project to `role`, with the same fields as settings.
// `onCreate` gets the finished project; the caller saves it.
export class NewProjectModal extends Modal {
	private fields = { name: '', icon: '', deadline: '', color: '', ownTypes: false, ownStatuses: false };

	constructor(app: App, private role: Role, private onCreate: (project: Project) => void) {
		super(app);
	}

	onOpen(): void {
		const { role, fields, contentEl } = this;
		const n = role.projects.length;
		this.titleEl.setText(`New ${role.name} project`);

		// Name, with a live badge key preview.
		const name = new Setting(contentEl).setName('Name').setDesc(`Badge key: ${role.id}-…`);
		name.addText((t) => {
			t.setPlaceholder('e.g. January Report').onChange((v) => {
				fields.name = v;
				name.setDesc(`Badge key: ${role.id}-${slugify(v) || '…'}`);
			});
			t.inputEl.addEventListener('keydown', (evt) => evt.key === 'Enter' && this.submit());
			window.setTimeout(() => t.inputEl.focus(), 0);
		});

		new Setting(contentEl).setName('Icon').setDesc('Lucide icon name or an emoji, empty = the role icon.')
			.addText((t) => t.setPlaceholder(role.icon).onChange((v) => (fields.icon = v.trim())));
		new Setting(contentEl).setName('Deadline').setDesc('Optional. Shows a card in the progress block.')
			.addText((t) => {
				t.inputEl.type = 'date';
				t.onChange((v) => (fields.deadline = v));
			});
		new Setting(contentEl).setName('Colour').setDesc('Starts as an auto shade of the role colour.')
			.addColorPicker((c) => c.setValue(shadeOf(role.color, n, n + 1)).onChange((v) => (fields.color = v)));
		new Setting(contentEl).setName('Own task types').setDesc('Start from a copy of the role\'s types.')
			.addToggle((t) => t.onChange((v) => (fields.ownTypes = v)));
		new Setting(contentEl).setName('Own statuses').setDesc('Start from a copy of the role\'s statuses.')
			.addToggle((t) => t.onChange((v) => (fields.ownStatuses = v)));

		new Setting(contentEl)
			.addButton((b) => b.setButtonText('Cancel').onClick(() => this.close()))
			.addButton((b) => b.setButtonText('Create').setCta().onClick(() => this.submit()));
	}

	onClose(): void {
		this.contentEl.empty();
	}

	// Build the project and hand it over.
	private submit(): void {
		const { role, fields } = this;
		const name = fields.name.trim();
		if (!name) {
			new Notice('Give the project a name.');
			return;
		}
		const project: Project = {
			...blankProject(role, name),
			icon: fields.icon,
			deadline: fields.deadline,
			color: fields.color,
			types: fields.ownTypes ? structuredClone(role.types) : [],
			statuses: fields.ownStatuses ? structuredClone(role.statuses) : [],
		};
		this.close();
		this.onCreate(project);
	}
}
