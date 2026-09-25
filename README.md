# Abbara PhD Manager

Roles → Projects → Tasks for Obsidian, visualised with [Custom Badges](../custom-badges).

- **Roles** have a theme colour and a badge icon.
- **Projects** get an auto shade of their role colour (or your own colour).
- **Task types** are set per role, and a project can override them with its own.
- A **toolbar** on daily notes shows one button per role → pick a project → pick a type → a task line is added:

```md
- [ ] `[!!phd-tts-3d]` `[!!phd-t-code]` 
```

Press **Enter** at the end of a task to start the next one with the same badges, so you can add
several tasks for one project in a row. Enter on a task with no text yet clears it and ends the list.
(Turn off with *Keep badges on Enter* in settings.)

Every role, project and type is pushed into Custom Badges as a badge, so the line above renders as coloured badges.

## Task order

Task lists are ordered by **role → project → due date → created date**:

- Role and project follow their order in settings (role-only tasks come before that role's projects).
- Due date is the Tasks plugin's `📅 YYYY-MM-DD`; soonest first, tasks without one after.
- Created date is `➕ YYYY-MM-DD` if the line has one, else the first daily note the task appears in (matched by its `id` badge). Oldest first.
- Ties keep their current order. Subtasks move with their parent. Tasks with no role badge go last. Code blocks are never touched.

It runs automatically when a new daily note is created (after Rollover adds yesterday's tasks; turn off with
*Sort new daily notes*), and any time with the sort button at the right of the toolbar or the
**Sort tasks in this note** command (one undo step). Reorder roles and projects in settings with the ↑ ↓ buttons.

## Editing tasks

- **New project…** at the bottom of a role's toolbar menu opens a popup (name, icon, deadline, colour, own types/statuses), saves the project, then carries on to the type menu.
- Click a role/project badge on a task (or right-click → *Set project*) to move it to another project of that role. Its type and status carry over when the new project has one with the same id.
- Click a type or status badge (or right-click → *Set task type / status*) to change it.

## Daily note view

Add both blocks to your daily template, above the task list:

````md
```apm-progress
```

```apm-today
```
````

- **Today panel** (`apm-today`): two lines. Line 1 = tasks done / on today's list, tasks added today, tasks still open, and a progress bar. Line 2 = one chip per role with its own done/total, `+n` added today and a thin bar. Hover a chip for the full numbers.
  - *Added today* = the task's `➕` date, else the first daily note it appears in, is this note's day. Rolled-over tasks don't count as added.
  - Cancelled tasks (`[-]`) are left out of every count.
- **Hide completed**: the eye button (toolbar, or next to *done* in the Today panel) hides ticked and cancelled tasks, with their subtasks. It's remembered across restarts. Command: *Hide / show completed tasks*.
- **Filter by role**: click a role chip in the Today panel or a role divider to show only that role (click again for all). The filter button in the toolbar lets you tick several roles. The filter resets when Obsidian restarts. Command: *Show tasks from all roles*.
- The line you're typing on always stays visible, so a new task never vanishes while you write it.
- **Role dividers**: a role label with done/total is drawn above each role's group of tasks. It's not saved in the note, so Rollover and sorting keep working. Only lists with two or more roles get dividers.
- **Add new tasks in order**: a task added from the toolbar goes straight to the end of its role → project group (in the list the cursor is in, else the biggest task list), not at the cursor. Turn off in settings to insert at the cursor again.
- **Badges on completed tasks**: grey + strikethrough by default (settings: grey, strikethrough, both or unchanged).

Hiding and dividers work in live preview and source mode. Reading view only hides completed tasks.

## Folder structure

```
src/
  main.ts                          plugin entry: loads settings, wires everything
  models/
    types.ts                       Role, Project, TaskType, ManagerSettings
    rolesJson.ts                   read/write the roles file (checks + fills gaps)
    resolve.ts                     derived values: project shade, types, badge keys
  defaults/
    roles-projects-themes.ts       starting roles for a fresh install / "Reset to defaults"
  settings/
    defaults.ts                    default plugin settings
    SettingsTab.ts                 settings page shell
    sections/
      roleSection.ts               one role block
      projectSection.ts            one project row
      typeList.ts                  editable list of task types
      rolesFileInfo.ts             "Edit as code" note + file errors
  storage/
    RolesFile.ts                   keeps roles-projects-themes.json and settings in sync
  integrations/
    customBadges.ts                sync badges into the Custom Badges plugin
  toolbar/
    ToolbarManager.ts              adds/removes the toolbar on notes
    renderToolbar.ts               builds the role buttons + sort button
    pickTask.ts                    project → type menus
    NewProjectModal.ts             "New project…" popup
  editor/
    carryOnEnter.ts                Enter on a badge task → new task with the same badges
  filter/
    TaskFilter.ts                  hide-completed + role filter state, commands
    taskListField.ts               editor extension: hides lines, draws dividers
    planTaskList.ts                which lines to hide, where dividers go (pure)
    DividerWidget.ts               the role label drawn above a group
    filterMenu.ts                  toolbar filter menu
  today/
    TodayBlock.ts                  ```apm-today``` block
    countToday.ts                  done / added / open counts (pure)
    renderToday.ts                 draws the two-line panel
  display/
    doneBadgeLook.ts               grey / struck badges on ticked tasks (body classes)
  tasks/
    taskLine.ts                    builds the "- [ ] badges" line
    nextTaskLine.ts                works out that next line (pure)
    insertTask.ts                  puts the line in the editor
    orderedSpot.ts                 where a new task goes to keep groups together (pure)
  sort/
    TaskSorter.ts                  command + auto-sort of new daily notes
    sortLines.ts                   reorders list blocks (pure)
    listBlocks.ts                  finds lists and their items (pure)
    sortKey.ts                     role → project → due → created comparison
    firstSeen.ts                   day each task was first written down
  utils/
    colour.ts                      hex/HSL helpers and shade generator
    dailyNotes.ts                  "is this a daily note?"
    ids.ts                         slugs and unique ids
    editorView.ts                  reaches the CodeMirror view behind Obsidian's Editor
styles.css                         toolbar + settings styles
```

## Edit roles as code

Your roles live in `roles-projects-themes.json` in the plugin folder
(`.obsidian/plugins/abbara-phd-manager/`). The settings page and the file stay in sync:

- Change something in settings → the file is rewritten.
- Save the file in any editor → settings, toolbar and badges update within ~2 seconds.
- If the file has a mistake, it is not loaded; settings shows the error and won't overwrite the file until it's fixed.

Only `name` is required; everything else is filled in (`id` from the name, icon `circle`, auto colours):

```json
{
	"roles": [
		{
			"id": "phd", "name": "PhD", "icon": "book-heart", "color": "#C62525",
			"projects": [
				{ "id": "tts-3d", "name": "TTS 3D" },
				{ "name": "January Report", "color": "#8B0000" }
			],
			"types": [
				{ "id": "code", "name": "Code", "icon": "code" },
				{ "id": "bug", "name": "Bug", "icon": "bug", "color": "#f44336" }
			]
		}
	]
}
```

A project gets its own task types by adding a `types` list; leave it out to use the role's.
`data.json` now only holds plugin options (daily notes only, badge sync).

## Badge keys

| Thing        | Key pattern                    | Example              |
| ------------ | ------------------------------ | -------------------- |
| Role         | `role`                         | `phd`                |
| Project      | `role-project`                 | `phd-tts-3d`         |
| Role type    | `role-t-type`                  | `phd-t-code`         |
| Project type | `role-project-t-type`          | `phd-tts-3d-t-code`  |

The plugin only removes badges it created itself (tracked in `managedBadgeKeys`); your other badges are left alone. If a role key matches one of your existing badges (e.g. `reslife`), the plugin takes it over.

## Develop

```bash
npm install
npm run dev     # watch + rebuild main.js
npm run build   # type-check + production build
```

Test vault: `myPluginTestVault/.obsidian/plugins/abbara-phd-manager` is a symlink to this folder.

## Ideas for later

- "New task" command + hotkey (same flow as the toolbar, via a modal)
- Dashboard view: open tasks grouped by role/project
- Collapse a role group by clicking its divider chevron
- Role filter in reading view
- Due dates, priorities, status
- Confirm before "Reset to defaults"
