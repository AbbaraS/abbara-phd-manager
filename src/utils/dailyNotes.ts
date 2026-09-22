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

// True if `file` sits where a daily note would, with a name matching the date format.
export function isDailyNote(app: App, file: TFile | null): boolean {
	if (!file || file.extension !== 'md') return false;
	const { folder = '', format = 'YYYY-MM-DD' } = dailyNoteOptions(app);

	// Path relative to the daily notes folder, without ".md".
	const root = normalizePath(folder || '/').replace(/^\/$/, '');
	const path = file.path.replace(/\.md$/, '');
	if (root && !path.startsWith(root + '/')) return false;
	const relative = root ? path.slice(root.length + 1) : path;

	// Strict parse so "notes about dates" do not count.
	return moment(relative, format, true).isValid();
}
