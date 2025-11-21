/**
 * Конфигурация SSH подключения из YAML файла
 */
export interface SSHConfig {
    /** Имя подключения для идентификации */
    name: string;
    /** Адрес хоста (IP или доменное имя) */
    host: string;
    /** Порт SSH (по умолчанию 22) */
    port?: number;
    /** Имя пользователя для подключения */
    username: string;
    /** Путь к приватному ключу SSH (опционально) */
    privateKeyPath?: string;
    /** Ссылка на пароль в SecretStorage (опционально) */
    passwordRef?: string;
}

/**
 * Корневая структура YAML файла конфигурации
 */
export interface SSHConfigFile {
    /** Массив конфигураций подключений */
    connections: SSHConfig[];
}

/**
 * Активное SSH подключение
 */
export interface SSHConnection {
    /** Имя подключения */
    name: string;
    /** Конфигурация подключения */
    config: SSHConfig;
    /** SSH клиент из библиотеки ssh2 */
    client: any; // ssh2.Client
    /** Подключен ли клиент */
    connected: boolean;
    /** Время последнего использования */
    lastUsed: Date;
}

/**
 * Параметры для инструмента ssh_connect
 */
export interface SSHConnectParameters {
    /** Имя подключения из конфигурации */
    connectionName: string;
}

/**
 * Параметры для инструмента ssh_execute
 */
export interface SSHExecuteParameters {
    /** Имя активного подключения */
    connectionName: string;
    /** Команда для выполнения */
    command: string;
}

/**
 * Параметры для инструмента ssh_disconnect
 */
export interface SSHDisconnectParameters {
    /** Имя подключения для отключения */
    connectionName: string;
}

/**
 * Результат выполнения SSH команды
 */
export interface SSHCommandResult {
    /** Стандартный вывод */
    stdout: string;
    /** Вывод ошибок */
    stderr: string;
    /** Код выхода команды */
    exitCode: number;
}
