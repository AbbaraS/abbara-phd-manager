// Hover tooltip that works on every Obsidian version this plugin supports:
// Obsidian shows an element's aria-label on hover (setTooltip() needs 1.4.4+).
export function tooltip(el: HTMLElement, text: string): void {
	el.setAttribute('aria-label', text);
}
