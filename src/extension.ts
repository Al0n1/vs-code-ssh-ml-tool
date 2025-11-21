import * as vscode from 'vscode';
import { SSHManager } from './sshManager';
import { ConfigParser } from './configParser';
import { SecretsManager } from './secretsManager';
import { SSHConnectTool } from './tools/sshConnectTool';
import { SSHExecuteTool } from './tools/sshExecuteTool';
import { SSHDisconnectTool } from './tools/sshDisconnectTool';
import { SSHConfig } from './types';

let sshManager: SSHManager;

/**
 * Активация расширения
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('SSH ML Tool extension is now active');

    // Инициализируем менеджеры
    const secretsManager = new SecretsManager(context);
    sshManager = new SSHManager(secretsManager);

    // Функция для получения workspace root
    const getWorkspaceRoot = (): string | undefined => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return undefined;
        }
        return workspaceFolders[0].uri.fsPath;
    };

    // Проверяем наличие workspace для инструментов
    const workspaceRoot = getWorkspaceRoot();

    if (workspaceRoot) {
        const configParser = new ConfigParser(workspaceRoot);

        // Создаем и регистрируем Language Model Tools только если есть workspace
        const connectTool = new SSHConnectTool(sshManager, configParser);
        const executeTool = new SSHExecuteTool(sshManager);
        const disconnectTool = new SSHDisconnectTool(sshManager);

        context.subscriptions.push(
            vscode.lm.registerTool('ssh_connect', connectTool)
        );

        context.subscriptions.push(
            vscode.lm.registerTool('ssh_execute', executeTool)
        );

        context.subscriptions.push(
            vscode.lm.registerTool('ssh_disconnect', disconnectTool)
        );

        console.log('SSH ML Tool: Language Model Tools registered successfully');
    } else {
        console.log('SSH ML Tool: No workspace opened, Language Model Tools not registered');
    }

    // Регистрируем команды для прямого тестирования
    context.subscriptions.push(
        vscode.commands.registerCommand('ssh-ml-tool.testConnection', async () => {
            try {
                const currentWorkspaceRoot = getWorkspaceRoot();
                if (!currentWorkspaceRoot) {
                    vscode.window.showErrorMessage('No workspace folder opened. Please open a workspace to use SSH connections.');
                    return;
                }

                const configParser = new ConfigParser(currentWorkspaceRoot);
                const configs = await configParser.loadAllConfigs();

                if (configs.length === 0) {
                    vscode.window.showErrorMessage('No SSH configurations found in secrets/.ssh/');
                    return;
                }

                const connectionNames = configs.map((c: SSHConfig) => c.name);
                const selected = await vscode.window.showQuickPick(connectionNames, {
                    placeHolder: 'Select SSH connection to test'
                });

                if (!selected) {
                    return;
                }

                const config = configs.find((c: SSHConfig) => c.name === selected);
                if (!config) {
                    throw new Error(`Configuration not found: ${selected}`);
                } vscode.window.showInformationMessage(`Connecting to ${selected}...`);
                await sshManager.connect(config);
                vscode.window.showInformationMessage(`✅ Successfully connected to ${selected}`);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to connect: ${error}`);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('ssh-ml-tool.executeCommand', async () => {
            const activeConnections = sshManager.getActiveConnections();

            if (activeConnections.length === 0) {
                vscode.window.showWarningMessage('No active SSH connections. Please connect first.');
                return;
            }

            const selected = await vscode.window.showQuickPick(activeConnections, {
                placeHolder: 'Select active connection'
            });

            if (!selected) {
                return;
            }

            const command = await vscode.window.showInputBox({
                prompt: 'Enter command to execute',
                placeHolder: 'e.g., whoami, ls -la, pwd'
            });

            if (!command) {
                return;
            }

            try {
                const result = await sshManager.executeCommand(selected, command);

                // Создаем output channel для результатов
                const outputChannel = vscode.window.createOutputChannel(`SSH: ${selected}`);
                outputChannel.clear();
                outputChannel.appendLine(`Command: ${command}`);
                outputChannel.appendLine('─'.repeat(80));
                outputChannel.appendLine(result.stdout);
                if (result.stderr) {
                    outputChannel.appendLine('');
                    outputChannel.appendLine('STDERR:');
                    outputChannel.appendLine(result.stderr);
                }
                outputChannel.show();

                vscode.window.showInformationMessage(`Command executed successfully on ${selected}`);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to execute command: ${error}`);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('ssh-ml-tool.disconnect', async () => {
            const activeConnections = sshManager.getActiveConnections();

            if (activeConnections.length === 0) {
                vscode.window.showInformationMessage('No active connections to disconnect.');
                return;
            }

            const selected = await vscode.window.showQuickPick(activeConnections, {
                placeHolder: 'Select connection to disconnect'
            });

            if (!selected) {
                return;
            }

            try {
                await sshManager.disconnect(selected);
                vscode.window.showInformationMessage(`Disconnected from ${selected}`);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to disconnect: ${error}`);
            }
        })
    );

    // Показываем информационное сообщение при первом запуске
    const hasShownWelcome = context.globalState.get<boolean>('ssh-ml-tool.welcomeShown');
    if (!hasShownWelcome && workspaceRoot) {
        vscode.window.showInformationMessage(
            'SSH ML Tool активирован! Добавьте SSH конфигурации в папку secrets/.ssh/ вашего проекта.',
            'Открыть документацию'
        ).then(selection => {
            if (selection === 'Открыть документацию') {
                vscode.commands.executeCommand('markdown.showPreview',
                    vscode.Uri.file(workspaceRoot + '/README.md')
                );
            }
        });
        context.globalState.update('ssh-ml-tool.welcomeShown', true);
    }

    console.log('SSH ML Tool: Commands registered successfully');
}

/**
 * Деактивация расширения
 */
export async function deactivate() {
    console.log('SSH ML Tool: Deactivating...');

    // Отключаем все активные SSH подключения
    if (sshManager) {
        try {
            await sshManager.disconnectAll();
            console.log('SSH ML Tool: All connections closed');
        } catch (error) {
            console.error('SSH ML Tool: Error closing connections:', error);
        }
    }

    console.log('SSH ML Tool: Deactivated');
}
