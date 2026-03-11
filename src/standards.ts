import { IndexInterface } from "./interfaces";

/**
 * Built-in keyword sets for supported pseudocode standards.
 * Each entry maps token type names to arrays of keywords.
 * Only keys that exist in tokenCodes will produce visible highlighting.
 */
export const STANDARDS: Record<string, IndexInterface> = {
    /**
     * APS145 course standard (Seneca Polytechnic).
     * Core statement keywords and decision-point question words.
     */
    aps145: {
        keyword: [
            "DECLARE", "ASSIGN", "DISPLAY", "CALL", "RETURN", "REPEAT", "END",
            // Decision-point words used in "Is X?", "What X?", "Which X?" patterns
            "Is", "What", "Which", "Keep", "Continue",
        ],
    },

    /**
     * Default (C-style) pseudocode conventions.
     * Covers structured control flow, OOP, I/O, and boolean logic.
     */
    default: {
        keyword: [
            "BEGIN", "END",
            "IF", "THEN", "ELSE", "END IF",
            "WHILE", "DO", "END WHILE",
            "FOR", "TO", "STEP", "END FOR",
            "FOREACH", "IN",
            "SWITCH", "CASE", "DEFAULT", "END SWITCH",
            "FUNCTION", "PROCEDURE", "SUBROUTINE", "RETURN",
            "TRY", "CATCH", "THROW", "FINALLY",
            "BREAK", "CONTINUE",
            "CLASS", "METHOD", "NEW",
            "NULL", "TRUE", "FALSE",
            "AND", "OR", "NOT",
            "INPUT", "OUTPUT", "READ", "WRITE",
            "PROGRAM", "MODULE", "END PROGRAM", "END MODULE",
        ],
    },

    /**
     * Generic minimal pseudocode — a small intersection of common keywords
     * suitable for language-agnostic algorithm descriptions.
     */
    generic: {
        keyword: [
            "IF", "ELSE", "END",
            "WHILE", "FOR", "FOREACH",
            "RETURN", "FUNCTION",
            "INPUT", "OUTPUT",
            "AND", "OR", "NOT",
            "TRUE", "FALSE", "NULL",
        ],
    },
};

/**
 * Returns the IndexInterface for the named standard, or `undefined` if unknown.
 * Name matching is case-insensitive.
 *
 * @param name - Standard name (e.g. `"aps145"`, `"modern"`, `"generic"`)
 */
export function resolveStandard(name: string): IndexInterface | undefined {
    return STANDARDS[name.toLowerCase()];
}
