import * as vscode from 'vscode';
import { SSHDisconnectParameters } from '../types';
import { SSHManager } from '../sshManager';

/**
 * Language Model Tool для отключения от SSH сервера
 */
export class SSHDisconnectTool implements vscode.LanguageModelTool<SSHDisconnectParameters> {
    private sshManager: SSHManager;

    constructor(sshManager: SSHManager) {
        this.sshManager = sshManager;
    }

    async prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<SSHDisconnectParameters>,
        _token: vscode.CancellationToken
    ): Promise<vscode.PreparedToolInvocation> {
        const connectionName = options.input.connectionName;

        return {
            invocationMessage: `Отключение от SSH сервера '${connectionName}'...`,
            confirmationMessages: {
                title: 'SSH отключение',
                message: new vscode.MarkdownString(
                    `Завершить SSH подключение к **${connectionName}**?`
                )
            }
        };
    }

    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<SSHDisconnectParameters>,
        _token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        const connectionName = options.input.connectionName;

        try {
            // Отключаемся
            await this.sshManager.disconnect(connectionName);

            const message =
                `Successfully disconnected from SSH server '${connectionName}'. ` +
                `Use ssh_connect to establish a new connection if needed.`;

            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(message)
            ]);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to disconnect: ${errorMessage}`);
        }
    }
}
