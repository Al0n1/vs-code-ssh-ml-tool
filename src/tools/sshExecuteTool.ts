import * as vscode from 'vscode';
import { SSHExecuteParameters } from '../types';
import { SSHManager } from '../sshManager';

/**
 * Language Model Tool для выполнения команд на SSH сервере
 */
export class SSHExecuteTool implements vscode.LanguageModelTool<SSHExecuteParameters> {
    private sshManager: SSHManager;

    constructor(sshManager: SSHManager) {
        this.sshManager = sshManager;
    }

    async prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<SSHExecuteParameters>,
        _token: vscode.CancellationToken
    ): Promise<vscode.PreparedToolInvocation> {
        const { connectionName, command } = options.input;

        return {
            invocationMessage: `Выполнение команды на '${connectionName}'...`,
            confirmationMessages: {
                title: 'Выполнение SSH команды',
                message: new vscode.MarkdownString(
                    `Выполнить команду на **${connectionName}**?\n\n` +
                    `\`\`\`bash\n${command}\n\`\`\``
                )
            }
        };
    }

    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<SSHExecuteParameters>,
        _token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        const { connectionName, command } = options.input;

        try {
            // Выполняем команду
            const result = await this.sshManager.executeCommand(connectionName, command);

            // Формируем ответ
            let message = `Command executed on '${connectionName}':\n\`\`\`bash\n${command}\n\`\`\`\n\n`;

            if (result.stdout) {
                message += `**Output:**\n\`\`\`\n${result.stdout}\n\`\`\`\n\n`;
            }

            if (result.stderr) {
                message += `**Errors/Warnings:**\n\`\`\`\n${result.stderr}\n\`\`\`\n\n`;
            }

            message += `**Exit code:** ${result.exitCode}`;

            // Если команда завершилась с ошибкой, добавляем контекст
            if (result.exitCode !== 0) {
                message += `\n\nNote: Command exited with non-zero code. This typically indicates an error or warning.`;
            }

            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(message)
            ]);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to execute command: ${errorMessage}`);
        }
    }
}
