import * as vscode from 'vscode';

/**
 * Book Text Formatter Extension
 *
 * Formats selected text (or the entire active document) for book layout by:
 *  1. Stripping irregular line breaks and extra whitespace to produce a single flowing block.
 *  2. Wrapping the cleaned text at a user-configurable margin (default: 80 characters).
 *  3. Optionally inserting an empty line between each wrapped line (double spacing).
 */

export function activate(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerTextEditorCommand(
        'book-text-formatter.formatText',
        (editor: vscode.TextEditor) => {
            formatText(editor);
        }
    );

    context.subscriptions.push(disposable);
}

export function deactivate() {
    // No cleanup needed.
}

/**
 * Retrieves the current value of a configuration setting, falling back to a default
 * when the setting is not defined or has an unexpected type.
 */
function getConfig<T>(section: string, defaultValue: T): T {
    const config = vscode.workspace.getConfiguration('bookTextFormatter');
    const value = config.get<T>(section);
    if (value === undefined || value === null) {
        return defaultValue;
    }
    return value;
}

/**
 * Formats the text selection (or the whole document) in the active editor.
 */
function formatText(editor: vscode.TextEditor): void {
    const document = editor.document;
    const marginWidth = getConfig<number>('marginWidth', 80);
    const doubleSpace = getConfig<boolean>('doubleSpacing', true);

    // --------------------------------------------------------------------------
    // 1. Determine the range of text to format.
    //    If nothing is selected we format the entire document.
    // --------------------------------------------------------------------------
    const selection = editor.selection;
    let range: vscode.Range;

    if (selection.isEmpty) {
        // Format the whole document.
        const firstLine = document.lineAt(0);
        const lastLine = document.lineAt(document.lineCount - 1);
        range = new vscode.Range(
            firstLine.range.start,
            lastLine.range.end
        );
    } else {
        range = new vscode.Range(selection.start, selection.end);
    }

    const inputText = document.getText(range);

    if (inputText.length === 0) {
        vscode.window.showWarningMessage('No text to format.');
        return;
    }

    // --------------------------------------------------------------------------
    // 2. Smart Cleanup — collapse everything into a single flowing paragraph.
    //    This strips double-spaces, irregular line-breaks, and extra whitespace
    //    so the text starts from a clean slate.
    // --------------------------------------------------------------------------
    const cleanedText = inputText
        .replace(/\r\n/g, '\n')           // Normalise CRLF → LF.
        .replace(/\r/g, '\n')             // Normalise bare CR → LF.
        .replace(/\n+/g, ' ')             // Collapse all line-breaks into spaces.
        .replace(/[ \t]+/g, ' ')          // Collapse multiple spaces/tabs to a single space.
        .trim();                          // Remove leading/trailing whitespace.

    if (cleanedText.length === 0) {
        vscode.window.showWarningMessage('Nothing to format after cleaning whitespace.');
        return;
    }

    // --------------------------------------------------------------------------
    // 3. Word-wrap the cleaned text to the configured margin width.
    //    Words longer than the margin are placed on their own line (they are not
    //    mid-split) to avoid orphaned fragments.
    // --------------------------------------------------------------------------
    const wrappedLines = wordWrap(cleanedText, marginWidth);

    // --------------------------------------------------------------------------
    // 4. Apply double-spacing (or not) as configured.
    // --------------------------------------------------------------------------
    let formattedText: string;
    if (doubleSpace) {
        // Append an empty line after every wrapped line.
        // We join with "\n\n" so there is exactly one blank line between lines.
        formattedText = wrappedLines.join('\n\n');
    } else {
        formattedText = wrappedLines.join('\n');
    }

    // --------------------------------------------------------------------------
    // 5. Replace the original text with the formatted text.
    // --------------------------------------------------------------------------
    editor.edit((editBuilder: vscode.TextEditorEdit) => {
        editBuilder.replace(range, formattedText);
    }).then(
        (success: boolean) => {
            if (!success) {
                vscode.window.showErrorMessage('Failed to apply text formatting.');
            }
        },
        (reason: unknown) => {
            vscode.window.showErrorMessage(
                `Book Text Formatter error: ${reason}`
            );
        }
    );
}

/**
 * Word-wraps `text` at `width` characters without breaking words.
 *
 * Rules:
 *  - Any single word longer than `width` is placed on its own line (not split).
 *  - Consecutive spaces in the input do not exist because we normalised them
 *    during the cleanup step; this function assumes single-space separation.
 */
function wordWrap(text: string, width: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
        const word = words[i];

        if (currentLine.length === 0) {
            // Start a new line with this word.
            currentLine = word;
        } else if (currentLine.length + 1 + word.length <= width) {
            // Word fits on the current line.
            currentLine += ' ' + word;
        } else {
            // Word does not fit — push the current line and start a new one.
            lines.push(currentLine);
            currentLine = word;
        }
    }

    // Don't forget the last accumulated line.
    if (currentLine.length > 0) {
        lines.push(currentLine);
    }

    return lines;
}