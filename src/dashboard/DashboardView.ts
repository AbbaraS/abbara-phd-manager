import { ItemView, setIcon, type WorkspaceLeaf } from 'obsidian';
import type ProjectManagerPlugin from '../main';
import { todayIso } from '../utils/dates';
import type { DashboardContext } from './DashboardContext';
import { columnDrop, sectionBox } from './sectionBox';
import { dashboardSections, orderedSections } from './sections';
import { drawSection } from './sections/drawSection';

export const DASHBOARD_VIEW = 'apm-dashboard';

// The dashboard tab: tasks by role and project, hours for the time-tracked roles, and the project summary cards.
export class DashboardView extends ItemView {
	private filterRoles = new Set<string>();
	private form: DashboardContext['form'] = { roleId: '', projectId: '', typeId: '', text: '', priority: '', due: '', date: todayIso() };

	constructor(leaf: WorkspaceLeaf, private plugin: ProjectManagerPlugin) {
		super(leaf);
	}

	getViewType() { return DASHBOARD_VIEW; }
	getDisplayText() { return 'PhD Manager'; }
	getIcon() { return 'layout-dashboard'; }

	async onOpen() {
		this.registerEvent(this.plugin.tasks.on('updated', () => this.render()));
		this.render();
	}

	// Redraws every section, keeping the scroll position. Waits while something is being typed in the new-task form.
	render() {
		const el = this.contentEl;
		if (el.querySelector('.apm-newtask :focus')) return;
		const scroll = el.scrollTop;
		el.empty();
		el.addClass('apm-view');

		const s = this.plugin.settings;
		const all = dashboardSections(s.timeRoles, s.roles);
		const ctx: DashboardContext = {
			plugin: this.plugin, settings: s, sections: all, columns: {}, filterRoles: this.filterRoles, form: this.form,
			redraw: () => this.render(),
			saveLayout: () => void this.plugin.saveOptions().then(() => this.plugin.refreshDashboards()),
		};

		const title = el.createEl('h1', { cls: 'apm-view-title' });
		setIcon(title.createSpan({ cls: 'apm-view-title-icon' }), 'layout-dashboard');
		title.createSpan({ text: 'PhD Manager' });

		const shown = orderedSections(s.dashOrder, all).filter((x) => !s.dashHidden.includes(x.id));
		if (!shown.length) el.createDiv({ cls: 'apm-muted', text: 'All sections are hidden. Turn them on in settings.' });

		// Full-width sections one under another; each run of half-width ones in two columns, each section in the
		// column you put it in (saved; new ones take turns). `order` keeps page order when narrow (one column).
		const list = el.createDiv({ cls: 'apm-bands' });
		let cols: HTMLElement[] = [];
		let band: string[] = []; // ids in the current run of half-width sections
		shown.forEach((x, i) => {
			const half = s.dashHalf.includes(x.id);
			if (!half) cols = [];
			else if (cols.length === 0) {
				const row = list.createDiv({ cls: 'apm-band' });
				band = [];
				cols = [row.createDiv({ cls: 'apm-band-col' }), row.createDiv({ cls: 'apm-band-col' })];
				columnDrop(cols[0], 'left', band, ctx);
				columnDrop(cols[1], 'right', band, ctx);
			}
			if (half) {
				ctx.columns[x.id] = s.dashColumns[x.id] ?? (band.length % 2 ? 'right' : 'left');
				band.push(x.id);
			}
			const parent = half ? cols[ctx.columns[x.id] === 'right' ? 1 : 0] : list;
			const body = sectionBox(parent, x, ctx);
			(parent.lastElementChild as HTMLElement | null)?.setCssProps({ order: String(i) });
			if (body) drawSection(body, ctx, x);
		});
		el.scrollTop = scroll;
	}
}
