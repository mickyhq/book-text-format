import * as assert from 'assert';

// ---------------------------------------------------------------------------
// We test the core formatting logic separately since it doesn't depend on
// the VS Code API. These functions are extracted here for testability but
// mirror the implementations in extension.ts.
// ---------------------------------------------------------------------------

function wordWrap(text: string, width: number): string[] {
    const words = text
        .replace(/—/g, ' —')
        .trim()
        .split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
        const word = words[i];

        if (word.startsWith('—') && currentLine.length > 0) {
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

function justifyLines(lines: string[], width: number): string[] {
    if (lines.length === 0) {
        return lines;
    }

    const justified: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (i === lines.length - 1) {
            justified.push(line);
            break;
        }

        const words = line.split(' ');
        if (words.length <= 1) {
            justified.push(line);
            continue;
        }

        const currentLength = line.length;
        const neededSpaces = width - currentLength;

        if (neededSpaces <= 0) {
            justified.push(line);
            continue;
        }

        const gaps = words.length - 1;
        const spacesPerGap = Math.floor(neededSpaces / gaps);
        const extraSpaces = neededSpaces % gaps;

        let result = '';
        for (let w = 0; w < words.length; w++) {
            result += words[w];
            if (w < gaps) {
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

function cleanParagraph(text: string): string {
    return text
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\n+/g, ' ')
        .replace(/[ \t]+/g, ' ')
        .trim();
}

function splitParagraphs(text: string): string[] {
    return text
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .split(/\n\n+/)
        .map(p => cleanParagraph(p))
        .filter(p => p.length > 0);
}

// ===========================================================================
// Tests
// ===========================================================================

suite('wordWrap', () => {

    test('wraps text at specified width', () => {
        const result = wordWrap('hello world this is a test', 10);
        assert.deepStrictEqual(result, [
            'hello',
            'world this',
            'is a test'
        ]);
    });

    test('returns single line if text fits in width', () => {
        const result = wordWrap('short text', 20);
        assert.deepStrictEqual(result, ['short text']);
    });

    test('handles empty string', () => {
        const result = wordWrap('', 10);
        assert.deepStrictEqual(result, []);
    });

    test('handles single long word (longer than width)', () => {
        const result = wordWrap('supercalifragilisticexpialidocious', 10);
        assert.deepStrictEqual(result, ['supercalifragilisticexpialidocious']);
    });

    test('handles exact width match', () => {
        const result = wordWrap('1234567890', 10);
        assert.deepStrictEqual(result, ['1234567890']);
    });

    test('handles multiple words exactly filling width', () => {
        const result = wordWrap('abc def ghi', 11);
        assert.deepStrictEqual(result, ['abc def ghi']);
    });

    test('starts dialogue marked by an em dash on a new line', () => {
        const result = wordWrap('Narration ends here. —Dialogue starts here.', 80);
        assert.deepStrictEqual(result, [
            'Narration ends here.',
            '—Dialogue starts here.'
        ]);
    });

    test('starts each em dash on a new line', () => {
        const result = wordWrap('—First speaker. — Second speaker.', 80);
        assert.deepStrictEqual(result, [
            '—First speaker.',
            '— Second speaker.'
        ]);
    });
});

suite('justifyLines', () => {

    test('justifies lines to target width', () => {
        const input = ['The quick brown fox', 'jumps over the lazy dog'];
        const result = justifyLines(input, 25);
        // Last line should be unchanged (left-aligned).
        assert.strictEqual(result.length, 2);
        assert.strictEqual(result[0].length, 25);
        assert.strictEqual(result[1], 'jumps over the lazy dog');
    });

    test('last line is never justified', () => {
        const input = ['short line', 'another short line'];
        const result = justifyLines(input, 40);
        // Both lines should be unchanged since they're short and last line is not justified.
        assert.strictEqual(result[1], 'another short line');
    });

    test('single-word lines are unchanged', () => {
        const input = ['Hello', 'World'];
        const result = justifyLines(input, 20);
        assert.deepStrictEqual(result, ['Hello', 'World']);
    });

    test('empty array returns empty', () => {
        const result = justifyLines([], 10);
        assert.deepStrictEqual(result, []);
    });

    test('line already at or past width is unchanged', () => {
        const input = ['This line is exactly thirty chars!', 'short'];
        const result = justifyLines(input, 35);
        // First line is 35 chars exactly — no extra spaces needed.
        assert.strictEqual(result[0], 'This line is exactly thirty chars!');
        assert.strictEqual(result[1], 'short');
    });
});

suite('cleanParagraph', () => {

    test('normalizes line endings and collapses whitespace', () => {
        const input = 'hello   world\n\n\nthis  is  a   test';
        const result = cleanParagraph(input);
        assert.strictEqual(result, 'hello world this is a test');
    });

    test('handles CRLF line endings', () => {
        const input = 'line1\r\nline2\r\nline3';
        const result = cleanParagraph(input);
        assert.strictEqual(result, 'line1 line2 line3');
    });

    test('trims leading and trailing whitespace', () => {
        const input = '   padded text   ';
        const result = cleanParagraph(input);
        assert.strictEqual(result, 'padded text');
    });
});

suite('splitParagraphs', () => {

    test('splits on blank lines into separate paragraphs', () => {
        const input = 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.';
        const result = splitParagraphs(input);
        assert.strictEqual(result.length, 3);
        assert.strictEqual(result[0], 'First paragraph.');
        assert.strictEqual(result[1], 'Second paragraph.');
        assert.strictEqual(result[2], 'Third paragraph.');
    });

    test('handles multiple blank lines between paragraphs', () => {
        const input = 'Para 1\n\n\n\nPara 2';
        const result = splitParagraphs(input);
        assert.strictEqual(result.length, 2);
    });

    test('filters out empty paragraphs', () => {
        const input = '\n\n\n\nOnly paragraph\n\n\n\n';
        const result = splitParagraphs(input);
        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0], 'Only paragraph');
    });

    test('single paragraph with no blank lines', () => {
        const input = 'Just one paragraph with\nsome line breaks';
        const result = splitParagraphs(input);
        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0], 'Just one paragraph with some line breaks');
    });
});
