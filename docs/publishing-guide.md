# Publishing guide

How to put **Abbara PhD Manager** on GitHub, make releases, and submit it to the Obsidian community plugin list.

Run every command in **Terminal on your Mac**, inside the plugin folder:

```bash
cd ~/source/obsidian-plugins/abbara-phd-manager
```

---

## Part 1 — First push to GitHub (one time)

The local repo is already set up: branch `main`, first commit done.

### Step 1. Create an empty repo on GitHub

1. Go to <https://github.com/new>.
2. **Repository name:** `abbara-phd-manager`
3. **Visibility:** Public (needed for community plugins).
4. Leave **README**, **.gitignore** and **licence** unticked. The repo must be empty.
5. Click **Create repository**.

### Step 2. Connect and push

```bash
git remote add origin https://github.com/AbbaraS/abbara-phd-manager.git
git push -u origin main
```

Check: refresh the GitHub page. You should see `src/`, `README.md`, `LICENSE`, `manifest.json`.

---

## Part 2 — Make a release

A release is what Obsidian downloads. It needs 3 files attached: `main.js`, `manifest.json`, `styles.css`.

You don't build these by hand. The GitHub Action in `.github/workflows/release.yml` builds and attaches them when you push a **tag**.

### Step 3. Install packages once (on your Mac)

```bash
npm install
npm run build
```

This creates `package-lock.json`. Commit it so builds are repeatable:

```bash
git add package-lock.json
git commit -m "Add lock file"
git push
```

### Step 4. Allow the Action to write releases (one time)

On GitHub: **Settings → Actions → General → Workflow permissions** → pick **Read and write permissions** → **Save**.

### Step 5. Tag and push

The tag must match `"version"` in `manifest.json` **exactly**, with **no `v`** in front.

```bash
git tag -a 0.1.0 -m "0.1.0"
git push origin 0.1.0
```

### Step 6. Check the release

1. On GitHub open the **Actions** tab. Wait for the green tick.
2. Open **Releases**. Release `0.1.0` should list `main.js`, `manifest.json`, `styles.css`.
3. If it failed: click the run, read the red step, fix, then re-tag (see "Redo a tag" below).

---

## Part 3 — Every new version

1. Make your changes and test in `myPluginTestVault`.
2. Bump the version in **two files** (use [semver](https://semver.org): fix `0.1.1`, feature `0.2.0`, breaking `1.0.0`):
   - `manifest.json` → `"version": "0.2.0"`
   - `package.json` → `"version": "0.2.0"`
3. Only if you changed `minAppVersion`: add a line to `versions.json`, e.g. `"0.2.0": "1.4.0"`.
4. Commit, push, tag:

```bash
git add -A
git commit -m "Release 0.2.0"
git push
git tag -a 0.2.0 -m "0.2.0"
git push origin 0.2.0
```

### Redo a tag (if a release failed)

```bash
git tag -d 0.2.0
git push origin :refs/tags/0.2.0
# fix, commit, push, then tag again
git tag -a 0.2.0 -m "0.2.0"
git push origin 0.2.0
```

Also delete the broken release on GitHub if one was created.

---

## Part 4 — Test before submitting (optional): BRAT

[BRAT](https://github.com/TfTHacker/obsidian42-brat) installs plugins straight from a GitHub repo.

1. Install **BRAT** from Community plugins in your main vault.
2. BRAT → **Add beta plugin** → `AbbaraS/abbara-phd-manager`.
3. Use it for a while. Fix what breaks.

---

## Part 5 — Submit to Obsidian community plugins

### Step 7. Checklist before submitting

- [ ] Repo is **public**, with `README.md`, `LICENSE`, `manifest.json` at the root.
- [ ] At least one GitHub release with `main.js`, `manifest.json`, `styles.css` attached.
- [ ] Release tag = `manifest.json` version, no `v`.
- [ ] `manifest.json` on the `main` branch has the latest version (Obsidian reads it from there).
- [ ] `id` is unique, lowercase, and does **not** contain "obsidian".
- [ ] `name` does **not** contain "Obsidian".
- [ ] `description` is short (under 250 characters) and ends with a full stop.
- [ ] `isDesktopOnly` is correct (`false` = works on mobile too — test on your phone first).
- [ ] README explains what it does, how to use it, and has a screenshot or GIF.
- [ ] **Defaults are generic.** `src/defaults/roles-projects-themes.ts` currently has *your* roles (PhD, GTA, ResLife...). Swap them for simple examples (e.g. "Work", "Study", "Personal") before submitting.
- [ ] No leftover debug `console.log`s.

### Step 8. Submit

Obsidian now takes submissions through its community directory website:

1. Sign in at <https://community.obsidian.md> with your Obsidian account.
2. Link your GitHub account (this proves you own the repo).
3. Add your plugin and pick the `AbbaraS/abbara-phd-manager` repo.

### Step 9. Review

1. An automated check runs first. Fix anything it flags, bump the version, make a new release.
2. Then a person from the Obsidian team reviews the code. This can take a few weeks.
3. Once approved, it shows up in **Settings → Community plugins → Browse**.

After that, every new GitHub release reaches users automatically as an update.

---

## Official docs

- [Submit your plugin](https://docs.obsidian.md/Plugins/Releasing/Submit+your+plugin)
- [Release with GitHub Actions](https://docs.obsidian.md/Plugins/Releasing/Release+your+plugin+with+GitHub+Actions)
- [Plugin guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines)
