# ERA2 — Очередь генераций

Экран «Очередь генераций» для ERA2 — агрегатора нейросетей. Реализован по ТЗ и макетам Figma, строго по Feature-Sliced Design.

## Запуск

```bash
npm run dev      # http://localhost:8080
```

Перейти на `/queue` через пункт «Очередь» в левом сайдбаре или напрямую в адресной строке.

---

## Архитектурные решения

### Роутинг

Используется собственный `RouterProvider` из `@/shared/routing` (history API + кастомный `era2:navigation` event). React-router не подключался — он не присутствует в проекте. Маршрут `/queue` добавлен как запись в объект `routes` в `src/app/router/index.tsx`.

### localStorage-стратегия

- Ключ хранения: `era2_queue`
- Состояние очереди сохраняется после каждого dispatch при `initStatus === 'ready'`
- Поле `_failAtProgress` (внутреннее для движка) **не сохраняется** — стрипится перед записью
- При восстановлении: задачи со статусом `running` **переводятся в `queued`**

  *Обоснование:* задача с прогрессом 64% была обработана в предыдущей сессии. При перезагрузке страницы движок перезапустился — нет смысла продолжать с неизвестного места. Задача снова встаёт в очередь честно. Прогресс при этом **сохраняется** — пользователь видит, что задача была почти готова.

### Единый источник правды

`QueueProvider` монтируется один раз в `App.tsx`, оборачивая весь `Layout`. Страница `/queue`, `GenerationStatusBar` и `QueueNavBadge` читают **один и тот же** `QueueContext` через `useQueue()`. Дублирования состояния нет.

### Движок без stale closure

В `QueueProvider` создаётся `stateRef = useRef(state)`, который синхронно обновляется после каждого рендера:

```ts
useEffect(() => { stateRef.current = state }, [state])
```

Движок (`queueEngine`) принимает этот `stateRef` вместо замыкания на state — это гарантирует, что в каждом тике движок читает актуальное состояние очереди.

### Вероятность сбоев — ровно 15%

При запуске каждой задачи (`START_TASK`) движок один раз бросает монету:

```ts
const failAtProgress = Math.random() < 0.15
  ? randomBetween(20, 80)   // задача упадёт на этом % прогресса
  : undefined
```

Это гарантирует ровно 15% задач с ошибкой, независимо от типа и скорости генерации.

### Повторная инициализация (retryInit)

При ошибке инициализации `ErrorState` показывает кнопку «Повторить». Нажатие вызывает `retryInit()` из `useQueue`, который через `QueueProvider.retryInit` инкрементирует `initKey`. Эффект инициализации зависит от `[initKey]` — это перезапускает весь цикл: `RESET_INIT → 600ms → INIT`. Движок перезапускается автоматически когда `initStatus` становится `'ready'`.

### queuePosition всегда актуален

`queuePosition` не хранится постоянно в reducer. При каждом рендере `QueueProvider` вызывает `selectTasksWithPositions(tasks)`, который сортирует задачи в статусе `queued` по `createdAt` и присваивает позиции 1..N. Все компоненты получают актуальные позиции без дополнительных action.

### Status bar — только в чате

`GenerationStatusBar` монтируется исключительно в `TextPage` (страница `/text`). Он рендерится как `absolute bottom-full` над панелью ввода — визуально это «над вводом», чистый контекст страницы. Контекст читается из того же `QueueContext` через `useQueue()`.

---

## Структура файлов

```
src/
├─ entities/generation-task/          # типы + seed 10 задач
├─ features/generation-queue/
│  ├─ model/
│  │  ├─ queueReducer.ts             # конечный автомат, все actions
│  │  ├─ queueEngine.ts              # MAX_CONCURRENT=2, тики, cleanup
│  │  ├─ QueueProvider.tsx           # Context + useReducer + localStorage
│  │  ├─ selectors.ts                # фильтрация, сортировка, queuePosition
│  │  └─ useQueue.ts                 # публичный хук с Undo-toast, enqueueFromChat
│  ├─ ui/
│  │  ├─ GenerationStatusBar.tsx     # floating-индикатор (только /text)
│  │  ├─ QueueStats.tsx              # 4 счётчика
│  │  ├─ QueueToolbar.tsx            # фильтры + сортировка + поиск
│  │  ├─ TaskRow.tsx / TaskCard.tsx  # desktop/mobile вид задачи
│  │  └─ states/                     # loading / empty / error
│  └─ index.ts                       # весь публичный API слайса
├─ widgets/
│  ├─ generation-queue/
│  │  └─ ui/GenerationQueue.tsx      # сборка экрана (только публичный API)
│  └─ navigation/
│     └─ ui/QueueNavBadge.tsx        # пункт сайдбара с live-счётчиком
└─ pages/QueuePage.tsx               # тонкая страница: title + виджет
```

**Правила импортов:**
- Widget импортирует только через `@/features/generation-queue` (публичный API) — deep-import запрещён
- Pages могут импортировать из features и widgets — соответствует FSD
- Sidebar использует `QueueNavBadge` (изолированный компонент), а не `useQueue` напрямую

---

## Реализованные бонусы

| Фича | Описание |
|------|----------|
| **Undo** | «Очистить готовые» — sonner toast с кнопкой «Отменить» (5 сек) |
| **framer-motion** | `AnimatePresence` на строках списка и на status bar |
| **prefers-reduced-motion** | `motion-safe:transition-*` в `ProgressBar.tsx` |
| **Фильтр по типу** | Чипы: Текст / Изображение / Видео / Аудио |
| **Collapsed status bar** | Chevron сворачивает виджет в pill, клик разворачивает |
| **aria-label** | На кнопках действий, progress bar (aria-valuenow/min/max), badge |
| **queuePosition** | Пересчёт позиции в очереди в реальном времени через selector |
| **enqueueFromChat** | Каждое отправленное в чате сообщение создаёт задачу в очереди |
| **QueueNavBadge** | Оранжевый live-счётчик активных генераций в сайдбаре |
| **DEV-only кнопка** | Кнопка «Тест» для добавления задач скрыта в production (`import.meta.env.DEV`) |

---

## Шрифт

Используется **Geist** (подключён через `@fontsource-variable/geist`) и **Geist Mono** для числовых значений. Оба уже были в проекте.
