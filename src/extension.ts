import * as vscode from "vscode";
import * as path from "path";
import { Config } from "./Config";
import { DocumentSemanticTokensProvider } from "./DocumentSemanticTokensProvider";
import { tokenTypesLegend, tokenModifiersLegend } from "./tokenTypes";
import { FlowchartPanel } from "./mermaid/FlowchartPanel";

/** Entry point for the extension which runs when a file with the language
 * type "pseudocode" is opened
 */
export function activate(context: vscode.ExtensionContext) {
    const legend = new vscode.SemanticTokensLegend(tokenTypesLegend, tokenModifiersLegend);
    const DocSemTokProv = new DocumentSemanticTokensProvider();

    const conf = new Config(async () => {
        // Start with global ~/.pseudoconfig keywords
        let baseIndex = conf.config.custom ?? {};

        // Auto-discover workspace-root .pseudoconfig and layer it on top
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            const wsConfigPath = path.join(workspaceFolders[0].uri.fsPath, ".pseudoconfig");
            const wsConf = await Config.loadFromPath(wsConfigPath);
            if (wsConf.custom !== undefined) {
                baseIndex = Config.mergeIndexes(baseIndex, wsConf.custom);
            }
        }

        DocSemTokProv.baseIndex = baseIndex;

        context.subscriptions.push(
            vscode.languages.registerDocumentSemanticTokensProvider(
                { language: "pseudocode" },
                DocSemTokProv,
                legend
            )
        );
    });

    // Command: generate and preview a Mermaid flowchart for the active pseudocode file
    context.subscriptions.push(
        vscode.commands.registerCommand("pseudocodium.previewFlowchart", () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showWarningMessage("Open a .pseudo file first.");
                return;
            }
            FlowchartPanel.createOrShow(editor.document.getText());
        })
    );
}
