# Abbara PhD Manager

Roles → Projects → Tasks for Obsidian, visualised with [Custom Badges](../custom-badges).

- **Roles** have a theme colour and a badge icon.
- **Projects** get an auto shade of their role colour (or your own colour).
- **Task types** are set per role, and a project can override them with its own.
- A **toolbar** on daily notes shows one button per role → pick a project → pick a type → a task line is added:

```md
- [ ] `[!!phd-tts-3d]` `[!!phd-t-code]` 
```

Every role, project and type is pushed into Custom Badges as a badge, so the line above renders as coloured badges.

## Folder structure

```
src/
  main.ts                          plugin entry: loads settings, wires everything
  models/
    types.ts                       Role, Project, TaskType, ManagerSettings
    resolve.ts                     derived values: project shade, types, badge keys
  defaults/
    roles-projects-themes.ts       ← your default roles/projects/types (edit me)
  settings/
    defaults.ts                    default plugin settings
    SettingsTab.ts                 settings page shell
    sections/
      roleSection.ts               one role block
      projectSection.ts            one project row
      typeList.ts                  editable list of task types
  integrations/
    customBadges.ts                sync badges into the Custom Badges plugin
  toolbar/
    ToolbarManager.ts              adds/removes the toolbar on notes
    renderToolbar.ts               builds the role buttons
    pickTask.ts                    project → type menus
  tasks/
    taskLine.ts                    builds the "- [ ] badges" line
    insertTask.ts                  puts the line in the editor
  utils/
    colour.ts                      hex/HSL helpers and shade generator
    dailyNotes.ts                  "is this a daily note?"
    ids.ts                         slugs and unique ids
styles.css                         toolbar + settings styles
```

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
