/**
 * Parses APS145-style pseudocode into a structured document representation.
 * Handles function headers, numbered steps, nested decisions, and REPEAT loops
 * with nested step references (e.g. #3.A.2).
 */

import type {
    ParsedDocument,
    ParsedFunction,
    ParsedStep,
    ParsedBranch,
    StepType,
} from './ParsedTypes';

export type { ParsedDocument, ParsedFunction, ParsedStep, ParsedBranch, StepType } from './ParsedTypes';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function getIndent(line: string): number {
    return line.length - line.trimStart().length;
}

function isSeparatorLine(trimmed: string): boolean {
    return /^-{3,}\s*$/.test(trimmed);
}

/** Match a function header at column 0: Identifier(...) */
function matchFuncHeader(line: string): { name: string; params: string } | null {
    if (getIndent(line) !== 0) { return null; }
    const trimmed = line.trim();
    if (/^\d/.test(trimmed)) { return null; }
    const m = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*?)\)\s*$/);
    if (!m) { return null; }
    return { name: m[1], params: m[2].trim() };
}

/**
 * APS145 decision questions begin with a recognised interrogative starter
 * and end with `?`. The set below covers the textbook's vocabulary plus
 * common modal/auxiliary verbs that appear in real coursework.
 */
const DECISION_STARTERS =
    'Is|Are|Was|Were|Do|Does|Did|Has|Have|Had|Should|Shall|Can|Could|Will|Would|May|Might|Must|What|Which|Who|Where|When|Why|How|Keep|Continue';
const DECISION_RE = new RegExp(`^(${DECISION_STARTERS})\\b.+\\?`, 'i');

function classifyContent(content: string): StepType {
    const t = content.trim();
    if (/^REPEAT:\s*from\s+Step\s+#[0-9A-Z.]+/i.test(t))  { return 'repeat'; }
    if (/^End\s*$/i.test(t))                               { return 'end'; }
    if (DECISION_RE.test(t))                               { return 'decision'; }
    if (/^(DECLARE|INITIALIZE)\b/i.test(t))                { return 'declare'; }
    // ASSIGN containing CALL — render as subroutine box per textbook convention
    // (e.g. ASSIGN: menuChoice = CALL: GetMenuChoice()).
    if (/^ASSIGN\b[^]*\bCALL\b/i.test(t))                  { return 'call'; }
    if (/^ASSIGN\b/i.test(t))                              { return 'assign'; }
    if (/^DISPLAY\b/i.test(t))                             { return 'display'; }
    if (/^CALL\b/i.test(t))                                { return 'call'; }
    if (/^RETURN\b/i.test(t))                              { return 'return'; }
    return 'statement';
}

function extractRepeatTarget(content: string): string | undefined {
    const m = content.match(/REPEAT:\s*from\s+Step\s+#([0-9]+(?:\.[A-Z]\.[0-9]+)*)/i);
    return m ? m[1] : undefined;
}

function isBranchMarker(trimmed: string): boolean {
    return /^[A-Z]\.\s/.test(trimmed) || /^[A-Z]\.$/.test(trimmed);
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

        if (!trimmed || /^\/\//.test(trimmed)) { i++; continue; }

        // Skip doc blocks (opening dash-line to closing dash-line, inclusive)
        if (isSeparatorLine(trimmed)) {
            i++;
            while (i < lines.length && !isSeparatorLine(lines[i].trim())) { i++; }
            i++;
            continue;
        }

        // Function header
        const fh = matchFuncHeader(line);
        if (fh) {
            i++;
            const { steps, consumed } = parseSteps(lines, i, -1);
            functions.push({ name: fh.name, params: fh.params, steps });
            i += consumed;
            continue;
        }

        i++;
    }

    return { functions };
}

// ---------------------------------------------------------------------------
// Step parsing — works at any depth.
//
// `parentIndent` is the indent of the surrounding container (the decision or
// function header). Steps in this block must be at indent > parentIndent.
// The block ends when a non-blank line appears at indent <= parentIndent,
// or at a separator line / function header at column 0.
// ---------------------------------------------------------------------------

function parseSteps(
    lines: string[],
    start: number,
    parentIndent: number,
): { steps: ParsedStep[]; consumed: number } {
    const steps: ParsedStep[] = [];
    let i = start;
    let stepIndent = -1; // auto-detected on first numbered line

    while (i < lines.length) {
        const line    = lines[i];
        const trimmed = line.trimStart();
        const ind     = getIndent(line);

        if (!trimmed) { i++; continue; }

        // Stop at function header or doc block separator at column 0
        if (ind === 0 && isSeparatorLine(trimmed))  { break; }
        if (ind === 0 && matchFuncHeader(line))      { break; }

        // Stop when we exit the current container
        if (ind <= parentIndent) { break; }

        // First numbered line establishes this block's step indent
        const numberedM = trimmed.match(/^(\d+)\.\s*(.*)/);
        if (!numberedM) {
            // Non-step line that's deeper than parent — likely stray content; skip
            i++;
            continue;
        }

        if (stepIndent === -1) { stepIndent = ind; }
        if (ind !== stepIndent) {
            // Stray nested numbered line that doesn't belong to this block; skip
            i++;
            continue;
        }

        const stepNum  = parseInt(numberedM[1], 10);
        let   content  = numberedM[2];
        i++;

        // Collect continuation lines (indented further than this step,
        // and not a branch marker)
        const contLines: string[] = [];
        while (i < lines.length) {
            const next        = lines[i];
            const nextTrimmed = next.trimStart();
            const nextInd     = getIndent(next);
            if (!nextTrimmed)                  { i++; continue; }
            if (nextInd <= ind)                { break; }
            if (isBranchMarker(nextTrimmed))   { break; }
            // Stop at deeper numbered lines too — those belong to a sub-block
            // (decision branches), not to this step's label.
            if (/^\d+\.\s/.test(nextTrimmed))  { break; }
            contLines.push(nextTrimmed);
            i++;
        }

        // Merge continuation into the label when appropriate
        if (!content && contLines.length > 0) {
            content = contLines.join('\n');
        } else if (contLines.length > 0 && /^[A-Z][A-Z_]*(\s+\w+)?:\s*$/.test(content)) {
            content = content + '\n' + contLines.join('\n');
        } else if (contLines.length > 0) {
            // For other steps, append continuation as label context (preserves
            // multi-line `Argument(s) :` style headers and parenthetical clauses)
            content = content + '\n' + contLines.join('\n');
        }

        const step = makeStep(stepNum, content);

        // If this step is a decision, recursively parse its branches.
        // Branches must be at indent > this step's own indent.
        if (step.type === 'decision') {
            const { branches, consumed } = parseBranches(lines, i, ind);
            step.branches = branches;
            i += consumed;
        }

        steps.push(step);
    }

    return { steps, consumed: i - start };
}

// ---------------------------------------------------------------------------
// Branch parsing — letter-marked branches under a decision step.
//
// `parentIndent` is the indent of the decision step itself. Branch markers
// must be at indent > parentIndent.
// ---------------------------------------------------------------------------

function parseBranches(
    lines: string[],
    start: number,
    parentIndent: number,
): { branches: ParsedBranch[]; consumed: number } {
    const branches: ParsedBranch[] = [];
    let i = start;
    let branchIndent = -1;

    while (i < lines.length) {
        const line    = lines[i];
        const trimmed = line.trimStart();
        const ind     = getIndent(line);

        if (!trimmed) { i++; continue; }

        // Stop at separator / function header at column 0
        if (ind === 0 && isSeparatorLine(trimmed))  { break; }
        if (ind === 0 && matchFuncHeader(line))      { break; }

        // Stop when we exit the decision's scope
        if (ind <= parentIndent) { break; }

        // First branch marker establishes the branch indent for this group
        if (branchIndent === -1 && isBranchMarker(trimmed)) {
            branchIndent = ind;
        }

        if (ind === branchIndent && isBranchMarker(trimmed)) {
            // Branch marker: "A.", "A. label", "A. label:", "A. label (expr):"
            const bm = trimmed.match(/^([A-Z])\.\s*(.*?)\s*:\s*$/);
            const noColon = trimmed.match(/^([A-Z])\.\s*(.*)$/);
            let letter: string;
            let label:  string;
            if (bm) {
                letter = bm[1];
                label  = bm[2].trim() || bm[1];
            } else if (noColon) {
                letter = noColon[1];
                label  = noColon[2].trim() || noColon[1];
            } else {
                i++;
                continue;
            }
            i++;

            const { steps: subSteps, consumed } = parseSteps(lines, i, branchIndent);
            branches.push({ letter, label, steps: subSteps });
            i += consumed;
            continue;
        }

        // Anything else inside the decision's scope but not a branch marker
        // is unexpected; skip rather than consume into a phantom branch.
        i++;
    }

    return { branches, consumed: i - start };
}
