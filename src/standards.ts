import { IndexInterface } from "./interfaces";

/**
 * Built-in keyword sets for supported pseudocode standards.
 * Each entry maps token type names to arrays of keywords.
 * Only keys that exist in tokenCodes will produce visible highlighting.
 */
export const STANDARDS: Record<string, IndexInterface> = {
    /**
     * APS145 course standard (Seneca Polytechnic).
     * Statement keywords, decision-point question words, and the built-in
     * vocabulary from the APS145 textbook (NOW, EMPTY, TRUE/FALSE, etc.).
     */
    aps145: {
        keyword: [
            // Statement keywords
            "DECLARE", "INITIALIZE", "ASSIGN", "DISPLAY", "CALL", "RETURN",
            "REPEAT", "END", "End", "CONSTANT",
            // Decision-point question starters
            "Is", "Are", "Was", "Were", "Do", "Does", "Did",
            "Has", "Have", "Had",
            "Should", "Shall", "Can", "Could", "Will", "Would", "May", "Might", "Must",
            "What", "Which", "Who", "Where", "When", "Why", "How",
            "Keep", "Continue",
            // Built-in values and types
            "NOW", "EMPTY", "COLLECTION",
            "TRUE", "FALSE", "NULL",
            "Type", "type", "Collection of type",
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
