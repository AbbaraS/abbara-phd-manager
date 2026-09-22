// Colour helpers for turning a role colour into project shades.

type Hsl = { h: number; s: number; l: number };

// "#abc" or "#aabbcc" -> [r, g, b] (0-255).
export function hexToRgb(hex: string): [number, number, number] {
	let clean = hex.replace('#', '').trim();
	if (clean.length === 3) clean = clean.split('').map((c) => c + c).join('');
	const num = parseInt(clean, 16) || 0;
	return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

// [r, g, b] -> "#rrggbb".
export function rgbToHex(r: number, g: number, b: number): string {
	return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
}

// Hex -> HSL (h 0-360, s and l 0-100).
export function hexToHsl(hex: string): Hsl {
	const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
	const max = Math.max(r, g, b), min = Math.min(r, g, b);
	const l = (max + min) / 2;
	const d = max - min;
	if (d === 0) return { h: 0, s: 0, l: l * 100 };
	const s = d / (1 - Math.abs(2 * l - 1));
	let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
	h = (h * 60 + 360) % 360;
	return { h, s: s * 100, l: l * 100 };
}

// HSL -> hex.
export function hslToHex({ h, s, l }: Hsl): string {
	const sat = s / 100, light = l / 100;
	const c = (1 - Math.abs(2 * light - 1)) * sat;
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = light - c / 2;
	const [r, g, b] =
		h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] :
		h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
	return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

// Shade number `index` of `count`: lighter for dark colours, darker for light ones.
export function shadeOf(base: string, index: number, count: number): string {
	const hsl = hexToHsl(base);
	const target = hsl.l < 55 ? 85 : 20;
	const step = (target - hsl.l) / (count + 1);
	return hslToHex({ ...hsl, l: hsl.l + step * (index + 1) });
}

// Soft pastel version of `hex`: same hue, gentle saturation, very light.
export function pastel(hex: string): string {
	const { h, s } = hexToHsl(hex);
	return hslToHex({ h, s: Math.min(s, 70), l: 82 });
}

// Pastel number `index` of `count`, spread round the colour wheel from `base`'s hue.
export function pastelOf(base: string, index: number, count: number): string {
	const { h } = hexToHsl(base);
	return hslToHex({ h: (h + ((index + 1) * 360) / (count + 1)) % 360, s: 65, l: 82 });
}
