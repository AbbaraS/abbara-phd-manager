import { MarkdownRenderChild, TFile } from 'obsidian';
import type ProjectManagerPlugin from '../main';
import { renderToday } from './renderToday';
import { todaySpec } from './todaySpec';

// Code block name: ```apm-today``` in a daily note (e.g. the daily template).
export const TODAY_BLOCK = 'apm-today';

const REDRAW_MS = 30 * 60 * 1000; // so "Today" becomes the date after midnight

// A two-line glance at this note's tasks: done / added / open, overall and per role.
// Steps aside (draws nothing) while the panel is pinned above this note.
export class TodayBlock extends MarkdownRenderChild {
	constructor(el: HTMLElement, private plugin: ProjectManagerPlugin, private sourcePath: string) {
		super(el);
	}

	onload(): void {
		this.render();
		this.registerEvent(this.plugin.tasks.on('updated', () => this.render()));
		this.registerEvent(this.plugin.filter.on('changed', () => this.render()));
		this.registerEvent(this.plugin.pinnedToday.on('changed', () => this.render()));
		this.registerInterval(window.setInterval(() => this.render(), REDRAW_MS));
	}

	// Count this note's tasks and redraw.
	private render(): void {
		const file = this.plugin.app.vault.getAbstractFileByPath(this.sourcePath);
		const pinnedAbove = this.plugin.pinnedToday.showsOn(file instanceof TFile ? file : null);
		this.containerEl.empty();
		this.containerEl.toggleClass('apm-today-block-pinned', pinnedAbove);
		if (!pinnedAbove) renderToday(this.containerEl, todaySpec(this.plugin, this.sourcePath));
	}
}
