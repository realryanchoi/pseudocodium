/**
 * Converts a ParsedDocument into Mermaid flowchart syntax.
 * One flowchart is generated per function.
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
 * Escape text for use inside a Mermaid double-quoted label (`"..."`).
 * Converts characters that confuse either Mermaid or the HTML parser
 * to safe Mermaid named entities / neutral replacements.
 */
function escLabel(text: string): string {
    return text
        .replace(/"/g,  '#quot;')     // Mermaid entity for "
        .replace(/&/g,  '#amp;')      // Mermaid entity for &
        .replace(/<([^>]*)>/g, '[$1]') // <varName> → [varName] (interpolation)
        .replace(/\{/g, '(')          // avoid Mermaid diamond confusion
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

/**
 * If a decision has only one explicit branch, infer the label for the
 * implicit "other" path.
 */
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

    // Separate declarations from the flow steps
    const declareSteps = fn.steps.filter(s => s.type === 'declare');
    const flowSteps    = fn.steps.filter(s => s.type !== 'declare');

    // Build a map from step number → stable node ID for REPEAT targeting.
    const topStepIds = new Map<number, string>();
    for (const step of fn.steps) {
        topStepIds.set(step.stepNum, nodeId(fnPrefix, 's' + step.stepNum));
    }

    const defs:  string[] = [];
    const edges: string[] = [];

    // Declare nodes (disconnected, rendered above the flow)
    for (const step of declareSteps) {
        const id = topStepIds.get(step.stepNum)!;
        defs.push(`    ${nodeMarkup(id, step)}`);
    }

    // Start (terminal) node
    const startId  = nodeId(fnPrefix, 'start');
    const startLbl = escLabel(`${fn.name}(${fn.params})`);
    defs.push(`    ${startId}(["${startLbl}"])`);

    // Declare all flow step nodes
    for (const step of flowSteps) {
        const id = topStepIds.get(step.stepNum)!;
        defs.push(`    ${nodeMarkup(id, step)}`);

        // Declare sub-step nodes inside each branch
        if (step.branches) {
            for (const branch of step.branches) {
                for (const sub of branch.steps) {
                    const subId = nodeId(fnPrefix, 's' + step.stepNum, branch.letter, 's' + sub.stepNum);
                    defs.push(`    ${nodeMarkup(subId, sub)}`);
                }
            }
        }
    }

    // Edge: start → first flow step (skip declarations)
    if (flowSteps.length > 0) {
        const firstId = topStepIds.get(flowSteps[0].stepNum)!;
        edges.push(`    ${startId} --> ${firstId}`);
    }

    // Edges between flow steps only (declarations have no arrows)
    for (let i = 0; i < flowSteps.length; i++) {
        const step   = flowSteps[i];
        const id     = topStepIds.get(step.stepNum)!;
        const nextId = flowSteps[i + 1] ? topStepIds.get(flowSteps[i + 1].stepNum)! : undefined;

        if (step.type === 'repeat') {
            const targetId = topStepIds.get(step.repeatTarget ?? -1);
            if (targetId) {
                edges.push(`    ${id} -. REPEAT .-> ${targetId}`);
            }
            // REPEAT has no fall-through

        } else if (step.type === 'end') {
            // End node has no outgoing edges

        } else if (step.type === 'decision' && step.branches) {
            emitDecisionEdges(
                id, step, fnPrefix, nextId, topStepIds, edges,
            );

        } else if (nextId) {
            edges.push(`    ${id} --> ${nextId}`);
        }
    }

    return ['flowchart TD', ...defs, ...edges].join('\n');
}

function emitDecisionEdges(
    decisionId: string,
    step: ParsedStep,
    fnPrefix: string,
    nextId: string | undefined,
    topStepIds: Map<number, string>,
    edges: string[],
): void {
    const branches = step.branches ?? [];

    for (const branch of branches) {
        if (branch.steps.length === 0) {
            // Empty branch: connect diamond directly to next top-level step
            if (nextId) {
                edges.push(`    ${decisionId} -->|${branch.label}| ${nextId}`);
            }
            continue;
        }

        const firstSubId = nodeId(fnPrefix, 's' + step.stepNum, branch.letter, 's' + branch.steps[0].stepNum);
        edges.push(`    ${decisionId} -->|${branch.label}| ${firstSubId}`);

        // Connect sub-steps sequentially
        for (let j = 0; j < branch.steps.length; j++) {
            const sub        = branch.steps[j];
            const subId      = nodeId(fnPrefix, 's' + step.stepNum, branch.letter, 's' + sub.stepNum);
            const nextSubId  = branch.steps[j + 1]
                ? nodeId(fnPrefix, 's' + step.stepNum, branch.letter, 's' + branch.steps[j + 1].stepNum)
                : undefined;

            if (sub.type === 'repeat') {
                const targetId = topStepIds.get(sub.repeatTarget ?? -1);
                if (targetId) {
                    edges.push(`    ${subId} -. REPEAT .-> ${targetId}`);
                }
                // No fall-through after REPEAT

            } else if (sub.type === 'end') {
                // No outgoing

            } else if (nextSubId) {
                edges.push(`    ${subId} --> ${nextSubId}`);

            } else if (nextId) {
                // Last sub-step falls through to next top-level step
                edges.push(`    ${subId} --> ${nextId}`);
            }
        }
    }

    // Add implicit "else" edge when:
    //   - There is only one explicit branch, OR
    //   - Every explicit branch terminates (REPEAT/End) so no branch falls through
    const allTerminate = branches.length > 0 && branches.every(branchTerminates);
    const needsImplicit = branches.length === 1 || (branches.length > 1 && allTerminate);

    if (needsImplicit && nextId) {
        const elseLabel = inferElseLabel(branches.map(b => b.label));
        edges.push(`    ${decisionId} -->|${elseLabel}| ${nextId}`);
    }
}
