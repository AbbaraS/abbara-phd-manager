import { MarkdownRenderChild } from 'obsidian';
import type ProjectManagerPlugin from '../main';
import { buildBadgeIndex } from '../models/badgeIndex';
import { progressRows } from './progressRows';
import { renderProgress } from './renderProgress';

// Code block name: ```apm-progress``` in a note (e.g. the daily template).
export const PROGRESS_BLOCK = 'apm-progress';

const REDRAW_MS = 30 * 60 * 1000; // so "days left" ticks over after midnight

// A live deadline dashboard that redraws whenever tasks or settings change.
export class ProgressBlock extends MarkdownRenderChild {
	// `filter` = role ids / project keys written inside the block (empty = all).
	constructor(el: HTMLElement, private plugin: ProjectManagerPlugin, private filter: string[]) {
		super(el);
	}

	onload(): void {
		this.render();
		this.registerEvent(this.plugin.tasks.on('updated', () => this.render()));
		this.registerInterval(window.setInterval(() => this.render(), REDRAW_MS));
	}

	// Rebuild the cards from the current settings and task counts.
	private render(): void {
		const roles = this.plugin.settings.roles;
		const counts = this.plugin.tasks.progress(buildBadgeIndex(roles));
		this.containerEl.empty();
		renderProgress(this.containerEl, progressRows(roles, counts, this.filter));
	}
}

// Words inside the block, e.g. "phd" or "phd-tts-3d, gta".
export const parseFilter = (source: string) => source.toLowerCase().split(/[\s,]+/).filter(Boolean);
