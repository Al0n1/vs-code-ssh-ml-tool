# SSH ML Tool

Расширение VS Code для подключения к удаленным машинам через SSH для LM агентов (Language Model агентов).

## 🚀 Возможности

- **SSH подключения для LM агентов**: Позволяет AI агентам подключаться к удаленным серверам через SSH
- **Language Model Tools API**: Полная интеграция с VS Code AI extensibility
- **Безопасное хранение паролей**: Использует VS Code SecretStorage для безопасного хранения паролей
- **Гибкая аутентификация**: Поддержка SSH ключей (по умолчанию `~/.ssh/id_rsa`) и паролей
- **YAML конфигурации**: Простые и понятные конфигурационные файлы

## 📦 Установка

1. Скопируйте расширение в папку расширений VS Code или установите через `.vsix` файл
2. Откройте ваш проект в VS Code
3. Создайте папку `secrets/.ssh/` в корне проекта
4. Добавьте YAML файлы с конфигурациями SSH подключений

## ⚙️ Конфигурация

### Структура папок

```
ваш-проект/
├── secrets/
│   └── .ssh/
│       ├── production.yaml
│       ├── development.yaml
│       └── staging.yaml
└── ... (остальные файлы проекта)
```

**⚠️ ВАЖНО**: Папка `secrets/` автоматически добавлена в `.gitignore` и не должна попадать в git!

### Формат YAML конфигурации

Создайте файл (например `secrets/.ssh/servers.yaml`):

```yaml
connections:
  - name: "production-server"
    host: "192.168.1.100"
    port: 22  # опционально, по умолчанию 22
    username: "admin"
    # Вариант 1: Использовать приватный ключ
    privateKeyPath: "~/.ssh/id_rsa_prod"
    
  - name: "development-machine"
    host: "dev.example.com"
    username: "developer"
    # Вариант 2: Использовать пароль (будет запрошен и сохранен безопасно)
    passwordRef: "dev-password"
    
  - name: "staging-server"
    host: "staging.example.com"
    port: 2222
    username: "deployer"
    # Вариант 3: Использовать дефолтный ключ ~/.ssh/id_rsa (ничего не указывать)
```

### Поля конфигурации

| Поле | Обязательно | Описание |
|------|-------------|----------|
| `name` | ✅ Да | Уникальное имя подключения для идентификации |
| `host` | ✅ Да | IP адрес или доменное имя сервера |
| `username` | ✅ Да | Имя пользователя для SSH подключения |
| `port` | ❌ Нет | Порт SSH (по умолчанию 22) |
| `privateKeyPath` | ❌ Нет | Путь к приватному SSH ключу |
| `passwordRef` | ❌ Нет | Ссылка для сохранения пароля в SecretStorage |

### Приоритет аутентификации

1. **privateKeyPath** - если указан, используется этот ключ
2. **~/.ssh/id_rsa** - если не указан privateKeyPath, пробуем дефолтный ключ
3. **passwordRef** - если нет ключей, запрашиваем пароль у пользователя

## 🤖 Использование с LM агентами

Расширение предоставляет три Language Model Tools для AI агентов:

### 1. `ssh_connect` - Подключение к серверу

Устанавливает SSH подключение к удаленному серверу.

**Параметры:**

- `connectionName` (string) - Имя подключения из YAML конфигурации

**Пример использования LM агентом:**

```
Подключись к production-server используя ssh_connect с connectionName="production-server"
```

### 2. `ssh_execute` - Выполнение команды

Выполняет команду на удаленном сервере через установленное SSH подключение.

**Параметры:**

- `connectionName` (string) - Имя активного подключения
- `command` (string) - Команда для выполнения

**Пример использования LM агентом:**

```
Выполни команду "ls -la /var/www" на production-server используя ssh_execute
```

### 3. `ssh_disconnect` - Отключение от сервера

Завершает SSH подключение и освобождает ресурсы.

**Параметры:**

- `connectionName` (string) - Имя подключения для отключения

**Пример использования LM агентом:**

```
Отключись от production-server используя ssh_disconnect
```

## 📝 Примеры сценариев

### Пример 1: Проверка статуса сервера

```
LM Agent: Подключаюсь к production-server...
Tool: ssh_connect { connectionName: "production-server" }
Result: ✅ Successfully connected

LM Agent: Проверяю использование диска...
Tool: ssh_execute { connectionName: "production-server", command: "df -h" }
Result: 
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1        50G   20G   30G  40% /

LM Agent: Отключаюсь...
Tool: ssh_disconnect { connectionName: "production-server" }
Result: ✅ Successfully disconnected
```

### Пример 2: Развертывание приложения

```
LM Agent: Подключаюсь к staging-server...
Tool: ssh_connect { connectionName: "staging-server" }

LM Agent: Перехожу в директорию проекта и обновляю код...
Tool: ssh_execute { 
  connectionName: "staging-server", 
  command: "cd /var/www/app && git pull origin main" 
}

LM Agent: Перезапускаю сервис...
Tool: ssh_execute { 
  connectionName: "staging-server", 
  command: "sudo systemctl restart app.service" 
}

LM Agent: Проверяю статус...
Tool: ssh_execute { 
  connectionName: "staging-server", 
  command: "sudo systemctl status app.service" 
}
```

## 🔒 Безопасность

- **Пароли** хранятся в VS Code SecretStorage (системная keychain)
- **Папка secrets/** включена в `.gitignore` и не попадет в репозиторий
- **SSH ключи** рекомендуются вместо паролей для продакшн окружений
- **Подтверждение** требуется перед выполнением каждой команды (можно отключить для доверенных инструментов)

## 🛠️ Разработка

### Требования

- Node.js >= 18
- npm >= 9
- VS Code >= 1.85.0

### Установка зависимостей

```bash
npm install
```

### Компиляция

```bash
npm run compile
```

### Режим watch

```bash
npm run watch
```

### Запуск в режиме разработки

1. Откройте проект в VS Code
2. Нажмите `F5` для запуска Extension Development Host
3. В новом окне откройте проект с `secrets/.ssh/` конфигурациями

## 📄 Лицензия

MIT

## 🤝 Вклад

Приветствуются pull requests и issue reports!

## 📞 Поддержка

При возникновении проблем создайте issue в репозитории проекта.

---

**Примечание**: Это расширение разработано для использования с Language Model агентами в VS Code и требует VS Code версии 1.85.0 или выше с поддержкой Language Model Tools API.
