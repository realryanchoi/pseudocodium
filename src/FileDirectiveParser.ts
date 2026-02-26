/**
 * Represents the directives extracted from the header of a `.pseudo` file.
 */
export interface FileDirectives {
    /** The name of the built-in standard to apply (e.g. `"aps145"`, `"modern"`). */
    standard?: string;
    /** Ordered list of config file paths to layer on top of the standard. */
    extends: string[];
}

// Compiled once at module load — not per-call.
const STANDARD_RE = /^\/\/\s*@standard:\s*(\S+)/;
const EXTEND_RE   = /^\/\/\s*@extend:\s*(\S+)/;

/**
 * Scans the first `maxLines` lines of `text` for `// @standard:` and `// @extend:` directives.
 *
 * Rules:
 * - If `@standard:` appears more than once, the last value wins.
 * - Each `@extend:` line appends a path to the extends list in order.
 * - Lines that do not match either pattern are silently skipped.
 * - Empty values (nothing after the colon) do not match and are ignored.
 *
 * @param text     - Full document text
 * @param maxLines - Maximum number of lines to scan (default 10)
 */
export function parseDirectives(text: string, maxLines = 10): FileDirectives {
    const result: FileDirectives = { extends: [] };
    const lines = text.split("\n");
    const limit = Math.min(lines.length, maxLines);

    for (let i = 0; i < limit; i++) {
        const line = lines[i].trimEnd();

        const stdMatch = STANDARD_RE.exec(line);
        if (stdMatch) {
            result.standard = stdMatch[1].toLowerCase();
            continue;
        }

        const extMatch = EXTEND_RE.exec(line);
        if (extMatch) {
            result.extends.push(extMatch[1]);
        }
    }

    return result;
}
