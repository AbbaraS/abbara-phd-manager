import { Events, MarkdownView, TFile } from 'obsidian';
import type ProjectManagerPlugin from '../main';
import { isManagedNote } from '../utils/dailyNotes';
import { renderToday } from './renderToday';
import { todaySpec } from './todaySpec';

// Class of the pinned panel, which sits between the toolbar and the note.
export const PINNED_CLASS = 'apm-today-pinned';

const REDRAW_MS = 30 * 60 * 1000; // so "Today" becomes the date after midnight
const HAS_BLOCK = /^```apm-today\s*$/m;

// "Pin to top": the Today panel moves out of the note to above it, so it never scrolls away.
// Fires "changed" when pinned or unpinned, so in-note blocks can hide or come back.
export class PinnedToday extends Events {
	constructor(private plugin: ProjectManagerPlugin) {
		super();
	}

	// Redraw on note switches, task edits and filter changes; add the command.
	register(): void {
		const { plugin } = this;
		const { workspace } = plugin.app;
		plugin.registerEvent(workspace.on('file-open', () => this.refresh()));
		plugin.registerEvent(workspace.on('layout-change', () => this.refresh()));
		plugin.registerEvent(plugin.tasks.on('updated', () => this.refresh()));
		plugin.registerEvent(plugin.filter.on('changed', () => this.refresh()));
		plugin.registerInterval(window.setInterval(() => this.refresh(), REDRAW_MS));
		workspace.onLayoutReady(() => this.refresh());
		plugin.addCommand({ id: 'toggle-pin-today', name: 'Pin / unpin the Today panel', callback: () => this.toggle() });
	}

	get pinned(): boolean {
		return this.plugin.settings.pinToday;
	}

	// Pin button: move the panel above the note, or back into it. Remembered across restarts.
	toggle(): void {
		this.plugin.settings.pinToday = !this.pinned;
		void this.plugin.saveOptions();
		this.refresh();
		this.trigger('changed');
	}

	// True if the pinned panel is shown for `file` (so its in-note block steps aside).
	showsOn(file: TFile | null): boolean {
		return this.pinned && isManagedNote(this.plugin.app, file, this.plugin.settings.dailyNotesOnly);
	}

	// Redraw the pinned panel on every open markdown note.
	refresh(): void {
		this.plugin.app.workspace.getLeavesOfType('markdown').forEach((leaf) => {
			if (leaf.view instanceof MarkdownView) this.update(leaf.view);
		});
	}

	// Remove every pinned panel (plugin unload).
	removeAll(): void {
		document.querySelectorAll(`.${PINNED_CLASS}`).forEach((el) => el.remove());
	}

	// Replace this view's pinned panel. Only notes that have an apm-today block get one.
	private update(view: MarkdownView): void {
		view.containerEl.querySelector(`:scope > .${PINNED_CLASS}`)?.remove();
		const file = view.file;
		if (!file || !this.showsOn(file) || !HAS_BLOCK.test(view.getViewData())) return;

		const el = createDiv({ cls: PINNED_CLASS });
		renderToday(el, todaySpec(this.plugin, file.path));
		view.containerEl.insertBefore(el, view.contentEl);
	}
}
