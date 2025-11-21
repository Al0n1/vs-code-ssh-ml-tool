# Быстрый старт: SSH ML Tool

## 🚀 Запуск расширения

### 1. Установка и компиляция (уже выполнено)

```bash
npm install
npm run compile
```

### 2. Тестирование в режиме разработки

1. Откройте этот проект в VS Code
2. Нажмите `F5` или выберите `Run > Start Debugging`
3. Откроется новое окно VS Code (Extension Development Host)
4. В новом окне откройте любой проект с папкой `secrets/.ssh/`

### 3. Создание тестовой конфигурации

В вашем рабочем проекте (не в проекте расширения):

```bash
# Создайте структуру папок
mkdir -p secrets/.ssh

# Скопируйте пример конфигурации
cp /путь/к/расширению/secrets/.ssh/example.yaml ./secrets/.ssh/my-servers.yaml

# Отредактируйте конфигурацию
nano ./secrets/.ssh/my-servers.yaml
```

Пример минимальной конфигурации:

```yaml
connections:
  - name: "test-server"
    host: "localhost"
    username: "your-username"
    # По умолчанию будет использован ~/.ssh/id_rsa
```

### 4. Использование с LM агентом

В VS Code откройте Copilot Chat и попробуйте:

```
@workspace Подключись к test-server через SSH и выполни команду "whoami"
```

Расширение автоматически предоставит три инструмента:

- `#ssh-connect` - для подключения
- `#ssh-execute` - для выполнения команд
- `#ssh-disconnect` - для отключения

## 📦 Сборка .vsix пакета для установки

```bash
# Установите vsce глобально (если еще не установлен)
npm install -g @vscode/vsce

# Соберите пакет
vsce package

# Установите в VS Code
code --install-extension ssh-ml-tool-0.1.0.vsix
```

## 🔍 Отладка

### Просмотр логов расширения

1. В Extension Development Host откройте: `View > Output`
2. Выберите "Extension Host" из выпадающего списка
3. Смотрите логи активации и работы расширения

### Проверка регистрации инструментов

После активации расширения в логах должно появиться:

```
SSH ML Tool extension is now active
SSH ML Tool: All tools registered successfully
```

### Типичные проблемы

1. **"No workspace folder opened"**
   - Откройте папку с проектом (`File > Open Folder`)

2. **"SSH configurations folder not found"**
   - Создайте папку `secrets/.ssh/` в корне проекта
   - Добавьте хотя бы один YAML файл с конфигурациями

3. **"No authentication method available"**
   - Убедитесь что существует `~/.ssh/id_rsa` ИЛИ
   - Укажите `privateKeyPath` в конфигурации ИЛИ
   - Добавьте `passwordRef` для ввода пароля

## 🧪 Тестирование инструментов

### Тест 1: Подключение

```
LM Agent: используй ssh_connect с параметром:
{
  "connectionName": "test-server"
}
```

Ожидаемый результат: Успешное подключение

### Тест 2: Выполнение команды

```
LM Agent: используй ssh_execute с параметрами:
{
  "connectionName": "test-server",
  "command": "echo 'Hello from SSH!'"
}
```

Ожидаемый результат: Вывод команды в ответе

### Тест 3: Отключение

```
LM Agent: используй ssh_disconnect с параметром:
{
  "connectionName": "test-server"
}
```

Ожидаемый результат: Подтверждение отключения

## 📊 Структура проекта

```
ssh-ml-tool/
├── src/                      # Исходный код TypeScript
│   ├── extension.ts          # Точка входа расширения
│   ├── sshManager.ts         # Управление SSH подключениями
│   ├── configParser.ts       # Парсер YAML конфигураций
│   ├── secretsManager.ts     # Работа с VS Code SecretStorage
│   ├── types/
│   │   └── index.ts          # TypeScript типы и интерфейсы
│   └── tools/                # Language Model Tools
│       ├── sshConnectTool.ts
│       ├── sshExecuteTool.ts
│       └── sshDisconnectTool.ts
├── out/                      # Скомпилированный JavaScript
├── secrets/.ssh/             # Примеры конфигураций (не коммитится)
├── package.json              # Метаданные и зависимости
├── tsconfig.json             # Конфигурация TypeScript
├── README.md                 # Основная документация
├── QUICKSTART.md             # Этот файл
└── CHANGELOG.md              # История изменений
```

## 🛠️ Разработка

### Режим watch для автоматической перекомпиляции

```bash
npm run watch
```

После изменения кода нажмите `Ctrl+R` в Extension Development Host для перезагрузки.

### Lint проверка

```bash
npm run lint
```

## 📝 Следующие шаги

1. ✅ Расширение создано и работает
2. 📝 Создайте реальные SSH конфигурации в вашем проекте
3. 🧪 Протестируйте с Copilot Chat в agent mode
4. 🚀 Соберите .vsix и установите для постоянного использования
5. 📦 Опубликуйте в VS Code Marketplace (опционально)

## 💡 Полезные ссылки

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Language Model Tools API](https://code.visualstudio.com/api/extension-guides/ai/tools)
- [SSH2 Library](https://github.com/mscdex/ssh2)
- [js-yaml Library](https://github.com/nodeca/js-yaml)

---

**Готово к использованию!** 🎉

Теперь LM агенты могут подключаться к удаленным серверам через SSH прямо из VS Code.
