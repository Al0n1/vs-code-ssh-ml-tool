import * as vscode from 'vscode';

/**
 * Менеджер для работы с секретами через VS Code SecretStorage API
 */
export class SecretsManager {
    private static readonly KEY_PREFIX = 'ssh-ml-tool.password.';
    private secretStorage: vscode.SecretStorage;

    constructor(context: vscode.ExtensionContext) {
        this.secretStorage = context.secrets;
    }

    /**
     * Получает пароль для подключения из SecretStorage
     * @param connectionName Имя подключения
     * @returns Пароль или undefined если не найден
     */
    public async getPassword(connectionName: string): Promise<string | undefined> {
        const key = this.buildKey(connectionName);
        return await this.secretStorage.get(key);
    }

    /**
     * Сохраняет пароль для подключения в SecretStorage
     * @param connectionName Имя подключения
     * @param password Пароль для сохранения
     */
    public async setPassword(connectionName: string, password: string): Promise<void> {
        const key = this.buildKey(connectionName);
        await this.secretStorage.store(key, password);
    }

    /**
     * Удаляет пароль для подключения из SecretStorage
     * @param connectionName Имя подключения
     */
    public async deletePassword(connectionName: string): Promise<void> {
        const key = this.buildKey(connectionName);
        await this.secretStorage.delete(key);
    }

    /**
     * Запрашивает пароль у пользователя и сохраняет его
     * @param connectionName Имя подключения
     * @param host Хост для отображения в UI
     * @returns Введенный пароль или undefined если пользователь отменил ввод
     */
    public async promptAndSavePassword(connectionName: string, host: string): Promise<string | undefined> {
        const password = await vscode.window.showInputBox({
            prompt: `Enter password for SSH connection '${connectionName}' (${host})`,
            password: true,
            placeHolder: 'Password',
            ignoreFocusOut: true
        });

        if (password) {
            await this.setPassword(connectionName, password);
            vscode.window.showInformationMessage(
                `Password saved securely for connection '${connectionName}'`
            );
        }

        return password;
    }

    /**
     * Проверяет существование сохраненного пароля
     * @param connectionName Имя подключения
     * @returns true если пароль сохранен, иначе false
     */
    public async hasPassword(connectionName: string): Promise<boolean> {
        const password = await this.getPassword(connectionName);
        return password !== undefined && password.length > 0;
    }

    /**
     * Строит ключ для хранения в SecretStorage
     * @param connectionName Имя подключения
     * @returns Полный ключ
     */
    private buildKey(connectionName: string): string {
        return `${SecretsManager.KEY_PREFIX}${connectionName}`;
    }
}
