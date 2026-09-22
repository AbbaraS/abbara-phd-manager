// Turn a display name into a safe id, e.g. "TTS 3D" -> "tts-3d".
export function slugify(text: string): string {
	return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// Make `id` unique among `taken` by adding -2, -3, ...
export function uniqueId(id: string, taken: string[]): string {
	let candidate = id || 'item';
	for (let n = 2; taken.includes(candidate); n++) candidate = `${id}-${n}`;
	return candidate;
}
