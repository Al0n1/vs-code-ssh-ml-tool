import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { SSHConfig, SSHConfigFile } from './types';

/**
 * Парсер конфигураций SSH из YAML файлов
 */
export class ConfigParser {
    private workspaceRoot: string;
    private configPath: string;

    constructor(workspaceRoot: string) {
        this.workspaceRoot = workspaceRoot;
        this.configPath = path.join(workspaceRoot, 'secrets', '.ssh');
    }

    /**
     * Загружает все конфигурации SSH из папки secrets/.ssh/
     * @returns Массив конфигураций SSH
     */
    public async loadAllConfigs(): Promise<SSHConfig[]> {
        const configs: SSHConfig[] = [];

        // Проверяем существование папки
        if (!fs.existsSync(this.configPath)) {
            throw new Error(
                `SSH configurations folder not found: ${this.configPath}. ` +
                `Please create 'secrets/.ssh/' directory in your workspace root and add YAML configuration files.`
            );
        }

        // Читаем все YAML файлы из папки
        const files = fs.readdirSync(this.configPath);
        const yamlFiles = files.filter(file =>
            file.endsWith('.yaml') || file.endsWith('.yml')
        );

        if (yamlFiles.length === 0) {
            throw new Error(
                `No YAML configuration files found in ${this.configPath}. ` +
                `Please add at least one .yaml or .yml file with SSH connection configurations.`
            );
        }

        // Парсим каждый YAML файл
        for (const file of yamlFiles) {
            const filePath = path.join(this.configPath, file);
            try {
                const fileConfigs = await this.parseConfigFile(filePath);
                configs.push(...fileConfigs);
            } catch (error) {
                vscode.window.showErrorMessage(
                    `Error parsing ${file}: ${error instanceof Error ? error.message : String(error)}`
                );
            }
        }

        return configs;
    }

    /**
     * Парсит один YAML файл конфигурации
     * @param filePath Путь к YAML файлу
     * @returns Массив конфигураций из файла
     */
    private async parseConfigFile(filePath: string): Promise<SSHConfig[]> {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const parsed = yaml.load(fileContent) as SSHConfigFile;

        // Валидация структуры
        if (!parsed || typeof parsed !== 'object') {
            throw new Error(`Invalid YAML structure in ${path.basename(filePath)}`);
        }

        if (!parsed.connections || !Array.isArray(parsed.connections)) {
            throw new Error(
                `Missing or invalid 'connections' array in ${path.basename(filePath)}. ` +
                `Expected format: { connections: [...] }`
            );
        }

        // Валидация каждой конфигурации
        const configs: SSHConfig[] = [];
        for (let i = 0; i < parsed.connections.length; i++) {
            const conn = parsed.connections[i];
            this.validateConfig(conn, filePath, i);
            configs.push(conn);
        }

        return configs;
    }

    /**
     * Валидирует конфигурацию SSH
     * @param config Конфигурация для валидации
     * @param filePath Путь к файлу (для сообщений об ошибках)
     * @param index Индекс в массиве (для сообщений об ошибках)
     */
    private validateConfig(config: any, filePath: string, index: number): void {
        const fileName = path.basename(filePath);

        // Проверка обязательных полей
        if (!config.name || typeof config.name !== 'string') {
            throw new Error(
                `Connection #${index + 1} in ${fileName}: 'name' field is required and must be a string`
            );
        }

        if (!config.host || typeof config.host !== 'string') {
            throw new Error(
                `Connection '${config.name}' in ${fileName}: 'host' field is required and must be a string`
            );
        }

        if (!config.username || typeof config.username !== 'string') {
            throw new Error(
                `Connection '${config.name}' in ${fileName}: 'username' field is required and must be a string`
            );
        }

        // Проверка опциональных полей
        if (config.port !== undefined && (typeof config.port !== 'number' || config.port <= 0 || config.port > 65535)) {
            throw new Error(
                `Connection '${config.name}' in ${fileName}: 'port' must be a number between 1 and 65535`
            );
        }

        if (config.privateKeyPath !== undefined && typeof config.privateKeyPath !== 'string') {
            throw new Error(
                `Connection '${config.name}' in ${fileName}: 'privateKeyPath' must be a string`
            );
        }

        if (config.passwordRef !== undefined && typeof config.passwordRef !== 'string') {
            throw new Error(
                `Connection '${config.name}' in ${fileName}: 'passwordRef' must be a string`
            );
        }
    }

    /**
     * Находит конфигурацию по имени
     * @param connectionName Имя подключения
     * @returns Конфигурация SSH или undefined если не найдена
     */
    public async findConfigByName(connectionName: string): Promise<SSHConfig | undefined> {
        const configs = await this.loadAllConfigs();
        return configs.find(c => c.name === connectionName);
    }

    /**
     * Возвращает список всех доступных имен подключений
     * @returns Массив имен подключений
     */
    public async getAvailableConnections(): Promise<string[]> {
        const configs = await this.loadAllConfigs();
        return configs.map(c => c.name);
    }
}
