import * as vscode from 'vscode';
import { translateText } from './googleTranslate';

export function activate(context: vscode.ExtensionContext) {
    console.log('Antigravity Artifact Translator is now active!');

    const outputChannel = vscode.window.createOutputChannel("Antigravity Translator");

    // Provider to serve the translated content
    const provider = new TranslationContentProvider();
    const providerRegistration = vscode.workspace.registerTextDocumentContentProvider(TranslationContentProvider.scheme, provider);
    context.subscriptions.push(provider, providerRegistration);

    let disposable = vscode.commands.registerCommand('antigravity-translator.translateToChinese', async () => {
        outputChannel.clear();
        outputChannel.appendLine("Command triggered.");

        let text = '';

        // 1. Try Active Text Editor
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            outputChannel.appendLine("Found active text editor.");
            text = editor.document.getText();
        } else {
            // 2. Try Active Tab
            outputChannel.appendLine("No active text editor. Checking active tab...");
            const activeTab = vscode.window.tabGroups.activeTabGroup.activeTab;

            if (activeTab) {
                outputChannel.appendLine(`Active Tab Label: ${activeTab.label}`);

                if (activeTab.input) {
                    const input = activeTab.input as any;
                    let uri: vscode.Uri | undefined;

                    if (input.uri) {
                        uri = input.uri;
                        outputChannel.appendLine(`Found URI in input: ${uri?.toString()}`);
                    } else if (input.sourceUri) {
                        uri = input.sourceUri;
                        outputChannel.appendLine(`Found Source URI in input: ${uri?.toString()}`);
                    } else if (input.viewType && input.viewType.endsWith('preview') && input.original) {
                        uri = input.original;
                        outputChannel.appendLine(`Found Original URI in preview: ${uri?.toString()}`);
                    } else {
                        outputChannel.appendLine(`Input has no obvious URI. Input keys: ${Object.keys(input).join(', ')}`);
                    }

                    if (uri) {
                        try {
                            const document = await vscode.workspace.openTextDocument(uri);
                            text = document.getText();
                            outputChannel.appendLine(`Successfully read document. Length: ${text.length}`);
                        } catch (e: any) {
                            outputChannel.appendLine(`Failed to open document from URI: ${e.message}`);
                        }
                    }
                } else {
                    outputChannel.appendLine("Active tab has no input.");
                }
            } else {
                outputChannel.appendLine("No active tab found.");
            }
        }

        if (!text) {
            vscode.window.showWarningMessage('Could not find text content. Check "Output > Antigravity Translator" for details.');
            return;
        }

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Translating artifact...",
            cancellable: false
        }, async (progress) => {
            try {
                const config = vscode.workspace.getConfiguration('antigravity-artifact-translator');
                const targetLang = config.get<string>('targetLanguage', 'zh-CN');

                const translatedText = await translateText(text, targetLang);

                // Update the provider with the new content
                const uri = vscode.Uri.parse(`${TranslationContentProvider.scheme}:Translation.md`);
                provider.update(uri, translatedText);

                // Show the markdown preview
                await vscode.commands.executeCommand('markdown.showPreview', uri);

            } catch (error: any) {
                vscode.window.showErrorMessage(`Translation failed: ${error.message}`);
            }
        });
    });

    context.subscriptions.push(disposable);
}

class TranslationContentProvider implements vscode.TextDocumentContentProvider {
    static scheme = 'antigravity-translate';
    private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
    private _content = new Map<string, string>();

    get onDidChange() {
        return this._onDidChange.event;
    }

    dispose() {
        this._onDidChange.dispose();
    }

    provideTextDocumentContent(uri: vscode.Uri): string {
        return this._content.get(uri.toString()) || '';
    }

    update(uri: vscode.Uri, content: string) {
        this._content.set(uri.toString(), content);
        this._onDidChange.fire(uri);
    }
}

export function deactivate() { }
