import { Project, Role, TaskType } from './types';
import { slugify, uniqueId } from '../utils/ids';

// Any object read from the file, before it is checked.
type Raw = Record<string, unknown>;

// Parse the roles file into valid roles, filling in anything left out.
// Throws a readable error (e.g. "roles[1].color should be a hex colour") if the shape is wrong.
export function parseRoles(text: string): Role[] {
	const data = JSON.parse(text) as unknown;
	const list = Array.isArray(data) ? data : asObject(data, 'file').roles;
	return withIds(listOf(list, 'roles').map((r, i) => toRole(r, `roles[${i}]`)));
}

// Turn roles into tidy file text, leaving out empty optional fields.
export function stringifyRoles(roles: Role[]): string {
	const tidy = roles.map((r) => ({
		id: r.id,
		name: r.name,
		icon: r.icon,
		color: r.color,
		projects: r.projects.map(tidyProject),
		types: r.types.map(tidyType),
	}));
	return JSON.stringify({ roles: tidy }, null, '\t') + '\n';
}

// Project without empty colour / types.
const tidyProject = (p: Project) => ({
	id: p.id,
	name: p.name,
	...(p.color ? { color: p.color } : {}),
	...(p.types.length ? { types: p.types.map(tidyType) } : {}),
});

// Task type without an empty colour.
const tidyType = (t: TaskType) => ({ id: t.id, name: t.name, icon: t.icon, ...(t.color ? { color: t.color } : {}) });

// One role; only `name` (or `id`) is required.
function toRole(raw: unknown, at: string): Role {
	const o = asObject(raw, at);
	return {
		...named(o, at),
		icon: text(o, 'icon', at) || 'circle',
		color: colour(o, at) || '#888888',
		projects: withIds(listOf(o.projects, `${at}.projects`).map((p, i) => toProject(p, `${at}.projects[${i}]`))),
		types: toTypes(o.types, `${at}.types`),
	};
}

// One project; colour and types are optional.
function toProject(raw: unknown, at: string): Project {
	const o = asObject(raw, at);
	return { ...named(o, at), color: colour(o, at), types: toTypes(o.types, `${at}.types`) };
}

// A list of task types.
function toTypes(raw: unknown, at: string): TaskType[] {
	return withIds(listOf(raw, at).map((t, i) => {
		const here = `${at}[${i}]`;
		const o = asObject(t, here);
		return { ...named(o, here), icon: text(o, 'icon', here) || 'circle', color: colour(o, here) };
	}));
}

// id + name, each falling back to the other.
function named(o: Raw, at: string): { id: string; name: string } {
	const id = text(o, 'id', at);
	const name = text(o, 'name', at) || id;
	if (!name) throw new Error(`${at} needs a "name"`);
	return { id, name };
}

// Give each item a unique id among its siblings, made from the name if missing.
function withIds<T extends { id: string; name: string }>(items: T[]): T[] {
	const taken: string[] = [];
	for (const item of items) {
		item.id = uniqueId(slugify(item.id || item.name), taken);
		taken.push(item.id);
	}
	return items;
}

// Optional hex colour field.
function colour(o: Raw, at: string): string {
	const value = text(o, 'color', at);
	if (value && !/^#[0-9a-f]{6}$/i.test(value)) throw new Error(`${at}.color should be a hex colour like "#C62525"`);
	return value;
}

// Optional text field ('' when missing).
function text(o: Raw, key: string, at: string): string {
	const value = o[key];
	if (value === undefined || value === null) return '';
	if (typeof value !== 'string') throw new Error(`${at}.${key} should be text in "quotes"`);
	return value.trim();
}

// Optional list field ([] when missing).
function listOf(value: unknown, at: string): unknown[] {
	if (value === undefined || value === null) return [];
	if (!Array.isArray(value)) throw new Error(`${at} should be a list [ ... ]`);
	return value;
}

// Required object.
function asObject(value: unknown, at: string): Raw {
	if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${at} should be an object { ... }`);
	return value as Raw;
}
