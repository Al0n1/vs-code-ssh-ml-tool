import * as vscode from 'vscode';
import { SSHManager } from './sshManager';
import { ConfigParser } from './configParser';
import { SecretsManager } from './secretsManager';
import { SSHConnectTool } from './tools/sshConnectTool';
import { SSHExecuteTool } from './tools/sshExecuteTool';
import { SSHDisconnectTool } from './tools/sshDisconnectTool';

let sshManager: SSHManager;

/**
 * Активация расширения
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('SSH ML Tool extension is now active');

    // Проверяем наличие workspace
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showWarningMessage(
            'SSH ML Tool: No workspace folder opened. Please open a workspace to use SSH connections.'
        );
        return;
    }

    const workspaceRoot = workspaceFolders[0].uri.fsPath;

    // Инициализируем менеджеры
    const secretsManager = new SecretsManager(context);
    sshManager = new SSHManager(secretsManager);
    const configParser = new ConfigParser(workspaceRoot);

    // Создаем инструменты
    const connectTool = new SSHConnectTool(sshManager, configParser);
    const executeTool = new SSHExecuteTool(sshManager);
    const disconnectTool = new SSHDisconnectTool(sshManager);

    // Регистрируем Language Model Tools
    context.subscriptions.push(
        vscode.lm.registerTool('ssh_connect', connectTool)
    );

    context.subscriptions.push(
        vscode.lm.registerTool('ssh_execute', executeTool)
    );

    context.subscriptions.push(
        vscode.lm.registerTool('ssh_disconnect', disconnectTool)
    );

    console.log('SSH ML Tool: All tools registered successfully');

    // Показываем информационное сообщение при первом запуске
    const hasShownWelcome = context.globalState.get<boolean>('ssh-ml-tool.welcomeShown');
    if (!hasShownWelcome) {
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
