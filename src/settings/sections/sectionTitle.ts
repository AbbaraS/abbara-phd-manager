import type { BadgeLook } from '../../integrations/customBadges';
import { setIconOrEmoji } from '../../utils/icon';
import type { SectionContext } from '../SettingsTab';

// What a summary line shows: the badge as it looks in a note, and a plain name as fallback.
export interface TitleLook extends BadgeLook {
	name: string; // shown with the icon when Custom Badges isn't available
}

// Adds a title to a summary line; call the returned function to redraw it after an edit.
export function sectionTitle(summary: HTMLElement, iconCls: string, ctx: SectionContext): (look: TitleLook) => void {
	const box = summary.createSpan({ cls: 'apm-section-title' });
	return (look) => {
		box.empty();
		const badge = ctx.renderBadge(look);
		if (badge) {
			box.append(badge);
			return;
		}
		setIconOrEmoji(box.createSpan({ cls: iconCls }), look.icon);
		box.createSpan({ cls: 'apm-section-name', text: look.name });
	};
}
