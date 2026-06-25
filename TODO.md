# TODO — Improvements & Ideas

A living list of improvements for the **Book Text Formatter** VS Code extension.

---

## 🔴 High Priority

- [x] **Preserve paragraph breaks** — The current `Smart Cleanup` collapses *all* line breaks into a single flowing paragraph. Blank lines in the original text should be treated as paragraph separators (e.g., `\n\n` → paragraph break) so multi-paragraph documents aren't flattened into one block.
- [ ] **Fix trailing blank line with double-spacing** — When double-spacing is enabled, joining with `\n\n` appends a blank line after the last line of text, adding unwanted trailing whitespace to the document.
- [ ] **Update `publisher` field** — `package.json` still has `"publisher": "your-publisher-name"`. Replace with a real publisher ID.
- [ ] **Add `repository` field to `package.json`** — Missing repo metadata (e.g., `"repository": { "type": "git", "url": "https://github.com/mickyhq/book-text-format.git" }`).

---

## 🟡 Medium Priority

- [ ] **Add ESLint** — The `lint` npm script references `eslint` but it's not in `devDependencies`. Either add `eslint` + config or remove the script.
- [ ] **Add LICENSE file** — `package.json` declares `"license": "MIT"` but no `LICENSE` file exists in the repo.
- [ ] **Add `.vscodeignore`** — When packaging with `vsce`, all files are included by default. A `.vscodeignore` file should exclude `src/`, `node_modules/`, `.git/`, `tsconfig.json`, etc.
- [ ] **Add `CHANGELOG.md`** — Track version history and changes.
- [ ] **Improve type safety in `getConfig`** — The config helper uses a generic type assertion with no runtime validation. If a user sets `marginWidth` to a string in `settings.json`, it silently falls back to the default with no warning.
- [ ] **Remove `declaration: true` from tsconfig** — VS Code extensions don't ship `.d.ts` files. This adds unnecessary build output.
- [ ] **Add stricter TypeScript options** — Enable `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns` in `tsconfig.json` for better code quality.

---

## 🟢 Low Priority / Nice-to-Haves

- [ ] **Format on Save** — Add a `bookTextFormatter.formatOnSave` setting that auto-formats `.txt` (or configurable file types) on save.
- [ ] **Keyboard shortcut by default** — Ship a default keybinding (e.g., `Cmd+Shift+B` / `Ctrl+Shift+B` already used by build — maybe `Cmd+Shift+T`?) so users don't have to bind it manually.
- [ ] **Context menu entry** — Add "Format Text Layout" to the editor right‑click context menu via `"menus": { "editor/context": [...] }` in `package.json`.
- [ ] **First‑line indentation** — Add a setting to indent the first line of each paragraph by a configurable number of spaces.
- [ ] **Justified text alignment** — Option to pad lines with spaces so both left and right edges align at the margin.
- [ ] **Progress reporting** — For very large documents, show a progress bar (`vscode.window.withProgress`) so the UI doesn't appear frozen.
- [ ] **Extension icon** — Add an `icon.png` (128×128) and reference it in `package.json` for the Extensions view.
- [ ] **Unit tests** — Add a test suite (e.g., mocha + `@vscode/test-electron`) covering the `wordWrap` function, cleanup logic, and edge cases.
- [ ] **GitHub Actions CI** — Add a workflow to lint, compile, and package on push/PR.

---

## ✅ Completed

- [x] Initial commit and push to GitHub
- [x] Branch renamed to `main`