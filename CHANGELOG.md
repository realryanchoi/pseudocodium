# Change Log

## 1.5.0

- Forked as **pseudocodium** for VSCodium / Open VSX Registry
- Fixed critical bug: semantic tokens provider was never registered when no `.pseudoconfig` file exists (affected all users not using custom keywords)
- Fixed custom keyword regex to correctly match identifiers containing underscores and digits (e.g. `my_keyword`, `keyword2`)
- Replaced O(n²) comment detection with an O(n) single-pass precomputation, improving performance on large files
- Removed leftover debug `console.log` statements
- Modernised TypeScript: replaced `var` with `const`/`let`, used `for...of`, added early-exit in type lookup
- Updated dependencies: `@types/vscode`, `@types/node`, `typescript`; removed deprecated `vscode` devDependency
- Updated `.vscodeignore` to exclude source files and dev artifacts from the packaged extension

## 1.4.0

- Added customisable keywords
- Added optional config file (used to define customisable keywords)

## 1.3.0

- Added `static`, `public`, and `private` modifiers for structs, classes, and functions
- Added the `continue` keyword

## 1.2.0

- Added template strings (e.g. `"Hi ${user.name}"`)

## 1.1.0

- Added structs
- Added `struct` and `structdo` snippets

## 1.0.3

- Fixed bug where do end would be autoclose in strings and comments

## 1.0.2

- Fixed bug which prevented comments in functions and procedures

## 1.0.1
- Minor changes to extension information

## 1.0.0
- Syntax highlighting
- Snippets for basic statements and definitions.