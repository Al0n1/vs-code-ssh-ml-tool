# Быстрый старт: SSH ML Tool

## ⚠️ Требования

- **VS Code 1.95.0 или новее** (для Language Model Tools API)
- Node.js 16+
- SSH доступ к удаленным серверам

Проверьте версию VS Code: `Help > About` или `code --version`

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

#### Способ 1: Явное указание инструментов (рекомендуется)

В VS Code откройте Copilot Chat и используйте инструменты напрямую:

```
#ssh_connect с connectionName "test-server"
```

```
#ssh_execute с connectionName "test-server" и command "whoami"
```

```
#ssh_disconnect с connectionName "test-server"
```

#### Способ 2: Естественный язык с упоминанием инструментов

```
Используй #ssh_connect для подключения к test-server, затем выполни команду whoami
```

#### Способ 3: Через контекстное меню

1. Откройте Copilot Chat
2. Нажмите кнопку "+" (Attach context)
3. Выберите "Tools" в выпадающем меню
4. Выберите нужные SSH инструменты
5. Задайте вопрос естественным языком

**Важно**: Инструменты называются `ssh_connect`, `ssh_execute` и `ssh_disconnect` (с подчеркиванием, а не дефисом)

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

## 🧪 Тестирование

### Способ 1: Через команды VS Code (прямое тестирование)

1. Нажмите `Ctrl+Shift+P` (Command Palette)
2. Выберите `SSH ML Tool: Test Connection`
3. Выберите сервер из списка
4. Для выполнения команд: `SSH ML Tool: Execute Command`

**Это самый надежный способ проверить, что расширение работает!**

### Способ 2: Через Copilot Chat (требует VS Code 1.95.0+)

#### Тест 1: Подключение

```text
#ssh_connect {"connectionName": "test-server"}
```

#### Тест 2: Выполнение команды

```text
#ssh_execute {"connectionName": "test-server", "command": "whoami"}
```

#### Тест 3: Отключение

```text
#ssh_disconnect {"connectionName": "test-server"}
```

### Способ 3: Естественный язык с явным указанием инструментов

```text
Используй #ssh_connect для подключения к test-server, затем #ssh_execute чтобы выполнить команду "ls -la"
```

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
