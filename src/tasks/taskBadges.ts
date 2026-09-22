// Reading and editing the badges on one task line (pure text, no Obsidian).

// Inline badge syntax used by Custom Badges.
export const badge = (key: string) => `\`[!!${key}]\``;

// Plain badges only, e.g. `[!!phd-t-code]` (not `[!!note:text]` or icon|label forms).
const PLAIN_BADGE = /`\[!!([^\]`:|]+)\]`/g;

// A markdown task line: "- [ ] ...", "* [x] ...".
export const isTaskLine = (line: string) => /^\s*[-*+] \[.\] /.test(line);

// Every plain badge key on a line, in order.
export function badgeKeys(line: string): string[] {
	return [...line.matchAll(PLAIN_BADGE)].map((m) => m[1].trim().toLowerCase());
}

// Swap the `oldKey` badge for `newKey` (null = remove it).
// With no `oldKey`, add `newKey` right after the `afterKey` badge.
export function setBadge(line: string, oldKey: string | undefined, newKey: string | null, afterKey: string): string {
	if (oldKey) {
		const at = line.indexOf(badge(oldKey));
		if (at < 0) return line;
		let end = at + badge(oldKey).length;
		if (!newKey && line[end] === ' ') end++; // take one trailing space with a removed badge
		return line.slice(0, at) + (newKey ? badge(newKey) : '') + line.slice(end);
	}
	if (!newKey) return line;

	const at = line.indexOf(badge(afterKey));
	if (at < 0) return line;
	const end = at + badge(afterKey).length;
	return `${line.slice(0, end)} ${badge(newKey)}${line.slice(end)}`;
}
