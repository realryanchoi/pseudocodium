/**
 * Parses APS145-style pseudocode into a structured document representation.
 * Handles function headers, numbered steps, decision branches, and REPEAT loops.
 */

export interface ParsedDocument {
    functions: ParsedFunction[];
}

export interface ParsedFunction {
    name: string;
    params: string;
    steps: ParsedStep[];
}

export type StepType =
    | 'declare' | 'assign' | 'display' | 'call' | 'return'
    | 'repeat'  | 'end'    | 'decision' | 'statement';

export interface ParsedStep {
    stepNum: number;
    type: StepType;
    label: string;
    /** Set for type === 'repeat': the step number to loop back to */
    repeatTarget?: number;
    /** Set for type === 'decision': the branches under this decision */
    branches?: ParsedBranch[];
}

export interface ParsedBranch {
    /** Capital letter: A, B, C... */
    letter: string;
    /** The case label: YES, NO, or a descriptive string */
    label: string;
    steps: ParsedStep[];
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function getIndent(line: string): number {
    return line.length - line.trimStart().length;
}

function isSeparatorLine(trimmed: string): boolean {
    return /^-{10,}\s*$/.test(trimmed);
}

/** Match a function header at column 0: Identifier(...) */
function matchFuncHeader(line: string): { name: string; params: string } | null {
    if (getIndent(line) !== 0) { return null; }
    const trimmed = line.trim();
    // Must not start with a digit (that would be a numbered step)
    if (/^\d/.test(trimmed)) { return null; }
    const m = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*?)\)\s*$/);
    if (!m) { return null; }
    return { name: m[1], params: m[2].trim() };
}

function classifyContent(content: string): StepType {
    const t = content.trim();
    if (/^REPEAT:\s*from\s+Step\s+#\d+/i.test(t))          { return 'repeat'; }
    if (/^End\s*$/i.test(t))                                 { return 'end'; }
    if (/^(Is|What|Which|Keep|Continue)\b.+\?/.test(t))     { return 'decision'; }
    if (/^DECLARE\b/i.test(t))                               { return 'declare'; }
    if (/^ASSIGN\b/i.test(t))                                { return 'assign'; }
    if (/^DISPLAY\b/i.test(t))                               { return 'display'; }
    if (/^CALL\b/i.test(t))                                  { return 'call'; }
    if (/^RETURN\b/i.test(t))                                { return 'return'; }
    return 'statement';
}

function extractRepeatTarget(content: string): number | undefined {
    const m = content.match(/REPEAT:\s*from\s+Step\s+#(\d+)/i);
    return m ? parseInt(m[1], 10) : undefined;
}

function makeStep(num: number, content: string): ParsedStep {
    const label = content.trim() || '(step)';
    const type  = classifyContent(label);
    const step: ParsedStep = { stepNum: num, type, label };
    if (type === 'repeat') {
        step.repeatTarget = extractRepeatTarget(label);
    }
    return step;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function parseDocument(text: string): ParsedDocument {
    const lines = text.split('\n');
    const functions: ParsedFunction[] = [];
    let i = 0;

    while (i < lines.length) {
        const line    = lines[i];
        const trimmed = line.trim();

        // Skip blank lines and directive comments
        if (!trimmed || /^\/\//.test(trimmed)) { i++; continue; }

        // Skip doc blocks (opening dash-line to closing dash-line, inclusive)
        if (isSeparatorLine(trimmed)) {
            i++;
            while (i < lines.length && !isSeparatorLine(lines[i].trim())) { i++; }
            i++; // consume closing separator
            continue;
        }

        // Function header
        const fh = matchFuncHeader(line);
        if (fh) {
            i++;
            const { steps, consumed } = parseTopLevelSteps(lines, i);
            functions.push({ name: fh.name, params: fh.params, steps });
            i += consumed;
            continue;
        }

        i++;
    }

    return { functions };
}

// ---------------------------------------------------------------------------
// Top-level step parsing (indent === 0, starts with \d+\.)
// ---------------------------------------------------------------------------

function parseTopLevelSteps(
    lines: string[],
    start: number,
): { steps: ParsedStep[]; consumed: number } {
    const steps: ParsedStep[] = [];
    let i = start;

    while (i < lines.length) {
        const line    = lines[i];
        const trimmed = line.trimStart();
        const ind     = getIndent(line);

        if (!trimmed) { i++; continue; }

        // Stop at next function header or doc block
        if (ind === 0 && isSeparatorLine(trimmed))  { break; }
        if (ind === 0 && matchFuncHeader(line))      { break; }

        // Top-level numbered step
        const stepM = (ind === 0) ? trimmed.match(/^(\d+)\.\s*(.*)/) : null;
        if (stepM) {
            const stepNum = parseInt(stepM[1], 10);
            let content   = stepM[2];
            i++;

            // Collect continuation lines (indented, not a branch marker)
            const contLines: string[] = [];
            while (i < lines.length) {
                const next        = lines[i];
                const nextTrimmed = next.trimStart();
                const nextInd     = getIndent(next);
                if (!nextTrimmed)                         { i++; continue; }
                if (nextInd === 0)                        { break; }
                if (/^[A-Z]\./.test(nextTrimmed))         { break; }
                contLines.push(nextTrimmed);
                i++;
            }

            // Merge continuation content into the label:
            // - If the step line had no inline content, use the first continuation line.
            // - If the step is a bare keyword ending in ":" (e.g. "DISPLAY:", "DECLARE:"),
            //   append the first continuation line so consecutive same-keyword nodes are
            //   distinguishable in the flowchart.
            if (!content && contLines.length > 0) {
                content = contLines[0];
            } else if (contLines.length > 0 && /^[A-Z]+:\s*$/.test(content)) {
                content = content + ' ' + contLines[0];
            }

            const step = makeStep(stepNum, content);

            if (step.type === 'decision') {
                const { branches, consumed } = parseBranches(lines, i);
                step.branches = branches;
                i += consumed;
            }

            steps.push(step);
            continue;
        }

        i++;
    }

    return { steps, consumed: i - start };
}

// ---------------------------------------------------------------------------
// Branch parsing (indented [A-Z]. lines under a decision step)
// ---------------------------------------------------------------------------

function parseBranches(
    lines: string[],
    start: number,
): { branches: ParsedBranch[]; consumed: number } {
    const branches: ParsedBranch[] = [];
    let i = start;
    let branchIndent = -1;

    while (i < lines.length) {
        const line    = lines[i];
        const trimmed = line.trimStart();
        const ind     = getIndent(line);

        if (!trimmed) { i++; continue; }
        if (ind === 0) { break; } // back to top-level

        // Find the indent of the first branch line
        if (branchIndent === -1 && /^[A-Z]\./.test(trimmed)) {
            branchIndent = ind;
        }

        if (ind === branchIndent && /^[A-Z]\./.test(trimmed)) {
            const bm = trimmed.match(/^([A-Z])\.\s*(.*?):\s*$/);
            if (!bm) { i++; continue; }

            const letter = bm[1];
            const label  = bm[2].trim() || letter;
            i++;

            const { steps: subSteps, consumed } = parseSubSteps(lines, i, branchIndent);
            branches.push({ letter, label, steps: subSteps });
            i += consumed;
            continue;
        }

        i++;
    }

    return { branches, consumed: i - start };
}

// ---------------------------------------------------------------------------
// Sub-step parsing (inside a branch, deeper indent than the branch marker)
// ---------------------------------------------------------------------------

function parseSubSteps(
    lines: string[],
    start: number,
    branchIndent: number,
): { steps: ParsedStep[]; consumed: number } {
    const steps: ParsedStep[] = [];
    let i = start;

    while (i < lines.length) {
        const line    = lines[i];
        const trimmed = line.trimStart();
        const ind     = getIndent(line);

        if (!trimmed) { i++; continue; }
        if (ind <= branchIndent) { break; } // back to branch level or above

        const ssm = trimmed.match(/^(\d+)\.\s*(.*)/);
        if (ssm) {
            const ssNum    = parseInt(ssm[1], 10);
            let ssContent  = ssm[2];
            i++;

            // Collect continuation lines for the sub-step
            while (i < lines.length) {
                const cont        = lines[i];
                const contTrimmed = cont.trimStart();
                const contInd     = getIndent(cont);
                if (!contTrimmed)         { i++; continue; }
                if (contInd <= ind)       { break; }
                if (!ssContent) {
                    ssContent = contTrimmed;
                } else if (/^[A-Z]+:\s*$/.test(ssContent)) {
                    ssContent = ssContent + ' ' + contTrimmed;
                }
                i++;
            }

            steps.push(makeStep(ssNum, ssContent));
        } else {
            i++;
        }
    }

    return { steps, consumed: i - start };
}
