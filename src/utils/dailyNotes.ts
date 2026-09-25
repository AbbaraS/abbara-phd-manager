import { App, TFile, moment, normalizePath } from 'obsidian';

// Daily Notes core plugin settings we care about.
interface DailyNoteOptions {
	folder?: string;
	format?: string;
}

// Read the Daily Notes core plugin settings (not in the public API types).
function dailyNoteOptions(app: App): DailyNoteOptions {
	const internal = (app as unknown as {
		internalPlugins?: { getPluginById(id: string): { instance?: { options?: DailyNoteOptions } } | null };
	}).internalPlugins;
	return internal?.getPluginById('daily-notes')?.instance?.options ?? {};
}

// The day a daily note is for ("YYYY-MM-DD"), or null if `file` is not a daily note.
export function dailyNoteDate(app: App, file: TFile | null): string | null {
	if (!file || file.extension !== 'md') return null;
	const { folder = '', format = 'YYYY-MM-DD' } = dailyNoteOptions(app);

	// Path relative to the daily notes folder, without ".md".
	const root = normalizePath(folder || '/').replace(/^\/$/, '');
	const path = file.path.replace(/\.md$/, '');
	if (root && !path.startsWith(root + '/')) return null;
	const relative = root ? path.slice(root.length + 1) : path;

	// Strict parse so "notes about dates" do not count.
	const date = moment(relative, format, true);
	return date.isValid() ? date.format('YYYY-MM-DD') : null;
}

// True if `file` sits where a daily note would, with a name matching the date format.
export const isDailyNote = (app: App, file: TFile | null) => dailyNoteDate(app, file) !== null;
