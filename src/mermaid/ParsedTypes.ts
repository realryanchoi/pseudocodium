/**
 * Shared types for pseudocode parsers (APS145 and default).
 * Both parsers produce a ParsedDocument which MermaidGenerator consumes.
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
    /**
     * Set for type === 'repeat': the path to loop back to.
     * Top-level step: "3". Nested sub-step: "3.A.2" or deeper.
     */
    repeatTarget?: string;
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
