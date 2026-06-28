import * as vscode from 'vscode';

/**
 * Book Text Formatter Extension
 *
 * Formats the entire active document for book layout by:
 *  1. Splitting text into paragraphs on blank lines, then collapsing irregular
 *     line breaks and extra whitespace inside each paragraph.
 *  2. Wrapping each paragraph at a user-configurable margin (default: 80 characters).
 *  3. Optionally inserting an empty line between every wrapped line (double spacing).
 *  4. Optionally indenting the first line of each paragraph.
 *  5. Optionally justifying text (even left + right edges).
 *  6. Optionally formatting on save.
 */

export function activate(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerTextEditorCommand(
        'book-text-formatter.formatText',
        (editor: vscode.TextEditor) => {
            formatText(editor);
        }
    );

    context.subscriptions.push(disposable);

    // Format-on-save listener
    const saveListener = vscode.workspace.onWillSaveTextDocument((e: vscode.TextDocumentWillSaveEvent) => {
        const config = vscode.workspace.getConfiguration('bookTextFormatter');
        const formatOnSave = config.get<boolean>('formatOnSave', false);
        if (!formatOnSave) {
            return;
        }

        const document = e.document;
        const languageId = document.languageId;
        const fileName = document.fileName;

        // Check if this file type should be formatted on save.
        const allowedTypes = config.get<string[]>('formatOnSaveFileTypes', ['plaintext', 'txt']);
        const shouldFormat = allowedTypes.some(t => {
            // Match by language ID or file extension (with dot, e.g. ".txt").
            if (t.startsWith('.')) {
                return fileName.endsWith(t);
            }
            return languageId === t;
        });

        if (!shouldFormat) {
            return;
        }

        // Find the editor for this document.
        const editor = vscode.window.visibleTextEditors.find(
            ed => ed.document === document
        );

        if (editor) {
            // We must wait for the save to complete before formatting,
            // otherwise our edit would conflict. Schedule after the save.
            const disposable = vscode.workspace.onDidSaveTextDocument((savedDoc: vscode.TextDocument) => {
                if (savedDoc === document) {
                    disposable.dispose();
                    formatText(editor);
                }
            });
            context.subscriptions.push(disposable);
        }
    });

    context.subscriptions.push(saveListener);
}

export function deactivate() {
    // No cleanup needed.
}

/**
 * Retrieves the current value of a configuration setting, falling back to a default
 * when the setting is not defined or has an unexpected type.
 */
function getConfig<T>(section: string, defaultValue: T, silent = false): T {
    const config = vscode.workspace.getConfiguration('bookTextFormatter');
    const value = config.get<T>(section);
    if (value === undefined || value === null) {
        return defaultValue;
    }
    if (typeof value !== typeof defaultValue) {
        if (!silent) {
            void vscode.window.showWarningMessage(
                `Book Text Formatter: "${section}" is configured with an invalid type ` +
                `(expected ${typeof defaultValue}, got ${typeof value}). Falling back to default: ${JSON.stringify(defaultValue)}`
            );
        }
        return defaultValue;
    }
    return value;
}

/**
 * Formats the whole document in the active editor.
 */
function formatText(editor: vscode.TextEditor): void {
    const document = editor.document;
    const marginWidth = getConfig<number>('marginWidth', 80);
    const doubleSpace = getConfig<boolean>('doubleSpacing', true);
    const firstLineIndent = getConfig<number>('firstLineIndent', 0);
    const justifyText = getConfig<boolean>('justifyText', false);

    // --------------------------------------------------------------------------
    // 1. Format the entire document so all text is reflowed together.
    // --------------------------------------------------------------------------
    const firstLine = document.lineAt(0);
    const lastLine = document.lineAt(document.lineCount - 1);
    const range = new vscode.Range(
        firstLine.range.start,
        lastLine.range.end
    );

    const inputText = document.getText(range);

    if (inputText.length === 0) {
        vscode.window.showWarningMessage('No text to format.');
        return;
    }

    // --------------------------------------------------------------------------
    // 2. Smart Cleanup — split into paragraphs on blank lines, then collapse
    //    each paragraph into a clean flowing block.
    // --------------------------------------------------------------------------
    const paragraphs = splitParagraphs(inputText, doubleSpace);

    if (paragraphs.length === 0) {
        vscode.window.showWarningMessage('Nothing to format after cleaning whitespace.');
        return;
    }

    // We use a progress reporter for large documents.
    vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: 'Book Formatter: formatting text...',
            cancellable: false
        },
        async () => {
            // ------------------------------------------------------------------
            // 3. Word-wrap each paragraph to the configured margin width.
            // ------------------------------------------------------------------
            const wrappedParagraphs = paragraphs.map(p => {
                const wrapped = wordWrap(p, marginWidth);

                // Apply first-line indent if configured.
                if (
                    firstLineIndent > 0 &&
                    wrapped.length > 0 &&
                    !isDialogueStart(wrapped[0])
                ) {
                    const indent = ' '.repeat(firstLineIndent);
                    wrapped[0] = indent + wrapped[0];
                }

                // Apply justification if configured.
                if (justifyText) {
                    return justifyLines(wrapped, marginWidth);
                }

                return wrapped;
            });

            // ------------------------------------------------------------------
            // 4. Join lines with the configured spacing.
            // ------------------------------------------------------------------
            const paramGlue = doubleSpace ? '\n\n' : '\n';
            const paragraphGlue = doubleSpace ? '\n\n\n\n' : '\n\n';
            const formattedParagraphs = wrappedParagraphs.map(lines => lines.join(paramGlue));
            const formattedText = formattedParagraphs.join(paragraphGlue);

            // ------------------------------------------------------------------
            // 5. Replace the original text with the formatted text.
            // ------------------------------------------------------------------
            await editor.edit((editBuilder: vscode.TextEditorEdit) => {
                editBuilder.replace(range, formattedText);
            });
        }
    ).then(
        undefined,
        (reason: unknown) => {
            vscode.window.showErrorMessage(
                `Book Text Formatter error: ${reason}`
            );
        }
    );
}

function splitParagraphs(text: string, doubleSpace: boolean): string[] {
    const normalizedText = text
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n');

    // In double-spaced text, two newlines separate wrapped lines.
    // Four newlines preserve a real paragraph boundary.
    const paragraphBreak = doubleSpace ? /\n{4,}/ : /\n{2,}/;

    return normalizedText
        .split(paragraphBreak)
        .map(p => p
            .replace(/\n+/g, ' ')
            .replace(/[ \t]+/g, ' ')
            .trim()
        )
        .filter(p => p.length > 0);
}

/**
 * Word-wraps `text` at `width` characters without breaking words.
 * An em dash or standalone hyphen marks dialogue, so it always begins a new line.
 */
function wordWrap(text: string, width: number): string[] {
    const words = text
        .replace(/—/g, ' —')
        .trim()
        .split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
        const word = words[i];

        if (isDialogueStart(word) && currentLine.length > 0) {
            lines.push(currentLine);
            currentLine = word;
        } else if (currentLine.length === 0) {
            currentLine = word;
        } else if (currentLine.length + 1 + word.length <= width) {
            currentLine += ' ' + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }

    if (currentLine.length > 0) {
        lines.push(currentLine);
    }

    return lines;
}

function isDialogueStart(text: string): boolean {
    return text.startsWith('—') || text.startsWith('-');
}

/**
 * Justifies an array of lines by distributing extra spaces between words
 * so that each line (except the last) reaches exactly `width` characters.
 *
 * The last line of a paragraph is left-aligned (not justified) to avoid
 * stretching a short final line.
 */
function justifyLines(lines: string[], width: number): string[] {
    if (lines.length === 0) {
        return lines;
    }

    const justified: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // The last line of a paragraph is never justified.
        if (i === lines.length - 1) {
            justified.push(line);
            break;
        }

        const words = line.split(' ');
        if (words.length <= 1) {
            // Single-word line — nothing to justify.
            justified.push(line);
            continue;
        }

        const currentLength = line.length;
        const neededSpaces = width - currentLength;

        if (neededSpaces <= 0) {
            // Line is already at or past the margin width.
            justified.push(line);
            continue;
        }

        // Distribute extra spaces across the gaps between words.
        const gaps = words.length - 1;
        const spacesPerGap = Math.floor(neededSpaces / gaps);
        const extraSpaces = neededSpaces % gaps;

        let result = '';
        for (let w = 0; w < words.length; w++) {
            result += words[w];
            if (w < gaps) {
                // One base space + allocated extra spaces.
                let spaceCount = 1 + spacesPerGap;
                if (w < extraSpaces) {
                    spaceCount++;
                }
                result += ' '.repeat(spaceCount);
            }
        }

        justified.push(result);
    }

    return justified;
}
