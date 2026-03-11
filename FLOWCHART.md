Option 1: F5 in VSCode/VSCodium (recommended)                                                                                                                                                        
                                                            
  1. Open the repo folder in VSCode/VSCodium:                                                                                                                                                          
  code /mnt/forge/github/pseudocodium                                                                                                                                                                  
  # or
  codium /mnt/forge/github/pseudocodium
  2. Press F5 (or Run → Start Debugging). This opens a second window — the Extension Development Host — with your extension loaded from source.
  3. In that second window, open examples/aps145.pseudo.
  4. Trigger the command in one of two ways:
    - Click the hierarchy icon (⑂) in the editor title bar
    - Open the Command Palette (Ctrl+Shift+P) → type Preview Flowchart
  5. A panel should open beside the editor with three flowcharts — one each for main, AddStudent, and DisplayAllStudents.

  ---
  Option 2: Install the .vsix locally

  If you want to test in your real editor environment (not a dev host):

  cd /mnt/forge/github/pseudocodium

  # Install vsce if you don't have it
  npm install -g @vscode/vsce

  # Package it
  vsce package

  # Install it
  code --install-extension pseudocodium-0.3.0.vsix
  # or for VSCodium:
  codium --install-extension pseudocodium-0.3.0.vsix

  Then reload the window and open examples/aps145.pseudo.

  ---
  Things to verify

  ┌──────────────────────────────────┬────────────────────────────────────────────────────────────────────────────────────────────┐
  │               What               │                                          Expected                                          │
  ├──────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────┤
  │ Three flowchart sections visible │ main(), AddStudent(students), DisplayAllStudents(students)                                 │
  ├──────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────┤
  │ main decision diamond            │ "Is continueAdding = TRUE?" with YES branch and NO edge to step 3                          │
  ├──────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────┤
  │ REPEAT edges                     │ Dashed lines looping back (step 4 → step 2 in main, step 3 → step 3 in DisplayAllStudents) │
  ├──────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────┤
  │ CALL: nodes                      │ Double-bordered subroutine box                                                             │
  ├──────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────┤
  │ End nodes                        │ Rounded stadium shape                                                                      │
  ├──────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────┤
  │ Theme                            │ Dark/light should match your editor                                                        │
  ├──────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────┤
  │ Reopen panel                     │ Running the command again while panel is open should refresh it, not open a second panel   │
  └──────────────────────────────────┴────────────────────────────────────────────────────────────────────────────────────────────┘

  ---
  Known limitation to be aware of

  The webview loads Mermaid from cdn.jsdelivr.net, so you need network access for the diagrams to render. If the SVGs don't appear (nodes show as raw text), that's the cause — it'll work fine once
  online.