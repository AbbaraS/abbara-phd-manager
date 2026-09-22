import { Setting } from 'obsidian';
import { ROLES_FILE_NAME, RolesFile } from '../../storage/RolesFile';

// Explains where roles live as code, and shows any error in that file.
export function renderRolesFileInfo(el: HTMLElement, file: RolesFile): void {
	new Setting(el)
		.setName('Edit as code')
		.setDesc(createFragment((f) => {
			f.appendText('Everything below is also saved in ');
			f.createEl('code', { text: file.path });
			f.appendText('. Edit it in any code editor and this page updates within a few seconds.');
		}));

	if (file.error) {
		el.createDiv({ cls: 'apm-file-error', text: `${ROLES_FILE_NAME} has an error, so it was not loaded: ${file.error}` });
	}
}
