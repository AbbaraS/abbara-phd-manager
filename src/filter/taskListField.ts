import { EditorState, Extension, Prec, Range, StateEffect, StateField } from '@codemirror/state';
import { Decoration, DecorationSet, EditorView } from '@codemirror/view';
import { TFile, editorInfoField } from 'obsidian';
import { LineTask, planTaskList } from './planTaskList';
import { DividerLook, DividerWidget } from './DividerWidget';

// Everything the editor extension asks the plugin for, read fresh on each redraw.
export interface TaskListContext {
	applies: (file: TFile | null) => boolean;  // is this a note we manage?
	hideDone: boolean;
	roles: ReadonlySet<string>;                // role filter (empty = all)
	dividers: boolean;
	taskOf: (line: string) => LineTask | null;
	lookOf: (role: string) => Omit<DividerLook, 'done' | 'total' | 'active'>;
	onDividerClick: (role: string) => void;
}

// Sent to every editor when the filter, roles or settings change.
export const refreshTaskList = StateEffect.define<null>();

// Hides a line range without a trace (like a fold with no marker).
const HIDE = Decoration.replace({});

// Lines the selection touches (0-based), kept visible so you can type on them.
function selectedLines(state: EditorState): Set<number> {
	const out = new Set<number>();
	for (const range of state.selection.ranges) {
		const last = state.doc.lineAt(range.to).number;
		for (let n = state.doc.lineAt(range.from).number; n <= last; n++) out.add(n - 1);
	}
	return out;
}

// Build the hide + divider decorations for the whole note.
// `keepSelection` = false right after the filter changes, so the line the cursor was
// left on doesn't stay visible; any later edit or cursor move keeps its line.
function build(state: EditorState, ctx: TaskListContext, keepSelection: boolean): DecorationSet {
	const file = state.field(editorInfoField, false)?.file ?? null;
	if (!ctx.applies(file) || (!ctx.hideDone && !ctx.roles.size && !ctx.dividers)) return Decoration.none;

	const { doc } = state;
	const plan = planTaskList(doc.toString().split('\n'), ctx.taskOf, {
		hideDone: ctx.hideDone,
		roles: ctx.roles,
		dividers: ctx.dividers,
		keep: keepSelection ? selectedLines(state) : new Set(),
	});
	const decos: Range<Decoration>[] = [];

	// Hidden lines: replace from the end of the line above, so the line break goes too.
	for (const [first, last] of plan.hidden) {
		const from = first === 0 ? 0 : doc.line(first).to;
		const to = first === 0 && last + 2 <= doc.lines ? doc.line(last + 2).from : doc.line(last + 1).to;
		if (to > from) decos.push(HIDE.range(from, to));
	}

	// Role dividers, as block widgets above their first visible task.
	for (const divider of plan.dividers) {
		const look = { ...ctx.lookOf(divider.role), done: divider.done, total: divider.total, active: ctx.roles.has(divider.role) };
		const widget = Decoration.widget({ widget: new DividerWidget(look, ctx.onDividerClick), block: true, side: -1 });
		decos.push(widget.range(doc.line(divider.line + 1).from));
	}
	return Decoration.set(decos, true);
}

// Editor extension: hides tasks (completed / other roles) and draws role dividers.
// A state field, because hiding whole lines and block widgets can't come from a view plugin.
export function taskListField(context: () => TaskListContext): Extension {
	const field = StateField.define<DecorationSet>({
		create: (state) => build(state, context(), false),
		update(decos, tr) {
			if (tr.effects.some((e) => e.is(refreshTaskList))) return build(tr.state, context(), false);
			if (tr.docChanged || tr.selection) return build(tr.state, context(), true);
			return decos;
		},
		provide: (f) => EditorView.decorations.from(f),
	});
	return Prec.highest(field);
}
