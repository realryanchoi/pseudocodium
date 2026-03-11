/**
 * Parses generic C-style / do...end / indentation-based pseudocode into a ParsedDocument.
 * Handles function declarations, if/else if/else, while, for, and return.
 *
 * Block detection is automatic:
 *   - If the opener line ends with `do`, `then`, or `{` → keyword-based termination (end / })
 *   - Otherwise → indentation-based termination (Python / Wikipedia pseudocode style)
 *
 * Both styles can coexist in the same file.
 */

import { ParsedDocument, ParsedFunction, ParsedStep, ParsedBranch, StepType } from './ParsedTypes';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getIndent(rawLine: string): number {
    return rawLine.length - rawLine.trimStart().length;
}

function isComment(line: string): boolean {
    return line.startsWith('//') || line.startsWith('/*') || line.startsWith('*') || line.startsWith('#');
}

function isBlockClose(line: string): boolean {
    return /^(end\s*(if|while|for|foreach|function|procedure)?|\})\s*$/i.test(line);
}

/** Whether the opener declares its body with an explicit keyword or brace. */
function hasExplicitBlockOpener(line: string): boolean {
    return /\s*(do|then|\{)\s*$/i.test(line);
}

function stripBlockOpener(line: string): string {
    return line.replace(/\s*(do|then|\{|:)\s*$/i, '').trim();
}

function matchFunctionHeader(line: string): { name: string; params: string } | null {
    const m = line.match(/^(?:(?:static|public|private)\s+)?(?:function|procedure)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)/i);
    return m ? { name: m[1], params: m[2].trim() } : null;
}

function matchIf(line: string): string | null {
    const stripped = stripBlockOpener(line);
    const m = stripped.match(/^if\s+(.+)$/i);
    if (!m) { return null; }
    return m[1].replace(/^\((.+)\)$/, '$1');
}

function matchElseIf(line: string): string | null {
    const stripped = stripBlockOpener(line);
    const m = stripped.match(/^else\s+if\s+(.+)$/i);
    if (!m) { return null; }
    return m[1].replace(/^\((.+)\)$/, '$1');
}

function isElse(line: string): boolean {
    return /^else\s*(\{)?\s*$/i.test(line);
}

function matchWhile(line: string): string | null {
    const stripped = stripBlockOpener(line);
    const m = stripped.match(/^while\s+(.+)$/i);
    if (!m) { return null; }
    return m[1].replace(/^\((.+)\)$/, '$1');
}

function matchFor(line: string): string | null {
    const stripped = stripBlockOpener(line);
    // handles: for x, foreach x, for each x
    const m = stripped.match(/^for(?:\s+each|\s*each)?\s+(.+)$/i);
    return m ? m[1] : null;
}

function classifyLine(line: string): StepType {
    if (/^return\b/i.test(line))                          { return 'return'; }
    if (/^DECLARE\b/i.test(line))                         { return 'declare'; }
    if (/^ASSIGN\b/i.test(line))                          { return 'assign'; }
    if (/^DISPLAY\b/i.test(line))                         { return 'display'; }
    if (/^CALL\b/i.test(line))                            { return 'call'; }
    if (/^[a-zA-Z_][a-zA-Z0-9_.]*\s*\(/.test(line))      { return 'call'; }
    return 'statement';
}

function branchLetter(index: number): string {
    return String.fromCharCode(65 + index); // A, B, C, ...
}

// ---------------------------------------------------------------------------
// Parser class (instance per document to keep step counter isolated)
// ---------------------------------------------------------------------------

interface BlockResult {
    steps: ParsedStep[];
    consumed: number;
}

interface IfResult {
    step: ParsedStep;
    consumed: number;
}

class DefaultParser {
    private stepCounter = 0;
    /** Raw (untrimmed) lines — needed for indent detection. */
    private rawLines: string[] = [];
    /** Trimmed lines — used for pattern matching. */
    private lines: string[] = [];

    private nextStep(): number {
        return ++this.stepCounter;
    }

    parseDocument(text: string): ParsedDocument {
        this.rawLines = text.split('\n');
        this.lines    = this.rawLines.map(l => l.trim());

        const functions: ParsedFunction[] = [];
        let i = 0;

        while (i < this.lines.length) {
            const line = this.lines[i];
            if (!line || isComment(line)) { i++; continue; }

            const fh = matchFunctionHeader(line);
            if (fh) {
                const funcIndent = getIndent(this.rawLines[i]);
                i++;
                this.stepCounter = 0;
                // Function body: indentation-based if no explicit opener
                const stopAt = hasExplicitBlockOpener(this.lines[i - 1]) ? undefined : funcIndent;
                const result = this.parseBlock(i, stopAt);
                functions.push({ name: fh.name, params: fh.params, steps: result.steps });
                i += result.consumed;
                continue;
            }

            i++;
        }

        return { functions };
    }

    /**
     * Parse a block of steps starting at line index `start`.
     *
     * @param start     - Index into this.lines to start parsing from
     * @param baseIndent - If set, stop when a non-blank line has indent <= baseIndent (indent mode).
     *                     If undefined, stop at keyword block-close (end / }) (keyword mode).
     */
    private parseBlock(start: number, baseIndent?: number): BlockResult {
        const steps: ParsedStep[] = [];
        let i = start;

        while (i < this.lines.length) {
            const line    = this.lines[i];
            const rawLine = this.rawLines[i];

            if (!line || isComment(line)) { i++; continue; }

            const indent = getIndent(rawLine);

            // Indentation-based termination
            if (baseIndent !== undefined && indent <= baseIndent) {
                break; // do not consume this line
            }

            // Keyword-based termination
            if (baseIndent === undefined && isBlockClose(line)) { i++; break; }

            // else / else if — stop, let if-chain handler consume it
            if (/^else\b/i.test(line)) { break; }

            // Nested function header — stop
            if (matchFunctionHeader(line)) { break; }

            // if statement
            const ifCond = matchIf(line);
            if (ifCond !== null) {
                const openerIndent = indent;
                const explicit     = hasExplicitBlockOpener(line);
                i++;
                const result = this.parseIfChain(i, ifCond, explicit ? undefined : openerIndent);
                result.step.stepNum = this.nextStep();
                steps.push(result.step);
                i += result.consumed;
                continue;
            }

            // while loop
            const whileCond = matchWhile(line);
            if (whileCond !== null) {
                const openerIndent = indent;
                const explicit     = hasExplicitBlockOpener(line);
                i++;
                const loopStepNum = this.nextStep();
                const body = this.parseBlock(i, explicit ? undefined : openerIndent);
                i += body.consumed;

                body.steps.push({
                    stepNum: this.nextStep(),
                    type: 'repeat',
                    label: `REPEAT: from Step #${loopStepNum}`,
                    repeatTarget: loopStepNum,
                });

                steps.push({
                    stepNum: loopStepNum,
                    type: 'decision',
                    label: `while ${whileCond}`,
                    branches: [
                        { letter: 'A', label: 'YES', steps: body.steps },
                        { letter: 'B', label: 'NO',  steps: [] },
                    ],
                });
                continue;
            }

            // for / foreach loop
            const forCond = matchFor(line);
            if (forCond !== null) {
                const openerIndent = indent;
                const explicit     = hasExplicitBlockOpener(line);
                i++;
                const loopStepNum = this.nextStep();
                const body = this.parseBlock(i, explicit ? undefined : openerIndent);
                i += body.consumed;

                body.steps.push({
                    stepNum: this.nextStep(),
                    type: 'repeat',
                    label: `REPEAT: from Step #${loopStepNum}`,
                    repeatTarget: loopStepNum,
                });

                steps.push({
                    stepNum: loopStepNum,
                    type: 'decision',
                    label: `for ${forCond}`,
                    branches: [
                        { letter: 'A', label: 'continue', steps: body.steps },
                        { letter: 'B', label: 'done',     steps: [] },
                    ],
                });
                continue;
            }

            // Generic statement
            steps.push({
                stepNum: this.nextStep(),
                type: classifyLine(line),
                label: line,
            });
            i++;
        }

        return { steps, consumed: i - start };
    }

    private parseIfChain(start: number, condition: string, baseIndent?: number): IfResult {
        let i = start;
        const ifBody = this.parseBlock(i, baseIndent);
        i += ifBody.consumed;

        const branches: ParsedBranch[] = [
            { letter: 'A', label: 'YES', steps: ifBody.steps },
        ];

        // Look for else if / else
        while (i < this.lines.length) {
            const line = this.lines[i];
            if (!line) { i++; continue; }

            const elseIfCond = matchElseIf(line);
            if (elseIfCond !== null) {
                const explicit = hasExplicitBlockOpener(line);
                const elseIfIndent = getIndent(this.rawLines[i]);
                i++;
                const nested = this.parseIfChain(i, elseIfCond, explicit ? undefined : elseIfIndent);
                nested.step.stepNum = this.nextStep();
                branches.push({
                    letter: branchLetter(branches.length),
                    label: 'NO',
                    steps: [nested.step],
                });
                i += nested.consumed;
                break;
            }

            if (isElse(line)) {
                const explicit = hasExplicitBlockOpener(line);
                const elseIndent = getIndent(this.rawLines[i]);
                i++;
                const elseBody = this.parseBlock(i, explicit ? undefined : elseIndent);
                i += elseBody.consumed;
                branches.push({
                    letter: branchLetter(branches.length),
                    label: 'NO',
                    steps: elseBody.steps,
                });
                break;
            }

            break;
        }

        return {
            step: { stepNum: 0, type: 'decision', label: condition, branches },
            consumed: i - start,
        };
    }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function parseDefaultDocument(text: string): ParsedDocument {
    return new DefaultParser().parseDocument(text);
}
