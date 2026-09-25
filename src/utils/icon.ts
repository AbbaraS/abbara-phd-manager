import { MenuItem, setIcon } from 'obsidian';

// True when the text contains an emoji rather than a Lucide icon name.
export const isEmoji = (text: string) => /\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(text);

// Shows a Lucide icon or an emoji in `el`.
export function setIconOrEmoji(el: HTMLElement, icon: string): void {
	const value = icon.trim();
	el.empty();
	el.toggleClass('apm-emoji', isEmoji(value));
	if (isEmoji(value)) el.setText(value);
	else setIcon(el, value);
}

// MenuItem keeps its icon element private; this is the only place we reach it.
type MenuItemWithIcon = MenuItem & { iconEl?: HTMLElement };

// Sets a menu item's title and icon, where the icon may be an emoji.
export function titleAndIcon(item: MenuItem, title: string, icon: string): MenuItem {
	if (!isEmoji(icon)) return item.setTitle(title).setIcon(icon);
	const iconEl = (item as MenuItemWithIcon).iconEl;
	if (!iconEl) return item.setTitle(`${icon.trim()} ${title}`); // fallback: emoji in the title
	setIconOrEmoji(iconEl, icon);
	return item.setTitle(title);
}
