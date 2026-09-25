import type { Plugin } from 'obsidian';
import { DoneBadgeLook } from '../models/types';

// Body classes that grey out and/or strike badges on ticked tasks (rules in styles.css).
const GREY = 'apm-done-grey';
const STRIKE = 'apm-done-strike';
const CLASSES: Record<DoneBadgeLook, string[]> = {
	'grey-strike': [GREY, STRIKE],
	grey: [GREY],
	strike: [STRIKE],
	none: [],
};

// Every open window's <body>: the main one plus pop-outs.
const bodies = (extra: Document[]) => [document.body, ...extra.map((doc) => doc.body)];

// Keeps the done-badge classes on every window, following the current setting.
export class DoneBadgeLookManager {
	private popouts: Document[] = [];

	constructor(private plugin: Plugin, private look: () => DoneBadgeLook) {}

	// Apply now and to pop-out windows opened later.
	register(): void {
		this.apply();
		this.plugin.registerEvent(this.plugin.app.workspace.on('window-open', (win) => {
			this.popouts.push(win.doc);
			this.apply();
		}));
	}

	// Swap the classes to match the setting.
	apply(): void {
		bodies(this.popouts).forEach((body) => {
			body.removeClasses([GREY, STRIKE]);
			body.addClasses(CLASSES[this.look()]);
		});
	}

	// Remove every class (plugin unload).
	clear(): void {
		bodies(this.popouts).forEach((body) => body.removeClasses([GREY, STRIKE]));
	}
}
