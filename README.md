# Book Text Formatter

A VS Code extension that formats text for book layouts — wrapping lines at a configurable margin, cleaning up irregular whitespace, and optionally adding double-spacing between lines.

## Features

- **Right Margin Wrapping** — Wraps text at a specified character width (default: 80) without breaking words.
- **Double Spacing** — Optionally inserts a blank line between every line of text.
- **Smart Cleanup** — Strips irregular line breaks and extra whitespace so the text flows cleanly before formatting.
- **Selection Support** — Format only the selected text, or the entire document if nothing is selected.
- **User Settings** — Customize margin width and double-spacing via VS Code's Settings menu.

## How to Build

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [VS Code](https://code.visualstudio.com/) (v1.85 or later)

### Steps

```bash
# 1. Clone or navigate into the extension folder
cd text-format

# 2. Install dependencies
npm install

# 3. Compile TypeScript to JavaScript
npm run compile
```

The compiled extension output is placed in the `out/` directory.

## How to Run (Extension Development Host)

1. Open the `text-format` folder in VS Code:
   ```bash
   code /Users/micky/dev/text-format
   ```
2. Press **F5** (or go to Run > Start Debugging).
3. A new VS Code window opens with **"Extension Development Host"** in the title bar. This window has the Book Text Formatter extension loaded.

## How to Install in VS Code

### Method 1: Install from `.vsix` file (recommended)

First build the `.vsix` package, then install it directly into VS Code:

```bash
# Build the .vsix (one-time step — already done if you ran vsce package)
npx @vscode/vsce package

# Install into VS Code
code --install-extension book-text-formatter-0.1.0.vsix
```

After installation, restart VS Code and the command **"Book Formatter: Format Text Layout"** will appear in the Command Palette.

### Method 2: Install via the VS Code UI

1. Press **Cmd+Shift+X** (macOS) or **Ctrl+Shift+X** (Windows/Linux) to open the Extensions view.
2. Click the **...** (three dots) menu in the top-right corner.
3. Select **"Install from VSIX..."**.
4. Browse to and select `book-text-formatter-0.1.0.vsix`.
5. Restart VS Code.

### Method 3: Side-load for development (Extension Development Host)

Press **F5** in VS Code with this project open to launch a temporary Extension Development Host window. The extension is loaded only for that session and does not require a `.vsix` install.

## How to Use

### Formatting Text

1. In the Extension Development Host window, open or create any plain text file.
2. **To format part of a file**: highlight the text you want to format.
   **To format the whole file**: make sure nothing is selected.
3. Open the Command Palette (**Cmd+Shift+P** on macOS / **Ctrl+Shift+P** on Windows/Linux).
4. Type **"Book Formatter"** and select **"Book Formatter: Format Text Layout"**.
5. The text is cleaned up, wrapped at the configured margin, and (by default) double-spaced.

### Customizing Settings

1. Open the Settings UI (**Cmd+,** / **Ctrl+,**).
2. Search for **"Book Text Formatter"**.
3. Adjust the following settings:

| Setting | Type | Default | Description |
|---|---|---|---|
| `bookTextFormatter.marginWidth` | number | 80 | Maximum characters per line (20–500). |
| `bookTextFormatter.doubleSpacing` | boolean | true | When enabled, a blank line is inserted between every wrapped line. |

You can also edit these directly in `settings.json`:

```json
{
  "bookTextFormatter.marginWidth": 100,
  "bookTextFormatter.doubleSpacing": false
}
```

### Binding a Keyboard Shortcut

1. Open the Keyboard Shortcuts editor (**Cmd+K Cmd+S** / **Ctrl+K Ctrl+S**).
2. Search for **"Book Formatter"**.
3. Click the **+** icon next to `book-text-formatter.formatText` and set your preferred keybinding.

## Example

### Input (messy copy-paste from a PDF)

```
This   is   a  very
long paragraph    that    has

irregular line breaks and some         extra spaces.

It should be cleaned up and wrapped nicely.
```

### Output (margin = 80, double-spacing on)

```
This is a very long paragraph that has irregular line breaks and some extra
spaces.

It should be cleaned up and wrapped nicely.
```

### Output (margin = 40, double-spacing off)

```
This is a very long paragraph that
has irregular line breaks and some
extra spaces.
It should be cleaned up and wrapped
nicely.
```

## Project Structure

```
text-format/
├── .vscode/
│   ├── launch.json          # F5 debug configuration
│   └── tasks.json           # Build task (TypeScript → JS)
├── out/                     # Compiled JavaScript output
├── src/
│   └── extension.ts         # Extension source code
├── package.json             # Extension manifest
├── tsconfig.json            # TypeScript configuration
└── README.md
```

## How It Works

1. **Smart Cleanup** — All line endings are normalized to `\n`, line breaks are collapsed into spaces, and multiple spaces/tabs are reduced to a single space. The result is one clean flowing paragraph.

2. **Word Wrapping** — The cleaned text is split into words and reassembled line-by-line. Each word is added to the current line only if it fits within the margin. Words longer than the margin are placed on their own line — they are never broken mid-word.

3. **Double Spacing** — If enabled, wrapped lines are joined with `\n\n` (one blank line between each). If disabled, lines are joined with `\n`.

4. **Replacement** — The original text (selection or whole document) is replaced with the formatted result in a single undo-able edit.

## Publishing

To package the extension for distribution:

```bash
# Install the packaging tool
npm install -g @vscode/vsce

# Build and package into a .vsix file
vsce package
```

This produces `book-text-formatter-0.1.0.vsix`, which can be installed via:
```bash
code --install-extension book-text-formatter-0.1.0.vsix
```

Or shared on the [VS Code Marketplace](https://marketplace.visualstudio.com/).