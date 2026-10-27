import { App, Modal, Notice, Setting } from 'obsidian';

// Popup with a date and one button, e.g. "Mark as submitted on …".
export class DateModal extends Modal {
	private date: string;

	constructor(app: App, private title: string, private action: string, initial: string, private onSubmit: (date: string) => void) {
		super(app);
		this.date = initial;
	}

	onOpen(): void {
		this.titleEl.setText(this.title);
		new Setting(this.contentEl).setName('Date').addText((t) => { t.inputEl.type = 'date'; t.setValue(this.date).onChange((v) => (this.date = v)); });
		new Setting(this.contentEl)
			.addButton((b) => b.setButtonText('Cancel').onClick(() => this.close()))
			.addButton((b) => b.setButtonText(this.action).setCta().onClick(() => {
				if (!this.date) return void new Notice('Pick a date.');
				this.close();
				this.onSubmit(this.date);
			}));
	}

	onClose(): void {
		this.contentEl.empty();
	}
}

// Popup with editable text and a copy button.
export class TextModal extends Modal {
	constructor(app: App, private title: string, private text: string) {
		super(app);
	}

	onOpen(): void {
		this.titleEl.setText(this.title);
		const box = this.contentEl.createEl('textarea', { cls: 'apm-textbox' });
		box.value = this.text;
		box.rows = 18;
		new Setting(this.contentEl)
			.addButton((b) => b.setButtonText('Close').onClick(() => this.close()))
			.addButton((b) => b.setButtonText('Copy').setCta().onClick(async () => {
				await navigator.clipboard.writeText(box.value);
				new Notice('Copied.');
			}));
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
