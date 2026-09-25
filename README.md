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
  tasks/
    taskLine.ts                    builds the "- [ ] badges" line
    nextTaskLine.ts                works out that next line (pure)
    insertTask.ts                  puts the line in the editor
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
- Insert under a chosen heading (e.g. `### To-do List:`) instead of at the cursor
- Dashboard view: open tasks grouped by role/project
- Due dates, priorities, status
- Confirm before "Reset to defaults"
