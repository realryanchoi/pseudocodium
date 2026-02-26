# Pseudocodium

> Forked from [willumz/generic-pseudocode-vscode](https://github.com/willumz/generic-pseudocode-vscode) — adapted for VSCodium and the Open VSX Registry. Extended with support for multiple pseudocode standards, and Mermaid.js flowchart generation.

A syntax highlighting and snippets extension for generic pseudocode. (file extension: `.pseudo`). Syntax highlighting exists for multiple variants of common pseudocode keywords, allowing you to use your own style without being confined to a specific format.

[![Open VSX Version](https://img.shields.io/open-vsx/v/realryanchoi/pseudocodium)](https://open-vsx.org/extension/realryanchoi/pseudocodium)

Compatible with **VSCodium** and VSCode. Published on the [Open VSX Registry](https://open-vsx.org/extension/realryanchoi/pseudocodium).

---

## What's New in v0.2.0

**Pseudocode standards — built-in keyword sets activated per file:**
- New `// @standard: <name>` file directive (place in the first 10 lines) enables semantic highlighting for a named keyword set without any manual config.
- Three built-in standards: `aps145` (Seneca Polytechnic APS145 course), `modern` (industry pseudocode conventions), `generic` (minimal common keywords).
- New `// @extend: <path>` directive layers additional `.pseudoconfig`-format JSON files on top, scoped to individual files. Multiple `@extend:` lines are processed in order.

**Workspace config support:**
- A `.pseudoconfig` at the workspace root is now auto-discovered and merged automatically — no setup required. Keyword priority order: built-in standard → global `~/.pseudoconfig` → workspace `.pseudoconfig` → per-file `@extend:` files.

**APS145 structural syntax highlighting (TextMate grammar):**
- Function documentation block separators (`----------------------------------------------------------------`) are coloured as documentation comments.
- `Description/Purpose:`, `Argument(s):`, `Return Value:` header fields are highlighted.
- Step numbers (`1.`, `2.`, `10.`) and sub-step letters (`A.`, `B.`) are highlighted as constants.
- APS145 core keywords (`DECLARE`, `ASSIGN`, `DISPLAY`, `CALL`, `RETURN`, `REPEAT`, `END`) are highlighted without requiring semantic highlighting to be enabled.
- `REPEAT: from Step #N` is parsed as a compound pattern.
- Collection methods (`.ADD`, `.NEXT`, `.DELETE`, `.COUNT`) are highlighted as built-in functions.
- String interpolation variables (`<varName>`) are highlighted.
- Type annotations (`(Type: TypeName)`, `(Collection of type: TypeName)`) are highlighted.
- UI interaction markers (`[BUTTON: ...]`, `[User entered value]`) are highlighted as string literals.
- Eight new APS145 snippets: `apsfunc`, `apsdeclare`, `apsdecision`, `apsrepeat`, `apsassign`, `apsdisplay`, `apscall`, `apscollection`.

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
| `apsfunc` | Full APS145 function documentation block template |
| `apsdeclare` | `DECLARE:` variable block |
| `apsdecision` | `Is`/`What`/`Which` decision structure (A/B branches) |
| `apsrepeat` | `REPEAT: from Step #N` loop-back statement |
| `apsassign` | `ASSIGN: var = value` statement |
| `apsdisplay` | `DISPLAY:` output block |
| `apscall` | `CALL: FunctionName(args)` statement |
| `apscollection` | Empty collection declaration |

---

### Pseudocode Standards

Pseudocodium includes built-in keyword sets for common pseudocode conventions. You activate one per file using a **file-level directive** comment at the top of your `.pseudo` file. This enables semantic highlighting for that standard's keywords without needing to list them all manually in a config file.

**Prerequisite:** `editor.semanticHighlighting.enabled` must be `true` in your editor settings.

#### Activating a Standard

Place `// @standard: <name>` within the **first 10 lines** of your file:

```pseudo
// @standard: aps145

----------------------------------------------------------------
Description/Purpose:
 Example using APS145 syntax
...
```

If the directive appears more than once, the last occurrence wins.

#### Available Standards

| Name | Description | Keywords include |
|---|---|---|
| `aps145` | Seneca Polytechnic APS145 course standard | `DECLARE`, `ASSIGN`, `DISPLAY`, `CALL`, `RETURN`, `REPEAT`, `END`, `Is`, `What`, `Which`, `Keep`, `Continue` |
| `modern` | Industry-standard pseudocode conventions | `IF`, `THEN`, `ELSE`, `WHILE`, `FOR`, `FOREACH`, `FUNCTION`, `PROCEDURE`, `RETURN`, `CLASS`, `TRUE`, `FALSE`, `NULL`, `AND`, `OR`, `NOT`, `INPUT`, `OUTPUT`, and more |
| `generic` | Minimal keyword set — a common intersection suitable for language-agnostic algorithm descriptions | `IF`, `ELSE`, `WHILE`, `FOR`, `FOREACH`, `FUNCTION`, `RETURN`, `INPUT`, `OUTPUT`, `AND`, `OR`, `NOT`, `TRUE`, `FALSE`, `NULL`, `END` |

#### Extending a Standard

You can layer additional config files on top of a standard using `// @extend:` directives. Each line appends one path; multiple `@extend:` lines are processed in order, each one taking priority over the previous.

```pseudo
// @standard: aps145
// @extend: /home/user/my-extra-keywords.json
// @extend: ./project-keywords.json
```

The path can be absolute or relative to the workspace root. The referenced file must be a valid `.pseudoconfig`-format JSON file (a `"custom"` key with token type arrays).

#### Priority and Merge Order

When multiple keyword sources are active, they are merged in the following order — later sources override earlier ones on conflict, and all unique keywords are unioned together:

1. Built-in standard (`// @standard:`)
2. Global config (`~/.pseudoconfig`)
3. Workspace config (`.pseudoconfig` in workspace root, auto-discovered)
4. `// @extend:` files (in directive order, lowest to highest priority)

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
| Global | `~/.pseudoconfig` (Unix/macOS) or `C:\Users\{username}\.pseudoconfig` (Windows) | Applies to every `.pseudo` file you open |
| Workspace | `.pseudoconfig` in the workspace root folder | Shared project-specific keywords; auto-discovered |
| Per-file | Any `.json` path via `// @extend:` directive | Scoped to individual files; see [Extending a Standard](#extending-a-standard) |

> **Note:** You must reload the extension after editing a config file for changes to take effect.

---

## Known Bugs

- `do`/`end` autoclosing triggers inside variable names (e.g. typing `doSomething` may insert an unwanted `end`).
- Single-quoted strings are not stripped before custom keyword matching, so a custom keyword that appears inside a single-quoted string may still be highlighted.

---

## Roadmap

The following improvements are planned or desirable for future releases.

### High priority

- **Config hot-reload** — watch the config file for changes with `fs.watch` and re-register the provider automatically, rather than requiring a manual extension reload.
- **Config validation** — validate `.pseudoconfig` against a schema and surface actionable error messages in VSCode's output panel when the file is malformed.
- **Fix `do`/`end` autoclosing in identifiers** — improve the `wordPattern` or autoclosing conditions in `language-configuration.json` so that `do` is not autoclosed when it appears mid-word.

### Medium priority

- **Single-quoted string support** — extend `cleanText()` and the TextMate grammar to handle single-quoted strings, so custom keywords inside them are not highlighted.
- **Additional semantic token types** — currently only `"keyword"` is supported in `.pseudoconfig`. Adding `"type"`, `"function"`, `"variable"`, and `"class"` scopes would allow much richer custom highlighting.
- **Test suite** — add unit tests for `cleanText`, `buildCommentStates`, `isInComment`, `determineType`, and `extractTokens` using `@vscode/test-electron` or a lightweight test runner.
- **CI/CD** — add a GitHub Actions workflow to type-check, build, and publish to Open VSX on tagged releases via `ovsx`.

### Low priority / future ideas

- **Bundling** — use esbuild or webpack to bundle the extension, reducing install size and improving activation time.
- **Language server (LSP)** — a full language server would unlock hover documentation, go-to-definition, and rename refactoring for pseudocode symbols.
- **More snippet variants** — snippets for common algorithm patterns (binary search, merge sort, recursion templates, etc.).
- **Snippet-configurable style** — a setting to choose between brace-style and `do...end`-style as the default for snippet expansion.

---

## Release Notes

See [CHANGELOG.md](CHANGELOG.md) for the full history.

### 0.2.0

- APS145 TextMate grammar patterns: doc blocks, step/sub-step numbering, keywords, collection methods, string interpolation, type annotations, UI markers
- Eight new APS145 snippets (`apsfunc`, `apsdeclare`, `apsdecision`, `apsrepeat`, `apsassign`, `apsdisplay`, `apscall`, `apscollection`)
- Comprehensive APS145 example file

### 0.1.0

- Forked as **Pseudocodium** from [willumz/generic-pseudocode-vscode](https://github.com/willumz/generic-pseudocode-vscode) for VSCodium / Open VSX
- Fixed critical bug: semantic tokens provider not registered without `.pseudoconfig`
- Fixed custom keyword regex to match identifiers with underscores and digits
- O(n) comment detection replacing O(n²) implementation
- Added file-level `// @standard:` directive with built-in `aps145`, `modern`, and `generic` keyword sets
- Added file-level `// @extend:` directive to layer additional config files per file
- Added workspace-level `.pseudoconfig` auto-discovery and merging
- Dependency and code quality updates
