import { Plugin } from 'obsidian';

// Listen on the main window and on any pop-out window opened later (capture phase,
// so we run before the editor and other plugins).
export function onEveryDocument<K extends keyof DocumentEventMap>(
	plugin: Plugin, type: K, handler: (evt: DocumentEventMap[K]) => void,
): void {
	plugin.registerDomEvent(document, type, handler, { capture: true });
	plugin.registerEvent(plugin.app.workspace.on('window-open', (win) =>
		plugin.registerDomEvent(win.doc, type, handler, { capture: true }),
	));
}
