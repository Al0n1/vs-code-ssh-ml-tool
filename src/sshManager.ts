import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Client, ClientChannel, ConnectConfig } from 'ssh2';
import { SSHConfig, SSHConnection, SSHCommandResult } from './types';
import { SecretsManager } from './secretsManager';

/**
 * Менеджер для управления SSH подключениями
 */
export class SSHManager {
    private connections: Map<string, SSHConnection> = new Map();
    private secretsManager: SecretsManager;

    constructor(secretsManager: SecretsManager) {
        this.secretsManager = secretsManager;
    }

    /**
     * Устанавливает SSH подключение
     * @param config Конфигурация подключения
     * @returns Promise с результатом подключения
     */
    public async connect(config: SSHConfig): Promise<void> {
        // Проверяем, не подключены ли мы уже
        if (this.connections.has(config.name)) {
            const existing = this.connections.get(config.name)!;
            if (existing.connected) {
                throw new Error(
                    `Already connected to '${config.name}'. Use ssh_disconnect first if you want to reconnect.`
                );
            }
        }

        const client = new Client();
        const connectConfig = await this.buildConnectConfig(config);

        return new Promise((resolve, reject) => {
            client.on('ready', () => {
                const connection: SSHConnection = {
                    name: config.name,
                    config,
                    client,
                    connected: true,
                    lastUsed: new Date()
                };
                this.connections.set(config.name, connection);
                resolve();
            });

            client.on('error', (err: Error) => {
                reject(new Error(
                    `Failed to connect to '${config.name}' (${config.host}:${config.port || 22}): ${err.message}. ` +
                    `Please check the connection configuration, network connectivity, and authentication credentials.`
                ));
            });

            client.on('close', () => {
                const conn = this.connections.get(config.name);
                if (conn) {
                    conn.connected = false;
                }
            });

            client.connect(connectConfig);
        });
    }

    /**
     * Выполняет команду на удаленном сервере
     * @param connectionName Имя подключения
     * @param command Команда для выполнения
     * @returns Результат выполнения команды
     */
    public async executeCommand(connectionName: string, command: string): Promise<SSHCommandResult> {
        const connection = this.connections.get(connectionName);

        if (!connection) {
            throw new Error(
                `Connection '${connectionName}' not found. Please use ssh_connect first to establish a connection.`
            );
        }

        if (!connection.connected) {
            throw new Error(
                `Connection '${connectionName}' is not active. Please use ssh_connect to re-establish the connection.`
            );
        }

        connection.lastUsed = new Date();

        return new Promise((resolve, reject) => {
            connection.client.exec(command, (err: Error | undefined, stream: ClientChannel) => {
                if (err) {
                    reject(new Error(
                        `Failed to execute command on '${connectionName}': ${err.message}`
                    ));
                    return;
                }

                let stdout = '';
                let stderr = '';
                let exitCode = 0;

                stream.on('close', (code: number) => {
                    exitCode = code;
                    resolve({ stdout, stderr, exitCode });
                });

                stream.on('data', (data: Buffer) => {
                    stdout += data.toString();
                });

                stream.stderr.on('data', (data: Buffer) => {
                    stderr += data.toString();
                });

                stream.on('error', (streamErr: Error) => {
                    reject(new Error(
                        `Error during command execution on '${connectionName}': ${streamErr.message}`
                    ));
                });
            });
        });
    }

    /**
     * Отключает SSH подключение
     * @param connectionName Имя подключения
     */
    public async disconnect(connectionName: string): Promise<void> {
        const connection = this.connections.get(connectionName);

        if (!connection) {
            throw new Error(
                `Connection '${connectionName}' not found. It may have already been disconnected.`
            );
        }

        connection.client.end();
        this.connections.delete(connectionName);
    }

    /**
     * Отключает все активные подключения
     */
    public async disconnectAll(): Promise<void> {
        const promises: Promise<void>[] = [];
        for (const name of this.connections.keys()) {
            promises.push(this.disconnect(name));
        }
        await Promise.all(promises);
    }

    /**
     * Проверяет, активно ли подключение
     * @param connectionName Имя подключения
     * @returns true если подключение активно
     */
    public isConnected(connectionName: string): boolean {
        const connection = this.connections.get(connectionName);
        return connection !== undefined && connection.connected;
    }

    /**
     * Возвращает список активных подключений
     * @returns Массив имен активных подключений
     */
    public getActiveConnections(): string[] {
        return Array.from(this.connections.keys()).filter(name =>
            this.isConnected(name)
        );
    }

    /**
     * Строит конфигурацию для подключения ssh2
     * @param config Конфигурация SSH
     * @returns Конфигурация для ssh2.Client
     */
    private async buildConnectConfig(config: SSHConfig): Promise<ConnectConfig> {
        const connectConfig: ConnectConfig = {
            host: config.host,
            port: config.port || 22,
            username: config.username
        };

        // Приоритет 1: Указан privateKeyPath в конфигурации
        if (config.privateKeyPath) {
            const keyPath = this.expandPath(config.privateKeyPath);
            if (!fs.existsSync(keyPath)) {
                throw new Error(
                    `SSH private key not found at '${keyPath}'. ` +
                    `Please check the privateKeyPath in the configuration for connection '${config.name}'.`
                );
            }
            connectConfig.privateKey = fs.readFileSync(keyPath);
        }
        // Приоритет 2: Используем дефолтный ключ ~/.ssh/id_rsa
        else {
            const defaultKeyPath = path.join(os.homedir(), '.ssh', 'id_rsa');
            if (fs.existsSync(defaultKeyPath)) {
                connectConfig.privateKey = fs.readFileSync(defaultKeyPath);
            }
            // Приоритет 3: Пробуем пароль
            else if (config.passwordRef) {
                let password = await this.secretsManager.getPassword(config.name);

                if (!password) {
                    // Запрашиваем пароль у пользователя
                    password = await this.secretsManager.promptAndSavePassword(
                        config.name,
                        config.host
                    );

                    if (!password) {
                        throw new Error(
                            `No authentication method available for connection '${config.name}'. ` +
                            `Password input was cancelled. Please try again or provide a private key.`
                        );
                    }
                }

                connectConfig.password = password;
            }
            // Ничего не подходит
            else {
                throw new Error(
                    `No authentication method available for connection '${config.name}'. ` +
                    `SSH key not found at default location '${defaultKeyPath}'. ` +
                    `Please either:\n` +
                    `1. Create an SSH key at ~/.ssh/id_rsa (recommended)\n` +
                    `2. Specify 'privateKeyPath' in the configuration\n` +
                    `3. Specify 'passwordRef' in the configuration to use password authentication`
                );
            }
        }

        return connectConfig;
    }

    /**
     * Раскрывает путь с ~ в абсолютный путь
     * @param filePath Путь к файлу
     * @returns Абсолютный путь
     */
    private expandPath(filePath: string): string {
        if (filePath.startsWith('~')) {
            return path.join(os.homedir(), filePath.slice(1));
        }
        return filePath;
    }
}
