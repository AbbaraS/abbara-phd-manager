import { setIcon } from 'obsidian';

// Eye button for a summary line: shows/hides a role or project in the toolbar.
export function visibilityButton(hidden: boolean, onToggle: () => void): HTMLElement {
	const button = createEl('button', {
		cls: 'clickable-icon apm-visibility',
		attr: { 'aria-label': hidden ? 'Hidden from the toolbar (badges kept). Click to show.' : 'Shown in the toolbar. Click to hide (badges kept).' },
	});
	setIcon(button, hidden ? 'eye-off' : 'eye');
	button.addEventListener('click', (evt) => {
		evt.preventDefault(); // inside a <summary>: don't open/close the section
		onToggle();
	});
	return button;
}
