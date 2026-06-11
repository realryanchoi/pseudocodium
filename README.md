# Pseudocodium

> Forked from [willumz/generic-pseudocode-vscode](https://github.com/willumz/generic-pseudocode-vscode) — adapted for VSCodium and the Open VSX Registry. Extended with support for multiple pseudocode standards, and Mermaid.js flowchart generation.

A syntax highlighting, snippets, and Mermaid flowchart preview extension for pseudocode file formats (.pseudo). Syntax highlighting covers multiple variants of common keywords so you can write in your own style without being confined to a specific format.

[![Open VSX Version](https://img.shields.io/open-vsx/v/realryanchoi/pseudocodium)](https://open-vsx.org/extension/realryanchoi/pseudocodium)

Compatible with **VSCodium** and VSCode. Published on the [Open VSX Registry](https://open-vsx.org/extension/realryanchoi/pseudocodium).

---

## What's New in v0.5.0

**APS145 textbook conformance:**
- Bare `DECLARE:` (vars on continuation lines) and `INITIALIZE` are now recognised — no more requirement to attach a type to every DECLARE
- Decision-question vocabulary expanded to the full textbook set (`Is`, `Are`, `Was`, `Do`, `Does`, `Did`, `Has`, `Have`, `Should`, `Can`, `What`, `Which`, `Keep`, `Continue`, …)
- Nested decisions render correctly to any depth — required for textbook examples with 4+ levels of nesting and for nested `IF/ELSE IF/ELSE` inside loops
- `REPEAT: from Step #N.A.M` — nested step-path targets are supported, not just integers

**Standard-compliant flowcharts:**
- `DECLARE` now renders inside the flow (rectangle right after Start), matching the APS145 textbook diagrams
- Start node labelled `Start: functionName` (squashed-oval stadium shape)
- Comparison operators (`<`, `>`) survive escaping instead of getting eaten by interpolation rules

**Built-in vocabulary:**
- Grammar now highlights `NOW`, `EMPTY`, `EMPTY COLLECTION`, `CONSTANT`, date-part selectors (`::Year`, `::Date`, `::Hour`, …), and the full set of collection methods (`.ADD`, `.FIRST`, `.NEXT`, `.AT`, `.COUNT`, `.DELETE`, `.REPLACE_AT`, …)

**New examples and snippets:**
- Reference docs added under `examples/aps145/`: pseudocode template, worked Pet Shelter example, flowchart template, flowchart construct gallery
- New snippets: `apsmain`, `apsdocblock`, `apsinitialize`, `apsif`, `apsifelse`, `apswhich`, `apsloop`, `apsdoloop`, `apscallreturn`, `apsstruct`, `apsreturn`

---

## Features

### Syntax Highlighting

The following items have syntax highlighting. Synonyms are separated by spaces.

#### Keywords
```
output print    e.g. output "Hello World"
input
if
else
try
catch except
import
while loop
for
foreach
return
set              e.g. set x = 1
switch
case
break
continue
do
end
```

#### Operators
```
and &&
or  ||
not !
in
```

#### Access Modifiers
```
static
public
private
```

#### Functions & Procedures
```
function
procedure

e.g.
    function say(x) do
        print x
    end

    say("Hello World")
```

#### Classes
```
class
extends
constructor

e.g.
    class A do
        constructor() do
            print "Hi"
        end
    end

    class B extends A do
        constructor() do
            print "Hi"
        end
    end
```

#### Structs
```
struct

e.g.
    struct Point do
        x
        y
    end
```

#### Template Strings
```
${}

e.g.
    set user = "John"
    print "Hello, ${user}!"
```

If Else:

![If else](images/ifelse.png)

Loops:

![Loops](images/loops.png)

Switch:

![Switch](images/switch.png)

Try Catch:

![Try catch](images/trycatch.png)

Functions:

![Functions](images/function.png)

Classes:

![Classes](images/class.png)

Structs:

![Structs](images/struct.png)

---

### Snippets

![Snippets](images/snippets.gif)

All snippets have uppercase variants prefixed with `u` (e.g. `uif`, `ufor`, `ufunction`).

| Snippet | Description |
|---|---|
| `if` / `ifdo` | If statement (brace / `do...end`) |
| `ifelse` / `ifelsedo` | If-else statement |
| `for` / `fordo` | For loop |
| `foreach` / `foreachdo` | Foreach loop |
| `while` / `whiledo` | While loop |
| `loop` / `loopdo` | Loop statement |
| `try` / `trydo` | Try-catch block |
| `switch` / `switchdo` | Switch statement |
| `function` / `functiondo` | Function definition |
| `procedure` / `proceduredo` | Procedure definition |
| `class` / `classdo` | Class definition |
| `classextends` / `classextendsdo` | Class with inheritance |
| `struct` / `structdo` | Struct definition |

#### APS145 Snippets

| Snippet | Description |
|---|---|
| `apsmain` | Skeleton for the `main()` entry function (doc block + DECLARE + End) |
| `apsfunc` | Full APS145 function documentation block template |
| `apsdocblock` | 40-dash textbook documentation separator with Description/Argument(s)/Return Value |
| `apsdeclare` | Bare `DECLARE:` variable block (textbook standard) |
| `apsinitialize` | `INITIALIZE: var = value` statement |
| `apsif` | Optional selection (one-sided IF) — single YES branch |
| `apsifelse` | Alternative selection — YES / NO branches |
| `apswhich` | Multiple alternative selection — `What`/`Which` with three labelled cases |
| `apsdecision` | Generic decision with any standard starter (Is/Does/Has/Should/…) |
| `apsloop` | Optional iteration (check first — zero or more loops) |
| `apsdoloop` | Mandatory iteration (check after — at least one loop) |
| `apsrepeat` | `REPEAT: from Step #N` (or nested `#N.A.M`) loop-back statement |
| `apsassign` | `ASSIGN: var = value` statement |
| `apsdisplay` | `DISPLAY:` output block |
| `apscall` | `CALL: FunctionName(args)` — return value ignored |
| `apscallreturn` | `ASSIGN: result = CALL: FunctionName(args)` — capture explicit return |
| `apscollection` | `EMPTY (Collection of type: TypeName)` declaration |
| `apsstruct` | `EMPTY (type: StructureName)` declaration |
| `apsreturn` | `RETURN expression` (explicit return) |

---

### Pseudocode Standards

Pseudocodium includes built-in keyword sets for common pseudocode conventions. Declare a dialect at the top of your file to enable semantic highlighting for that standard's keywords without manually listing them in a config file.

**Prerequisite:** `editor.semanticHighlighting.enabled` must be `true` in your editor settings.

#### Declaring a Dialect

Place `@aps145` or `@default` on the **first line** of your file:

```
@aps145

---
Description/Purpose:
 Example using APS145 syntax
...
```

```
@default

function binarySearch(arr, target) do
  ...
end
```

#### Available Standards

| Directive | File extensions | Keywords include |
|---|---|---|
| `@aps145` | `.aps`, `.aps145`, `.pseudo` | Statements: `DECLARE`, `INITIALIZE`, `ASSIGN`, `DISPLAY`, `CALL`, `RETURN`, `REPEAT`, `END`, `CONSTANT`. Decision starters: `Is`, `Are`, `Was`, `Were`, `Do`, `Does`, `Did`, `Has`, `Have`, `Had`, `Should`, `Shall`, `Can`, `Could`, `Will`, `Would`, `May`, `Might`, `Must`, `What`, `Which`, `Who`, `Where`, `When`, `Why`, `How`, `Keep`, `Continue`. Built-ins: `NOW`, `EMPTY`, `COLLECTION`, `TRUE`, `FALSE`, `NULL` |
| `@default` | `.pseudo` | `IF`, `THEN`, `ELSE`, `WHILE`, `FOR`, `FOREACH`, `FUNCTION`, `PROCEDURE`, `RETURN`, `CLASS`, `TRUE`, `FALSE`, `NULL`, `AND`, `OR`, `NOT`, `INPUT`, `OUTPUT`, and more |

#### Keyword Merge Order

When multiple keyword sources are active, they are merged in this order (later sources win on conflict):

1. Built-in standard (`@aps145` / `@default`)
2. Global config (`~/.pseudoconfig`)
3. Workspace config (`.pseudoconfig` in workspace root, auto-discovered)

---

### Customisable Keywords

You can define your own custom keywords in a config file for semantic highlighting. Config files use the same JSON format regardless of where they are placed.

**Prerequisite:** `editor.semanticHighlighting.enabled` must be set to `true` in your editor settings.

The file must be a JSON object with a `"custom"` key containing a `"keyword"` array:

```json
{
    "custom": {
        "keyword": [
            "myKeyword",
            "my_other_keyword",
            "keyword2"
        ]
    }
}
```

Custom keyword names may contain letters, underscores, and digits (e.g. `my_func`, `type2`).

**Config file locations** (all are optional; all active sources are merged together):

| Location | Path | Purpose |
|---|---|---|
| Global | `~/.pseudoconfig` (Unix/macOS) or `C:\Users\{username}\.pseudoconfig` (Windows) | Applies to every pseudocode file you open |
| Workspace | `.pseudoconfig` in the workspace root folder | Shared project-specific keywords; auto-discovered |

> **Note:** You must reload the extension after editing a config file for changes to take effect.

---

## Known Bugs & Limitations

- `do`/`end` autoclosing triggers inside variable names (e.g. typing `doSomething` may insert an unwanted `end`).
- Single-quoted strings are not stripped before custom keyword matching, so a custom keyword that appears inside a single-quoted string may still be highlighted.
- **Flowchart preview requires network access** — the webview loads [Mermaid.js](https://mermaid.js.org/) from `cdn.jsdelivr.net`. The preview will not render in offline environments.

---

## Roadmap

The following improvements are planned or desirable for future releases.

### High priority

- **Config hot-reload** — watch the config file for changes with `fs.watch` and re-register the provider automatically, rather than requiring a manual extension reload.
- **Config validation** — validate `.pseudoconfig` against a schema and surface actionable error messages in VSCode's output panel when the file is malformed.
- **Fix `do`/`end` autoclosing in identifiers** — improve the `wordPattern` or autoclosing conditions in `language-configuration.json` so that `do` is not autoclosed when it appears mid-word.
- **Test suite** — add unit tests for the parsers (`Aps145Parser`, `DefaultParser`, `MermaidGenerator`) and core functions (`cleanText`, `buildCommentStates`, `extractTokens`) using `@vscode/test-electron` or a lightweight test runner.
- **CI/CD** — add a GitHub Actions workflow to type-check, build, and publish to Open VSX on tagged releases via `ovsx`.

### Medium priority

- **Bundle with esbuild** — replace raw `tsc` output with a single esbuild bundle to reduce install size and improve activation time.
- **Bundle Mermaid locally** — the flowchart webview currently loads Mermaid from `cdn.jsdelivr.net`, which requires network access. Bundling Mermaid as a local asset would enable offline use.
- **Single-quoted string support** — extend `cleanText()` and the TextMate grammar to handle single-quoted strings, so custom keywords inside them are not highlighted.
- **Additional semantic token types** — currently only `"keyword"` is supported in `.pseudoconfig`. Adding `"type"`, `"function"`, `"variable"`, and `"class"` scopes would allow much richer custom highlighting.

### Low priority / future ideas

- **Language server (LSP)** — a full language server would unlock hover documentation, go-to-definition, and rename refactoring for pseudocode symbols.
- **More snippet variants** — snippets for common algorithm patterns (binary search, merge sort, recursion templates, etc.).
- **Snippet-configurable style** — a setting to choose between brace-style and `do...end`-style as the default for snippet expansion.

---

## Release Notes

See [CHANGELOG.md](CHANGELOG.md) for the full history.

### 0.5.0

- APS145 textbook conformance: bare `DECLARE:`, `INITIALIZE`, broader decision vocabulary
- Nested decisions parsed and rendered to any depth
- `REPEAT: from Step #N.A.M` nested step-path targets supported
- `DECLARE` renders inside the flowchart (per textbook convention) instead of disconnected above
- Comparison operators (`<`, `>`) no longer collide with `<varName>` interpolation
- Grammar highlights `NOW`, `EMPTY`, date selectors, and the full collection-method set
- New reference docs under `examples/aps145/` and new APS145 snippets

### 0.4.0

- Dual grammar architecture: APS145 (`.aps`) and default C-style (`.pseudo`) as separate grammars
- `@aps145` / `@default` file directive replaces `// @standard:`
- Flowchart preview extended to `.pseudo` files

### 0.3.0

- Mermaid.js flowchart preview for APS145 pseudocode

### 0.2.0

- APS145 TextMate grammar patterns and eight new APS145 snippets

### 0.1.0

- Forked as **Pseudocodium** from [willumz/generic-pseudocode-vscode](https://github.com/willumz/generic-pseudocode-vscode) for VSCodium / Open VSX

---

## Development

### Build from source

```bash
git clone https://github.com/realryanchoi/pseudocodium.git
cd pseudocodium
npm install
npm run compile     # one-shot build
npm run watch       # incremental rebuild during development
```

### Run the Extension Development Host

1. Open the project folder in VSCode or VSCodium.
2. Press **F5** (or **Run → Start Debugging**) to launch a second window with the extension loaded from source.
3. In that window, open `examples/aps145/aps145.pseudo`.
4. Trigger **Preview Flowchart** via the hierarchy icon (⑂) in the editor title bar, or the Command Palette (**Ctrl+Shift+P**) → "Preview Flowchart".

A panel opens beside the editor with a Mermaid flowchart for the `main()` function.

### Package and install locally

To test the packaged `.vsix` in your everyday editor instead of the dev host:

```bash
npm install -g @vscode/vsce
vsce package
code --install-extension pseudocodium-0.5.0.vsix
# or for VSCodium:
codium --install-extension pseudocodium-0.5.0.vsix
```

VSCodium expects the layout `~/.vscode-oss/extensions/<publisher>.<extensionName>-<version>` when symlinking an extension folder for local testing.

### What to expect in the preview

| Element | Appearance |
|---|---|
| Start / `End` nodes | Rounded stadium shape |
| Top-level steps | Rectangles |
| `CALL:` steps | Double-bordered subroutine box |
| Decision steps (`Is ...?`) | Diamond with `YES` / `NO` edges |
| `REPEAT:` edges | Dashed lines looping back to the target step |
| Theme | Follows the editor's dark/light theme |
| Re-running the command | Refreshes the existing panel; does not open a second one |