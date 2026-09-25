import { Setting, setIcon } from 'obsidian';
import { isEmoji } from '../../utils/icon';

// Shows the Lucide icon for `name` in `el`; empty for emoji (the text box shows those) or unknown names.
function renderPreview(el: HTMLElement, name: string): void {
	const value = name.trim();
	el.empty();
	if (!value || isEmoji(value)) return;
	setIcon(el, value);
	el.toggleClass('is-unknown', !el.querySelector('svg'));
	el.setAttr('aria-label', el.querySelector('svg') ? value : `No Lucide icon called "${value}"`);
}

// "Icon" setting: text box for a Lucide name or emoji, with the Lucide icon drawn beside it.
export function iconField(el: HTMLElement, desc: string, value: string, placeholder: string, onChange: (icon: string) => void): Setting {
	const setting = new Setting(el).setName('Icon').setDesc(desc);
	const preview = setting.controlEl.createSpan({ cls: 'apm-icon-preview' });
	renderPreview(preview, value || placeholder);
	setting.addText((t) => t.setPlaceholder(placeholder).setValue(value).onChange((v) => {
		renderPreview(preview, v || placeholder);
		onChange(v.trim());
	}));
	return setting;
}
