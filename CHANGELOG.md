# Change Log

## 0.5.0

**APS145 textbook conformance:**
- Parser now accepts bare `DECLARE:` (vars on continuation lines) per the textbook, not just typed `DECLARE int:` forms
- `INITIALIZE` keyword recognised as a declaration step
- Decision-question starters broadened to the full textbook vocabulary: `Is`, `Are`, `Was`, `Were`, `Do`, `Does`, `Did`, `Has`, `Have`, `Had`, `Should`, `Shall`, `Can`, `Could`, `Will`, `Would`, `May`, `Might`, `Must`, `What`, `Which`, `Who`, `Where`, `When`, `Why`, `How`, `Keep`, `Continue`
- `REPEAT: from Step #N.A.M` — nested step references are now supported as loop-back targets, not just integer top-level steps

**Nested decisions in flowcharts:**
- Decision sub-steps inside branches now have their own branches parsed and rendered, so textbook examples with 4+ levels of decision nesting work end-to-end
- Path-based node IDs (e.g. `main_s5_A_s4_B_s1`) replace the previous flat naming, so REPEAT targets at any depth resolve correctly

**Flowchart symbol fidelity to APS145 textbook:**
- Start node now reads `Start: functionName` and renders as a stadium (squashed oval) per the textbook
- DECLARE renders **inside** the flow as the first rectangle after Start, with an arrow into the first action step — no longer disconnected above the flowchart
- `<` and `>` comparison operators no longer collide with APS145 `<varName>` interpolation; operators are emitted as Mermaid HTML entities

**Grammar coverage:**
- Added `NOW`, `EMPTY`, `EMPTY COLLECTION`, `CONSTANT`, `INITIALIZE`, `Type`, `type`, `Collection of type`
- Date-part selectors highlighted: `::Year`, `::Month`, `::Day`, `::Date`, `::Hour`, `::Minute`, `::Second`, `::Time`
- Collection methods highlighted: `.ADD`, `.DELETE`, `.DELETE_AT`, `.REPLACE_AT`, `.FIRST`, `.LAST`, `.NEXT`, `.PREV`, `.AT`, `.COUNT`
- Doc-block field labels recognised in both styles: `DESCRIPTION:` / `Description/Purpose:`, `ARGUMENTS:` / `Argument(s) :`, `PARAMETER(S):`, `RETURN:` / `Return Value:`
- Decision starters highlighted as keywords at line start
- `[varName]` interpolation form recognised alongside `<varName>`

**Snippets:**
- `apsdeclare` updated to the bare-`DECLARE:` form (no longer requires a type choice)
- New snippets: `apsmain`, `apsdocblock`, `apsinitialize`, `apsif`, `apsifelse`, `apswhich`, `apsloop`, `apsdoloop`, `apscallreturn`, `apsstruct`, `apsreturn`
- `apsdecision` accepts the broader starter vocabulary

**Examples:**
- New reference docs under `examples/aps145/`: `aps145-pseudocode-template.md`, `aps145-pseudocode-example.md`, `aps145-flowchart-template.md`, `aps145-flowchart-examples.md`
- `activity4.pseudo` rewritten in textbook-standard form (three functions including a nested 3-way decision)

## 0.4.0

**Dual grammar architecture:**
- Split single grammar into `syntaxes/aps145.tmLanguage.json` (scope `source.pseudocode.aps145`) and `syntaxes/default.tmLanguage.json` (scope `source.pseudocode.default`)
- APS145 pseudocode now uses dedicated `.aps` / `.aps145` file extensions with its own language ID (`aps145-pseudocode`)
- Generic C-style pseudocode keeps `.pseudo` with the `pseudocode` language ID

**Simplified file directive:**
- Replaced `// @standard: <name>` comment directive with clean `@aps145` or `@default` at the top of the file
- Removed `// @extend:` directive — workspace-level `.pseudoconfig` covers per-project customisation
- Directive is now highlighted by both grammars as a distinct token

**Flowchart preview for default pseudocode:**
- Preview Flowchart command now works for `.pseudo` files (C-style) in addition to APS145
- New `DefaultParser` handles `function/if/else if/else/while/for/foreach` with both `do...end` and `{}` block styles
- Shared `ParsedTypes` module decouples parser interfaces from APS145-specific code
- Flowchart panel dispatches to the correct parser based on file language ID

**Other:**
- Doc block separator reduced from 10+ dashes to 3+ (`---` is now valid)
- Snippets now registered for both `pseudocode` and `aps145-pseudocode` language IDs
- Built-in standard renamed from `modern` to `default` in `standards.ts`

## 0.3.0

**Flowchart preview (Mermaid.js):**
- New command **Pseudocodium: Preview Flowchart** (`pseudocodium.previewFlowchart`) generates a live Mermaid flowchart from the active `.pseudo` file
- Accessible via the Command Palette or the editor title bar icon (when a `.pseudo` file is open)
- One flowchart per APS145 function; three new source modules isolated under `src/mermaid/`: `Aps145Parser`, `MermaidGenerator`, `FlowchartPanel`
- APS145 constructs map to correct Mermaid shapes: process box, decision diamond, subroutine box (`CALL:`), stadium for Start/End
- `REPEAT: from Step #N` renders as a dashed back-edge to the target step
- Decision steps with one explicit branch auto-add an inferred opposing edge (YES→NO, etc.)
- Multi-line `DISPLAY:` and `DECLARE:` labels include their first content line
- Webview respects VS Code dark/light theme; Mermaid rendered via CDN (requires network)

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
