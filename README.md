# Pseudocode

[![Open VSX Version](https://img.shields.io/open-vsx/v/realryanchoi/pseudocodium)](https://open-vsx.org/extension/realryanchoi/pseudocodium)

A syntax highlighting and snippets extension for generic pseudocode. (file extension: `.pseudo`)

Compatible with **VSCodium** and VSCode. Published on the [Open VSX Registry](https://open-vsx.org/extension/realryanchoi/pseudocodium).

Syntax highlighting exists for multiple variants of common pseudocode keywords, allowing you to use your own style without being confined to a specific format.

---

## Table of Contents

- [What's New in v1.5.0](#whats-new-in-v150)
- [Features](#features)
  - [Syntax Highlighting](#syntax-highlighting)
  - [Snippets](#snippets)
  - [Customisable Keywords](#customisable-keywords)
- [Known Bugs](#known-bugs)
- [Roadmap](#roadmap)
- [Release Notes](#release-notes)

---

## What's New in v1.5.0

This release is a fork of [generic-pseudocode](https://github.com/Willumz/generic-pseudocode-vscode) by Willumz, adapted for VSCodium and the Open VSX Registry.

**Bug fixes:**
- Fixed a critical bug where the semantic tokens provider was never registered for users without a `~/.pseudoconfig` file — this meant custom keyword highlighting was silently broken for everyone not already using the feature.
- Fixed the custom keyword regex: identifiers containing underscores or digits (e.g. `my_keyword`, `keyword2`) are now correctly matched and highlighted.

**Performance:**
- Replaced O(n²) per-token comment scanning with a single O(n) precomputation pass, significantly improving performance on larger files.

**Code quality:**
- Removed leftover debug `console.log` statements and commented-out code.
- Modernised TypeScript throughout (`const`/`let`, `for...of`, early returns).
- Removed the deprecated `vscode` devDependency; updated `@types/vscode`, `@types/node`, and `typescript`.
- Updated `.vscodeignore` to exclude source files and dev artifacts from the packaged extension.

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

---

### Customisable Keywords

You can define your own custom keywords in a config file for semantic highlighting.

Place a `.pseudoconfig` file in your home directory:
- **Unix/macOS:** `~/.pseudoconfig`
- **Windows:** `C:\Users\{username}\.pseudoconfig`

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

> **Note:** You must reload the extension after editing the config file.
>
> **Note:** Workspace-level config files are not yet supported — only the global home directory config is read.

---

## Known Bugs

- `do`/`end` autoclosing triggers inside variable names (e.g. typing `doSomething` may insert an unwanted `end`).
- Single-quoted strings are not stripped before custom keyword matching, so a custom keyword that appears inside a single-quoted string may still be highlighted.

---

## Roadmap

The following improvements are planned or desirable for future releases.

### High priority

- **Workspace-level config** — support a `.pseudoconfig` in the workspace root directory so teams can share project-specific keyword sets, with precedence over the global config.
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

### 1.5.0

- Forked as **pseudocodium** for VSCodium / Open VSX
- Fixed critical bug: semantic tokens provider not registered without `.pseudoconfig`
- Fixed custom keyword regex to match identifiers with underscores and digits
- O(n) comment detection replacing O(n²) implementation
- Dependency and code quality updates

### 1.4.0

- Added customisable keywords via `.pseudoconfig`

### 1.3.0

- Added `static`, `public`, and `private` access modifiers
- Added `continue` keyword

### 1.2.0

- Added template string support (`${}`)

### 1.1.0

- Added structs and `struct`/`structdo` snippets

### 1.0.0

- Initial release with syntax highlighting and snippets
