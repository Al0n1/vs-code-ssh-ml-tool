import * as vscode from 'vscode';
import { SSHConnectParameters } from '../types';
import { SSHManager } from '../sshManager';
import { ConfigParser } from '../configParser';

/**
 * Language Model Tool для подключения к SSH серверу
 */
export class SSHConnectTool implements vscode.LanguageModelTool<SSHConnectParameters> {
    private sshManager: SSHManager;
    private configParser: ConfigParser;

    constructor(sshManager: SSHManager, configParser: ConfigParser) {
        this.sshManager = sshManager;
        this.configParser = configParser;
    }

    async prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<SSHConnectParameters>,
        _token: vscode.CancellationToken
    ): Promise<vscode.PreparedToolInvocation> {
        const connectionName = options.input.connectionName;

        return {
            invocationMessage: `Подключение к SSH серверу '${connectionName}'...`,
            confirmationMessages: {
                title: 'SSH подключение',
                message: new vscode.MarkdownString(
                    `Установить SSH подключение к **${connectionName}**?`
                )
            }
        };
    }

    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<SSHConnectParameters>,
        _token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        const connectionName = options.input.connectionName;

        try {
            // Ищем конфигурацию
            const config = await this.configParser.findConfigByName(connectionName);

            if (!config) {
                // Получаем список доступных подключений для подсказки
                const available = await this.configParser.getAvailableConnections();
                throw new Error(
                    `Connection '${connectionName}' not found in configuration files. ` +
                    `Available connections: ${available.join(', ')}. ` +
                    `Please check the connection name or add it to a YAML file in secrets/.ssh/`
                );
            }

            // Подключаемся
            await this.sshManager.connect(config);

            const message =
                `Successfully connected to SSH server '${connectionName}' (${config.host}:${config.port || 22}). ` +
                `You can now use ssh_execute to run commands on this server.`;

            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(message)
            ]);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to connect: ${errorMessage}`);
        }
    }
}
