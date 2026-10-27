import { buildBadgeIndex } from '../../models/badgeIndex';
import { progressRows } from '../../progress/progressRows';
import { renderProgress } from '../../progress/renderProgress';
import type { DashboardContext } from '../DashboardContext';
import type { Section } from '../sections';
import { periodsSection } from './periodsSection';
import { tasksSection } from './tasksSection';
import { timesheetSection } from './timesheetSection';

// Draws one section into its body.
export function drawSection(el: HTMLElement, ctx: DashboardContext, section: Section): void {
	const { plugin, settings } = ctx;
	if (section.id === 'tasks') return tasksSection(el, ctx);
	if (section.id === 'progress') {
		const counts = plugin.tasks.progress(buildBadgeIndex(settings.roles));
		return renderProgress(el, progressRows(settings.roles, counts, []));
	}
	const config = settings.timeRoles.find((t) => `time:${t.roleId}` === section.id);
	if (config?.kind === 'periods') periodsSection(el, ctx, config);
	else if (config) timesheetSection(el, ctx, config);
}
