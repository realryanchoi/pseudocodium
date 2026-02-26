# Change Log

## 0.2.0

**APS145 TextMate grammar patterns:**
- Function documentation block separators (`-{10,}`) highlighted as `comment.block.documentation`
- `Description/Purpose:`, `Argument(s):`, `Return Value:` fields highlighted as documentation keywords
- Step numbers (`1.`, `2.`) at line start highlighted as `constant.numeric.step`
- Sub-step letters (`A.`, `B.`) at indented line start highlighted as `constant.character.substep`
- APS145 core keywords (`DECLARE`, `ASSIGN`, `DISPLAY`, `CALL`, `RETURN`, `REPEAT`, `END`) highlighted via TextMate grammar (no semantic highlighting required)
- `REPEAT: from Step #N` pattern parsed as compound keyword + step reference
- Collection methods (`.ADD`, `.NEXT`, `.DELETE`, `.COUNT`) highlighted as `support.function.builtin`
- String interpolation (`<varName>`) highlighted as `variable.other.interpolated`
- Type annotations (`(Type: TypeName)`, `(Collection of type: TypeName)`) highlighted
- UI interaction markers (`[BUTTON: ...]`, `[User entered value]`) highlighted as `string.other.ui-element`

**APS145 snippets:**
- `apsfunc` — Full APS145 function documentation block template
- `apsdeclare` — `DECLARE:` variable block
- `apsdecision` — `Is`/`What`/`Which` decision structure with A/B branches
- `apsrepeat` — `REPEAT: from Step #N` loop-back
- `apsassign` — `ASSIGN: var = value`
- `apsdisplay` — `DISPLAY:` output block
- `apscall` — `CALL: FunctionName(args)`
- `apscollection` — Empty collection declaration

**Examples:**
- Replaced minimal `examples/aps145.pseudo` with a comprehensive multi-function example demonstrating all APS145 syntax features

## 0.1.0

Forked from [willumz/generic-pseudocode-vscode](https://github.com/willumz/generic-pseudocode-vscode).

**New features:**
- File-level `// @standard:` directive: activate a built-in keyword set by placing the directive in the first 10 lines of any `.pseudo` file
- Three built-in standards: `aps145` (Seneca Polytechnic APS145 course), `modern` (industry pseudocode conventions), `generic` (minimal common keywords)
- `// @extend:` directive: layer additional `.pseudoconfig`-format JSON files on top of a standard, scoped to individual files
- Workspace-level `.pseudoconfig`: a config file at the workspace root is now auto-discovered and merged automatically
- Keyword sets from all sources merged with defined priority: built-in standard → global `~/.pseudoconfig` → workspace config → per-file `@extend:` files

**Bug fixes:**
- Fixed critical bug: semantic tokens provider was never registered when no `.pseudoconfig` file exists (affected all users not using custom keywords)
- Fixed custom keyword regex to correctly match identifiers containing underscores and digits (e.g. `my_keyword`, `keyword2`)

**Performance:**
- Replaced O(n²) comment detection with an O(n) single-pass precomputation, improving performance on large files
- Per-document keyword index cache: directive-based index is only rebuilt when file directives change

**Code quality:**
- Modernised TypeScript: replaced `var` with `const`/`let`, used `for...of`, added early returns
- Removed leftover debug `console.log` statements
- Updated dependencies: `@types/vscode`, `@types/node`, `typescript`; removed deprecated `vscode` devDependency
- Updated `.vscodeignore` to exclude source files and dev artifacts from the packaged extension
