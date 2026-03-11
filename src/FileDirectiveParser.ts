/**
 * Represents the directives extracted from the header of a `.pseudo` file.
 */
export interface FileDirectives {
    /** The dialect to apply: `"aps145"` or `"default"`. */
    standard?: string;
}

// Compiled once at module load — not per-call.
const DIRECTIVE_RE = /^@(aps145|default)\s*$/;

/**
 * Scans the first `maxLines` lines of `text` for a dialect directive.
 *
 * Supported directives (must appear at the start of the line, no leading whitespace):
 *   @aps145   — APS145 academic pseudocode standard
 *   @default  — Generic C-style pseudocode standard
 *
 * Rules:
 * - If the directive appears more than once, the last value wins.
 * - Lines that do not match are silently skipped.
 *
 * @param text     - Full document text
 * @param maxLines - Maximum number of lines to scan (default 5)
 */
export function parseDirectives(text: string, maxLines = 5): FileDirectives {
    const result: FileDirectives = {};
    const lines = text.split("\n");
    const limit = Math.min(lines.length, maxLines);

    for (let i = 0; i < limit; i++) {
        const line = lines[i].trimEnd();

        const match = DIRECTIVE_RE.exec(line);
        if (match) {
            result.standard = match[1];
        }
    }

    return result;
}
