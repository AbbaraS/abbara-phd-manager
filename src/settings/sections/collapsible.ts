import type { SectionContext } from '../SettingsTab';

// A <details> block that remembers whether it was open across redraws.
// `key` must be unique on the page, e.g. "role:phd" or "project:phd/tts-3d".
export function collapsible(el: HTMLElement, key: string, cls: string, ctx: SectionContext): { details: HTMLDetailsElement; summary: HTMLElement } {
	const details = el.createEl('details', { cls: `apm-section ${cls}` });
	details.open = ctx.openSections.has(key);
	details.addEventListener('toggle', () => {
		if (details.open) ctx.openSections.add(key);
		else ctx.openSections.delete(key);
	});
	const summary = details.createEl('summary', { cls: 'apm-section-summary' });
	return { details, summary };
}
