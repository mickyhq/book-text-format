import * as vscode from 'vscode';

/**
 * Book Text Formatter Extension
 *
 * Formats selected text (or the entire active document) for book layout by:
 *  1. Splitting text into paragraphs on blank lines, then collapsing irregular
 *     line breaks and extra whitespace inside each paragraph.
 *  2. Wrapping each paragraph at a user-configurable margin (default: 80 characters).
 *  3. Optionally inserting an empty line between every wrapped line (double spacing).
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
    // 2. Smart Cleanup — split into paragraphs on blank lines, then collapse
    //    each paragraph into a clean flowing block.
    //
    //    Paragraphs are separated by one or more blank lines (e.g. \n\n or \n\n\n).
    //    Inside each paragraph, line-breaks and extra whitespace are collapsed.
    // --------------------------------------------------------------------------
    const normalizedText = inputText
        .replace(/\r\n/g, '\n')           // Normalise CRLF → LF.
        .replace(/\r/g, '\n');            // Normalise bare CR → LF.

    // Split on two-or-more consecutive newlines (blank lines between paragraphs).
    // The pattern /(\n\n+)/ captures one or more blank lines so we keep each
    // paragraph as a separate block.
    const rawParagraphs = normalizedText.split(/\n\n+/);

    // Clean up each paragraph individually.
    const paragraphs = rawParagraphs
        .map(p => p
            .replace(/\n+/g, ' ')         // Collapse line-breaks inside the paragraph.
            .replace(/[ \t]+/g, ' ')      // Collapse multiple spaces/tabs.
            .trim()
        )
        .filter(p => p.length > 0);       // Discard empty paragraphs (e.g. leading/trailing whitespace-only blocks).

    if (paragraphs.length === 0) {
        vscode.window.showWarningMessage('Nothing to format after cleaning whitespace.');
        return;
    }

    // --------------------------------------------------------------------------
    // 3. Word-wrap each paragraph to the configured margin width.
    //    Words longer than the margin are placed on their own line (they are not
    //    mid-split) to avoid orphaned fragments.
    // --------------------------------------------------------------------------
    const wrappedParagraphs = paragraphs.map(p => wordWrap(p, marginWidth));

    // --------------------------------------------------------------------------
    // 4. Join lines with the configured spacing.
    //    - Double-spacing ON:  blank line between every line (including across
    //                          paragraph boundaries — all lines uniformly spaced).
    //    - Double-spacing OFF: blank line only between paragraphs; lines inside
    //                          a paragraph are consecutive.
    // --------------------------------------------------------------------------
    const paramGlue = doubleSpace ? '\n\n' : '\n';
    const formattedParagraphs = wrappedParagraphs.map(lines => lines.join(paramGlue));
    const formattedText = formattedParagraphs.join('\n\n');

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