/**
 * VSCode WebviewPanel that renders APS145 pseudocode as Mermaid flowcharts.
 * One panel instance is reused and updated as the editor changes.
 */

import * as vscode from 'vscode';
import * as crypto  from 'crypto';
import { parseDocument }            from './Aps145Parser';
import { generateMermaid, FunctionChart } from './MermaidGenerator';

export class FlowchartPanel {
    private static _instance: FlowchartPanel | undefined;

    private readonly _panel: vscode.WebviewPanel;
    private readonly _disposables: vscode.Disposable[] = [];

    // ---------------------------------------------------------------------------
    // Public static entry point
    // ---------------------------------------------------------------------------

    static createOrShow(text: string): void {
        const column = vscode.window.activeTextEditor
            ? vscode.ViewColumn.Beside
            : vscode.ViewColumn.One;

        if (FlowchartPanel._instance) {
            FlowchartPanel._instance._panel.reveal(column, true /* preserve focus */);
            FlowchartPanel._instance._update(text);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'pseudocodiumFlowchart',
            'Pseudocode Flowchart',
            { viewColumn: column, preserveFocus: true },
            {
                enableScripts: true,
                // No local resource roots needed; Mermaid is loaded from CDN.
                localResourceRoots: [],
            },
        );

        FlowchartPanel._instance = new FlowchartPanel(panel, text);
    }

    // ---------------------------------------------------------------------------
    // Constructor / disposal
    // ---------------------------------------------------------------------------

    private constructor(panel: vscode.WebviewPanel, text: string) {
        this._panel = panel;
        this._update(text);
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }

    dispose(): void {
        FlowchartPanel._instance = undefined;
        this._panel.dispose();
        for (const d of this._disposables) { d.dispose(); }
        this._disposables.length = 0;
    }

    // ---------------------------------------------------------------------------
    // Internal rendering
    // ---------------------------------------------------------------------------

    private _update(text: string): void {
        const doc    = parseDocument(text);
        const charts = generateMermaid(doc);
        this._panel.webview.html = buildHtml(charts);
    }
}

// ---------------------------------------------------------------------------
// HTML generation (module-level, no class state needed)
// ---------------------------------------------------------------------------

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function buildHtml(charts: FunctionChart[]): string {
    const nonce = crypto.randomBytes(16).toString('hex');

    // Content Security Policy:
    //   - Scripts only from CDN (Mermaid) and inline with nonce
    //   - Styles inline only (VS Code theme variables need inline style)
    const csp = [
        `default-src 'none'`,
        `script-src 'nonce-${nonce}' https://cdn.jsdelivr.net`,
        `style-src 'unsafe-inline'`,
        `img-src data: blob:`,          // Mermaid SVG diagrams
    ].join('; ');

    const bodyContent = charts.length === 0
        ? `<p class="empty">No APS145 functions found in this file.</p>`
        : charts.map(c => chartBlock(c)).join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="${csp}">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pseudocode Flowchart</title>
    <style>
        :root {
            --bg:   var(--vscode-editor-background,   #1e1e1e);
            --fg:   var(--vscode-editor-foreground,   #d4d4d4);
            --dim:  var(--vscode-descriptionForeground, #858585);
            --rule: var(--vscode-editorGroup-border,   #454545);
            --font: var(--vscode-font-family,          'Segoe UI', sans-serif);
        }
        * { box-sizing: border-box; }
        body {
            background: var(--bg);
            color: var(--fg);
            font-family: var(--font);
            font-size: 13px;
            margin: 0;
            padding: 1.5rem 2rem 3rem;
        }
        h1 {
            font-size: 0.85rem;
            font-weight: 400;
            color: var(--dim);
            margin: 0 0 1.5rem;
            letter-spacing: 0.04em;
            text-transform: uppercase;
        }
        h2 {
            font-size: 0.95rem;
            font-weight: 600;
            margin: 2.5rem 0 0.75rem;
            padding-bottom: 0.35rem;
            border-bottom: 1px solid var(--rule);
        }
        .chart-block { margin-bottom: 1rem; }
        .mermaid { background: transparent; overflow-x: auto; }
        /* Mermaid SVG inherits text colour in dark themes */
        .mermaid svg { max-width: 100%; height: auto; }
        .empty {
            color: var(--dim);
            font-style: italic;
        }
    </style>
</head>
<body>
    <h1>Pseudocode Flowchart</h1>
    ${bodyContent}
    <script type="module" nonce="${nonce}">
        import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        // VS Code injects a data-vscode-theme-kind attribute on <body>
        const themeKind = document.body.dataset.vscodeThemeKind ?? '';
        const useDark = prefersDark || themeKind.includes('dark') || themeKind.includes('high-contrast');
        mermaid.initialize({
            startOnLoad: true,
            theme: useDark ? 'dark' : 'default',
            flowchart: { curve: 'linear', useMaxWidth: true },
            securityLevel: 'loose',
        });
    </script>
</body>
</html>`;
}

function chartBlock(c: FunctionChart): string {
    // The Mermaid source is embedded as-is inside <pre class="mermaid">.
    // escLabel() in MermaidGenerator already handles chars that could be
    // misread as HTML inside a Mermaid context.  The only HTML-unsafe chars
    // remaining in the surrounding diagram syntax (arrows, node IDs) are
    // plain ASCII and safe in a <pre> text node.
    return `    <div class="chart-block">
        <h2>${escapeHtml(c.title)}</h2>
        <pre class="mermaid">${c.mermaid}</pre>
    </div>`;
}
