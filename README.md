# ERA2 — Очередь генераций

Экран «Очередь генераций» для ERA2 — агрегатора нейросетей. Реализован по ТЗ и макетам Figma, строго по Feature-Sliced Design.

## Запуск

```bash
npm run dev      # http://localhost:8080
```

Перейти на `/queue` чтобы открыть экран очереди.

---

## Архитектурные решения

### Роутинг

Используется собственный `RouterProvider` из `@/shared/routing` (history API + кастомный `era2:navigation` event). React-router не подключался — он не присутствует в проекте. Маршрут `/queue` добавлен как запись в объект `routes` в `src/app/router/index.tsx`.

### localStorage-стратегия

- Ключ хранения: `era2_queue`
- Состояние очереди сохраняется после каждого dispatch при `initStatus === 'ready'`
- Поле `_failAtProgress` (внутреннее для движка) **не сохраняется** — strip'ится перед записью
- При восстановлении: задачи со статусом `running` **переводятся в `queued`**

  *Обоснование*: задача с прогрессом 64% была обработана где-то на сервере (или в предыдущей сессии движка). При перезагрузке страницы этот «сервер» перезапустился — нет смысла продолжать с неизвестного места. Задача снова встаёт в очередь и получит новый слот честно. Прогресс при этом **сохраняется** как есть — пользователь видит, что задача была почти готова.

### Единый источник правды

`QueueProvider` монтируется один раз в `App.tsx`, оборачивая весь `Layout`. Страница `/queue` и `GenerationStatusBar` читают **один и тот же** `QueueContext` через `useQueue()`. Дублирования состояния нет.

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

Это гарантирует ровно 15% задач с ошибкой, независимо от типа и скорости генерации. Без этого подхода per-tick вероятность была бы нестабильной: 6% для text, 22% для video.

---

## Структура новых файлов

```
src/
├─ entities/generation-task/          # типы + seed 10 задач
├─ features/generation-queue/
│  ├─ model/
│  │  ├─ queueReducer.ts             # конечный автомат, все actions
│  │  ├─ queueEngine.ts              # MAX_CONCURRENT=2, тики, cleanup
│  │  ├─ QueueProvider.tsx           # Context + useReducer + localStorage
│  │  ├─ selectors.ts                # фильтрация, сортировка, счётчики
│  │  └─ useQueue.ts                 # публичный хук с Undo-toast
│  └─ ui/
│     ├─ GenerationStatusBar.tsx     # глобальный плавающий индикатор
│     ├─ QueueStats.tsx              # 4 счётчика
│     ├─ QueueToolbar.tsx            # фильтры + сортировка + поиск
│     ├─ TaskRow.tsx / TaskCard.tsx  # desktop/mobile вид задачи
│     └─ states/                     # loading / empty / error
├─ widgets/generation-queue/
│  └─ ui/GenerationQueue.tsx         # сборка экрана
└─ pages/QueuePage.tsx
```

---

## Реализованные бонусы

| Фича | Описание |
|------|----------|
| **Undo** | «Очистить готовые» показывает sonner toast с кнопкой «Отменить» (5 сек) |
| **framer-motion** | `AnimatePresence` на строках списка (появление/удаление) и на status bar |
| **prefers-reduced-motion** | `motion-safe:transition-*` в `ProgressBar.tsx` |
| **Фильтр по типу** | Вторая строка чипов: Текст / Изображение / Видео / Аудио |
| **Collapsed status bar** | Кнопка `×` сворачивает виджет в пилюлю, клик разворачивает |
| **aria-label** | На всех кнопках действий в `TaskActions.tsx` |

---

## Шрифт

Используется **Geist** (подключён через `@fontsource-variable/geist`) и **Geist Mono** для числовых значений. Оба уже были в проекте.
