# Передача проекта Backend разработчику

## Что подготовлено

✅ **Полная OpenAPI документация** - `API_DOCUMENTATION.md`
- Описание всех endpoint'ов
- Схемы данных и модели
- Примеры запросов и ответов
- Коды ошибок и их обработка

✅ **Готовый API клиент** - `src/services/apiService.ts`
- Axios конфигурация
- Автоматическое добавление токенов
- Обработка ошибок
- Методы для всех API операций

✅ **Хуки для React компонентов** - `src/hooks/apiHooks.ts`
- `useApiData` - загрузка данных
- `useApiMutation` - отправка данных
- `usePagination` - работа с пагинацией
- `useVKAuth` - VK аутентификация
- `useForm` - работа с формами

✅ **Утилиты для работы с данными** - `src/utils/storage.ts`
- LocalStorage обертки
- Кэширование данных
- Валидация файлов
- Утилиты для дат

✅ **Конфигурация API** - `src/config/api.ts`
- Endpoints константы
- Настройки пагинации
- Feature flags
- Таймауты и настройки

✅ **Интеграция в существующий код**
- Все API вызовы добавлены в AppStore
- Компоненты подготовлены к работе с API
- Весь код **закомментирован** до готовности backend

## Структура файлов

```
src/
├── services/
│   └── apiService.ts          # Основной API клиент
├── hooks/
│   └── apiHooks.ts           # React хуки для API
├── utils/
│   └── storage.ts            # Утилиты для хранения
├── config/
│   └── api.ts               # Конфигурация API
├── examples/
│   └── apiUsageExamples.tsx  # Примеры использования
└── stores/
    └── AppStore.ts          # Интеграция в основной стор

API_DOCUMENTATION.md         # Полная документация API
BACKEND_REQUIREMENTS.md      # Требования для backend
BACKEND_INTEGRATION.md       # Инструкции по активации
.env.example                # Пример переменных окружения
```

## Для Backend разработчика

### 1. Начните с изучения документации
- `API_DOCUMENTATION.md` - полное описание API
- `BACKEND_REQUIREMENTS.md` - краткие требования

### 2. Основные endpoint'ы для реализации

#### Приоритет 1 (MVP):
- `POST /auth/vk-login` - авторизация
- `GET /users/me` - профиль пользователя
- `GET|POST|PUT|DELETE /exercises` - управление упражнениями
- `GET|POST|PUT|DELETE /workouts` - управление тренировками

#### Приоритет 2:
- `POST /exercises/:id/media` - загрузка медиа
- `POST /workouts/:id/complete` - завершение тренировки
- `GET /calendar` - календарь
- `GET /statistics/me` - статистика

### 3. Тестирование API
Используйте примеры из документации для проверки endpoint'ов:

```bash
# Пример теста авторизации
curl -X POST https://your-backend.com/api/v1/auth/vk-login \
  -H "Content-Type: application/json" \
  -d '{
    "vk_user_id": 123456,
    "vk_access_token": "token",
    "user_info": {
      "first_name": "Иван",
      "last_name": "Петров"
    }
  }'
```

## Для Frontend разработчика

### Когда backend будет готов:

1. **Обновите переменные окружения:**
```bash
# .env
VITE_API_URL=https://your-real-backend.com/api/v1
VITE_VK_APP_ID=your_real_vk_app_id
```

2. **Активируйте API интеграцию:**
```typescript
// src/config/api.ts
export const FEATURE_FLAGS = {
  USE_BACKEND_API: true, // Изменить на true
}
```

3. **Раскомментируйте код поэтапно:**
   - Сначала импорты и базовые методы
   - Затем CRUD операции
   - Наконец дополнительные функции

4. **Протестируйте основные сценарии:**
   - Авторизация пользователя
   - Создание/редактирование упражнений
   - Создание/редактирование тренировок
   - Загрузка списков данных

### Пример активации одного метода:

```typescript
// Было (закомментировано):
// const response = await apiService.createExercise(exerciseData);
// this.exercises.push(response.data.exercise);

// Стало (активировано):
const response = await apiService.createExercise(exerciseData);
this.exercises.push(response.data.exercise);

// Удалить временную реализацию:
// const newExercise = { ...exerciseData, id: Date.now().toString() };
// this.exercises.push(newExercise);
```

## Контрольный список готовности

### Backend:
- [ ] Реализованы основные endpoint'ы
- [ ] Настроена авторизация через VK
- [ ] Добавлена валидация данных
- [ ] Настроен CORS для VK домена
- [ ] Протестированы API методы

### Frontend:
- [ ] Обновлены переменные окружения
- [ ] Включен флаг `USE_BACKEND_API`
- [ ] Раскомментирован код интеграции
- [ ] Протестированы основные функции
- [ ] Обработаны ошибки API

## Поддержка

При возникновении вопросов:
1. Проверьте документацию в `API_DOCUMENTATION.md`
2. Посмотрите примеры в `src/examples/`
3. Изучите готовые методы в `src/services/apiService.ts`

---

**Успешной интеграции! 🚀**
