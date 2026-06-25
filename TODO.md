# TODO — Improvements & Ideas

A living list of improvements for the **Book Text Formatter** VS Code extension.

---

## 🔴 High Priority

- [x] **Preserve paragraph breaks** — Blank lines in the original text are now treated as paragraph separators. Each paragraph is cleaned and wrapped independently.
- [x] **Fix trailing blank line with double-spacing** — Resolved by the paragraph-aware refactor: `Array.join()` only places the separator between elements, never after the last one.
- [x] **Add `repository` field to `package.json`** — Added `"repository": { "type": "git", "url": "https://github.com/mickyhq/book-text-format.git" }`.
- [x] **Update `publisher` field** — Changed from `"your-publisher-name"` to `"mickyhq"`.

---

## 🟡 Medium Priority

- [x] **Add ESLint** — ESLint and `@typescript-eslint` are in `devDependencies`, with a `.eslintrc.json` config.
- [x] **Add LICENSE file** — MIT license file present in repo root.
- [x] **Add `.vscodeignore`** — Excludes `src/`, `node_modules/`, `.git/`, `tsconfig.json`, etc.
- [x] **Add `CHANGELOG.md`** — Tracks version history and changes.
- [x] **Improve type safety in `getConfig`** — Now shows a warning when a setting has an unexpected type before falling back to the default.
- [x] **Remove `declaration: true` from tsconfig** — Not present in tsconfig (no `.d.ts` output).
- [x] **Add stricter TypeScript options** — `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, and `noFallthroughCasesInSwitch` are all enabled.

---

## 🟢 Low Priority / Nice-to-Haves

- [x] **Format on Save** — `bookTextFormatter.formatOnSave` setting with configurable file types.
- [x] **Keyboard shortcut by default** — `Cmd+Shift+T` / `Ctrl+Shift+T` keybinding shipped in `package.json`.
- [x] **Context menu entry** — "Format Text Layout" appears in the editor right-click context menu via `"menus": { "editor/context": [...] }`.
- [x] **First‑line indentation** — `bookTextFormatter.firstLineIndent` setting indents the first line of each paragraph.
- [x] **Justified text alignment** — `bookTextFormatter.justifyText` setting pads lines with spaces for even left/right edges.
- [x] **Progress reporting** — `vscode.window.withProgress` shows a notification for large documents.
- [x] **Extension icon** — 128×128 `icon.png` added and referenced in `package.json`.
- [x] **Unit tests** — Test suite with mocha covering `wordWrap`, `justifyLines`, `cleanParagraph`, and `splitParagraphs`.
- [x] **GitHub Actions CI** — Workflow at `.github/workflows/ci.yml` for lint, compile, and packaging.

---

## ✅ Completed

- [x] Initial commit and push to GitHub
- [x] Branch renamed to `main`
- [x] Preserve paragraph breaks implementation
- [x] Fix trailing blank line with double-spacing
- [x] Add repository field to package.json
- [x] Update publisher field
- [x] Add ESLint
- [x] Add LICENSE file
- [x] Add .vscodeignore
- [x] Add CHANGELOG.md
- [x] Improve type safety in getConfig
- [x] Remove declaration: true from tsconfig
- [x] Add stricter TypeScript options
- [x] Format on Save
- [x] Keyboard shortcut by default
- [x] Context menu entry
- [x] First-line indentation
- [x] Justified text alignment
- [x] Progress reporting
- [x] Extension icon
- [x] Unit tests
- [x] GitHub Actions CI