/**
 * Converts a ParsedDocument into Mermaid flowchart syntax.
 * One flowchart is generated per function.
 *
 * APS145 conventions enforced:
 *   - Start node is a stadium ([(Start: name)]) — textbook calls this a "squashed oval".
 *   - DECLARE renders in the flow as the first rectangle after Start (not disconnected).
 *   - CALL renders as a striped/subroutine rectangle ([[label]]).
 *   - Decision is a diamond ({label}) with labelled outgoing edges per branch.
 *   - REPEAT renders as a dashed back-edge to the target step (top-level or nested).
 *   - End renders as a stadium ([(End)]).
 */

import {
    ParsedDocument,
    ParsedFunction,
    ParsedStep,
    ParsedBranch,
} from './ParsedTypes';

export interface FunctionChart {
    title: string;
    mermaid: string;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function generateMermaid(doc: ParsedDocument): FunctionChart[] {
    return doc.functions.map(fn => ({
        title:   `${fn.name}(${fn.params})`,
        mermaid: generateFunctionChart(fn),
    }));
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Produce a safe Mermaid node ID from arbitrary string parts. */
function nodeId(...parts: (string | number)[]): string {
    return parts.map(p => String(p).replace(/[^a-zA-Z0-9]/g, '_')).join('_');
}

/**
 * Convert a step path like "3" or "3.A.2" into a node ID under `fnPrefix`.
 * Numeric segments get an `s` prefix; letter segments pass through.
 */
function pathToId(fnPrefix: string, path: string): string {
    const parts = path.split('.').map(p => /^\d+$/.test(p) ? 's' + p : p);
    return nodeId(fnPrefix, ...parts);
}

/**
 * Escape text for use inside a Mermaid double-quoted label (`"..."`).
 * Converts characters that confuse either Mermaid or the HTML parser
 * to safe Mermaid named entities / neutral replacements.
 *
 * APS145 `<varName>` interpolation tokens are rewritten to `[varName]` so
 * Mermaid's HTML parser does not interpret them as tags. The identifier
 * pattern is strict — only word-and-dot sequences — so comparison
 * operators (`secret < minVal`) survive as real less-than / greater-than.
 * Remaining bare `<` and `>` are converted to HTML entities.
 */
function escLabel(text: string): string {
    return text
        .replace(/"/g,  '#quot;')
        .replace(/&/g,  '#amp;')
        .replace(/<([a-zA-Z_][a-zA-Z0-9_.]*)>/g, '[$1]')
        .replace(/</g,  '#lt;')
        .replace(/>/g,  '#gt;')
        .replace(/\{/g, '(')
        .replace(/\}/g, ')')
        .replace(/\r/g, '');
}

/** Mermaid node shape markup for a given step. */
function nodeMarkup(id: string, step: ParsedStep): string {
    const lbl = escLabel(step.label).replace(/\n/g, '<br/>');
    switch (step.type) {
        case 'decision': return `${id}{"${lbl}"}`;
        case 'end':      return `${id}(["${lbl}"])`;
        case 'call':     return `${id}[["${lbl}"]]`;
        default:         return `${id}["${lbl}"]`;
    }
}

/** Infer the implicit "else" label when one branch is missing. */
function inferElseLabel(existingLabels: string[]): string {
    if (existingLabels.length === 1) {
        const only = existingLabels[0].toUpperCase().trim();
        if (only === 'YES') { return 'NO'; }
        if (only === 'NO')  { return 'YES'; }
    }
    return 'otherwise';
}

/** Whether a branch's last step terminates flow (REPEAT or End). */
function branchTerminates(branch: ParsedBranch): boolean {
    if (branch.steps.length === 0) { return false; }
    const last = branch.steps[branch.steps.length - 1];
    return last.type === 'repeat' || last.type === 'end';
}

// ---------------------------------------------------------------------------
// Chart generation
// ---------------------------------------------------------------------------

function generateFunctionChart(fn: ParsedFunction): string {
    const fnPrefix = fn.name;
    const defs:  string[] = [];
    const edges: string[] = [];

    // Start node
    const startId  = nodeId(fnPrefix, 'start');
    const startLbl = escLabel(`Start: ${fn.name}`);
    defs.push(`    ${startId}(["${startLbl}"])`);

    // Emit the whole function body. The block emits its own node definitions
    // and connects entry → first step. There is no exit node; any final step
    // that needs an explicit terminator should be `End` in the source.
    emitBlock(fn.steps, '', fnPrefix, startId, undefined, defs, edges);

    return ['flowchart TD', ...defs, ...edges].join('\n');
}

/**
 * Emit node definitions and edges for a linear block of steps.
 *
 * @param steps      - Steps in this block (top-level or inside a branch)
 * @param pathPrefix - Step path prefix; "" at top level, "3.A" inside branch A of step 3
 * @param fnPrefix   - Function name prefix used in node IDs
 * @param entryId    - Node that should connect into the first step of this block
 * @param exitId     - Node that should receive flow after the last non-terminating step
 */
function emitBlock(
    steps:      ParsedStep[],
    pathPrefix: string,
    fnPrefix:   string,
    entryId:    string,
    exitId:     string | undefined,
    defs:       string[],
    edges:      string[],
): void {
    if (steps.length === 0) {
        if (exitId) { edges.push(`    ${entryId} --> ${exitId}`); }
        return;
    }

    // Declare every node in this block first so edges can refer to them
    // in any order.
    for (const step of steps) {
        const stepPath = pathPrefix ? `${pathPrefix}.${step.stepNum}` : `${step.stepNum}`;
        const stepId   = pathToId(fnPrefix, stepPath);
        defs.push(`    ${nodeMarkup(stepId, step)}`);
    }

    // Connect entry → first step
    const firstPath = pathPrefix ? `${pathPrefix}.${steps[0].stepNum}` : `${steps[0].stepNum}`;
    edges.push(`    ${entryId} --> ${pathToId(fnPrefix, firstPath)}`);

    // Connect through each step
    for (let i = 0; i < steps.length; i++) {
        const step     = steps[i];
        const stepPath = pathPrefix ? `${pathPrefix}.${step.stepNum}` : `${step.stepNum}`;
        const stepId   = pathToId(fnPrefix, stepPath);

        const next     = steps[i + 1];
        const nextPath = next
            ? (pathPrefix ? `${pathPrefix}.${next.stepNum}` : `${next.stepNum}`)
            : undefined;
        const nextId   = nextPath ? pathToId(fnPrefix, nextPath) : exitId;

        if (step.type === 'repeat') {
            if (step.repeatTarget) {
                const targetId = pathToId(fnPrefix, step.repeatTarget);
                edges.push(`    ${stepId} -. REPEAT .-> ${targetId}`);
            }
            // No fall-through after REPEAT.

        } else if (step.type === 'end') {
            // No outgoing edges from End.

        } else if (step.type === 'decision' && step.branches) {
            emitDecisionEdges(step, stepId, stepPath, fnPrefix, nextId, defs, edges);

        } else if (nextId) {
            edges.push(`    ${stepId} --> ${nextId}`);
        }
    }
}

/**
 * Emit branch edges for a decision step. Recurses into nested decisions via
 * emitBlock, which in turn calls back here for any decision sub-step.
 */
function emitDecisionEdges(
    step:           ParsedStep,
    decisionId:     string,
    decisionPath:   string,
    fnPrefix:       string,
    fallthroughId:  string | undefined,
    defs:           string[],
    edges:          string[],
): void {
    const branches = step.branches ?? [];

    for (const branch of branches) {
        const branchPath = `${decisionPath}.${branch.letter}`;

        if (branch.steps.length === 0) {
            if (fallthroughId) {
                edges.push(`    ${decisionId} -->|${branch.label}| ${fallthroughId}`);
            }
            continue;
        }

        // The diamond's edge into this branch is labelled with the case label.
        // We connect directly to the branch's first sub-step.
        const firstSubPath = `${branchPath}.${branch.steps[0].stepNum}`;
        const firstSubId   = pathToId(fnPrefix, firstSubPath);
        edges.push(`    ${decisionId} -->|${branch.label}| ${firstSubId}`);

        // Define + sequentially connect every sub-step inside this branch.
        // emitBlock will draw an extra entry → first edge that duplicates the
        // labelled one above, so we use a synthetic entry that emitBlock will
        // wire up unlabelled — then we skip that redundant unlabelled edge
        // below by passing the actual decisionId as entry and dropping its
        // unlabelled emission.
        emitBranchSteps(branch.steps, branchPath, fnPrefix, fallthroughId, defs, edges);
    }

    // Implicit else: if there's only one explicit branch, OR every explicit
    // branch terminates (REPEAT/End) so no branch falls through, draw an
    // unmatched-case edge directly to the fallthrough.
    const allTerminate  = branches.length > 0 && branches.every(branchTerminates);
    const needsImplicit = branches.length === 1 || (branches.length > 1 && allTerminate);

    if (needsImplicit && fallthroughId) {
        const elseLabel = inferElseLabel(branches.map(b => b.label));
        edges.push(`    ${decisionId} -->|${elseLabel}| ${fallthroughId}`);
    }
}

/**
 * Like emitBlock, but skips the unlabelled entry edge — the caller already
 * drew a labelled edge from the decision diamond into the branch's first step.
 */
function emitBranchSteps(
    steps:      ParsedStep[],
    pathPrefix: string,
    fnPrefix:   string,
    exitId:     string | undefined,
    defs:       string[],
    edges:      string[],
): void {
    if (steps.length === 0) { return; }

    // Declare nodes
    for (const step of steps) {
        const stepPath = `${pathPrefix}.${step.stepNum}`;
        const stepId   = pathToId(fnPrefix, stepPath);
        defs.push(`    ${nodeMarkup(stepId, step)}`);
    }

    // Connect through each step (no entry edge — caller drew it labelled)
    for (let i = 0; i < steps.length; i++) {
        const step     = steps[i];
        const stepPath = `${pathPrefix}.${step.stepNum}`;
        const stepId   = pathToId(fnPrefix, stepPath);

        const next     = steps[i + 1];
        const nextPath = next ? `${pathPrefix}.${next.stepNum}` : undefined;
        const nextId   = nextPath ? pathToId(fnPrefix, nextPath) : exitId;

        if (step.type === 'repeat') {
            if (step.repeatTarget) {
                const targetId = pathToId(fnPrefix, step.repeatTarget);
                edges.push(`    ${stepId} -. REPEAT .-> ${targetId}`);
            }

        } else if (step.type === 'end') {
            // no outgoing

        } else if (step.type === 'decision' && step.branches) {
            emitDecisionEdges(step, stepId, stepPath, fnPrefix, nextId, defs, edges);

        } else if (nextId) {
            edges.push(`    ${stepId} --> ${nextId}`);
        }
    }
}
