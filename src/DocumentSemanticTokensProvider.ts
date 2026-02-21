import * as vscode from "vscode";
import { TokenInterface, IndexInterface } from "./interfaces";
import { tokenCodes } from "./tokenTypes";

/**
 * Per-line comment state, precomputed by {@link DocumentSemanticTokensProvider.buildCommentStates}.
 */
interface LineCommentState {
    /** True if this line begins inside a block comment carried over from a previous line */
    startsInBlock: boolean;
    /** Column (exclusive) where the carried-over block comment ends; null if it continues past the line */
    blockEndCol: number | null;
    /** Column where a `//` line comment begins on this line; null if none */
    lineCommentCol: number | null;
    /** Block comment ranges that start on this line (end is exclusive; null means extends past line) */
    inlineBlockRanges: Array<{ start: number; end: number | null }>;
}

/**
 * Deals with processing the document for the tokens to highlight
 */
export class DocumentSemanticTokensProvider implements vscode.DocumentSemanticTokensProvider {
    /**
     * The index required for the class to work.
     * Maps token type names to arrays of custom keyword strings.
     */
    index: IndexInterface = {};

    async provideDocumentSemanticTokens(
        document: vscode.TextDocument,
        _token: vscode.CancellationToken
    ): Promise<vscode.SemanticTokens> {
        const documentText = document.getText();
        const tokens = this.extractTokens(this.cleanText(documentText));

        const builder = new vscode.SemanticTokensBuilder();
        tokens.forEach(val => {
            builder.push(val.line, val.startCharacter, val.length, val.type);
        });

        return builder.build();
    }

    /**
     * Extracts tokens from the contents of the file.
     * Precomputes comment positions in O(n) then checks each token in O(1).
     * @param text - The contents of the open file (should be cleaned first using {@link cleanText})
     * @returns The list of processed tokens
     */
    extractTokens(text: string): TokenInterface[] {
        const tokens: TokenInterface[] = [];
        const lines = text.split("\n");
        const commentStates = this.buildCommentStates(lines);

        for (let i = 0; i < lines.length; i++) {
            const re = /[A-Za-z_][A-Za-z0-9_]*/g;
            for (const match of lines[i].matchAll(re)) {
                const matchType = this.determineType(match[0]);
                if (matchType !== -1 && match.index !== undefined && !this.isInComment(i, match.index, commentStates)) {
                    tokens.push({
                        line: i,
                        startCharacter: match.index,
                        length: match[0].length,
                        type: matchType,
                    });
                }
            }
        }

        return tokens;
    }

    /**
     * Removes string literals.
     * Replaces the contents of strings (including the `"` delimiters, but preserving `\n` and `\r`) with `#`.
     * @param text - The text to be cleaned
     * @returns The cleaned text
     */
    cleanText(text: string): string {
        let cleaned = "";
        let inString = false;
        let isEscaped = false;

        for (let i = 0; i < text.length; i++) {
            let skip = false;

            if (text[i] === '"' && !isEscaped) {
                inString = !inString;
                skip = true;
            }
            if (text[i] === "\\" && inString) isEscaped = !isEscaped;
            if (text[i] !== "\\") isEscaped = false;

            if (inString || skip) {
                if (text[i] === "\n" || text[i] === "\r") cleaned += text[i];
                else cleaned += "#";
                continue;
            }

            cleaned += text[i];
        }

        return cleaned;
    }

    /**
     * Determines the type of the token so it can be correctly highlighted.
     * Returns on the first match found.
     * @param tokenText - the value of the token e.g. `myKeyword`
     * @returns The numerical type of the token, or -1 if not a custom keyword
     */
    determineType(tokenText: string): number {
        for (const typeVal of Object.keys(this.index)) {
            if (this.index[typeVal].includes(tokenText)) {
                const code = tokenCodes.get(typeVal);
                if (code !== undefined) return code;
            }
        }
        return -1;
    }

    /**
     * Precomputes comment state for each line in O(total characters).
     * The resulting array is used by {@link isInComment} for O(1) per-token lookups.
     * @param lines - The lines of the document
     * @returns Per-line comment states
     */
    buildCommentStates(lines: string[]): LineCommentState[] {
        const states: LineCommentState[] = [];
        let inBlock = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const state: LineCommentState = {
                startsInBlock: inBlock,
                blockEndCol: null,
                lineCommentCol: null,
                inlineBlockRanges: [],
            };

            let ci = 0;

            if (inBlock) {
                // Scan to find where the carried-over block comment ends
                while (ci < line.length) {
                    if (line[ci] === "*" && ci + 1 < line.length && line[ci + 1] === "/") {
                        inBlock = false;
                        state.blockEndCol = ci + 2;
                        ci += 2;
                        break;
                    }
                    ci++;
                }
                if (inBlock) {
                    // Block comment spans past this line; no further tokens to check
                    states.push(state);
                    continue;
                }
            }

            // Scan the remainder of the line (outside any block comment)
            while (ci < line.length) {
                if (line[ci] === "/" && ci + 1 < line.length) {
                    if (line[ci + 1] === "/") {
                        state.lineCommentCol = ci;
                        break;
                    } else if (line[ci + 1] === "*") {
                        const blockStart = ci;
                        ci += 2;
                        inBlock = true;
                        let blockEnded = false;
                        while (ci < line.length) {
                            if (line[ci] === "*" && ci + 1 < line.length && line[ci + 1] === "/") {
                                state.inlineBlockRanges.push({ start: blockStart, end: ci + 2 });
                                inBlock = false;
                                ci += 2;
                                blockEnded = true;
                                break;
                            }
                            ci++;
                        }
                        if (!blockEnded) {
                            // Block comment extends past this line
                            state.inlineBlockRanges.push({ start: blockStart, end: null });
                        }
                        continue;
                    }
                }
                ci++;
            }

            states.push(state);
        }

        return states;
    }

    /**
     * Returns true if the character at the given position is inside a comment.
     * Requires precomputed states from {@link buildCommentStates}.
     * @param line - Zero-based line index
     * @param col - Zero-based column index
     * @param states - Precomputed comment states from {@link buildCommentStates}
     */
    isInComment(line: number, col: number, states: LineCommentState[]): boolean {
        const s = states[line];

        // Check if inside a block comment carried over from a previous line
        if (s.startsInBlock && (s.blockEndCol === null || col < s.blockEndCol)) {
            return true;
        }

        // Check if inside a block comment that starts on this line
        for (const range of s.inlineBlockRanges) {
            if (col >= range.start && (range.end === null || col < range.end)) {
                return true;
            }
        }

        // Check if inside a line comment
        if (s.lineCommentCol !== null && col >= s.lineCommentCol) {
            return true;
        }

        return false;
    }
}
