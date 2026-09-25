// Move list[from] by `delta` places, in place. Returns false if it would leave the list.
export function moveItem<T>(list: T[], from: number, delta: number): boolean {
	const to = from + delta;
	if (from < 0 || to < 0 || to >= list.length) return false;
	const [item] = list.splice(from, 1);
	list.splice(to, 0, item);
	return true;
}
