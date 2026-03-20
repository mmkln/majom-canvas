# Додавання нового елемента **Routine (Habit)** на Canvas

Цей документ описує, де саме в коді потрібно внести зміни, щоб додати новий тип елемента `RoutineElement` у Canvas (на рівні моделі, рендера, контекстного меню та інтеграції з existing-picker).

## API статус по routines

Так — API для routines/habits уже є в проєкті через `HabitsApiService` (wrapper над `/habits/`). Доступні операції:
- `getHabits`
- `createHabit`
- `patchHabit` / `patchHabitTitle`
- `archiveHabit`
- `deleteHabit`
- `toggleHabitCompletion`

Це означає, що для `RoutineElement` не потрібно вигадувати новий базовий API-клієнт — потрібно інтегрувати вже наявний сервіс у Canvas flow.

## Параметри рутини та поля модалок

За контрактом `Habit` у коді є поля:
- `id` (readonly)
- `title`
- `description`
- `created_at`
- `status`
- `last_checked`
- `is_due_today`
- `weekly_completions`
- `completions`

### Які поля додавати в **Create Routine** modal (MVP)
Обовʼязково:
1. `title` (required, trim, не порожній)

Опційно (але бажано одразу, якщо є місце в UI):
2. `description` (optional)
3. `status` (default = `Active`, можна заховати і не показувати в MVP)

Не потрібно вводити вручну в create form:
- `id`, `created_at`, `last_checked`, `is_due_today`, `weekly_completions`, `completions` — це серверні/обчислювані поля.

### Які поля додавати в **Edit Routine** modal (MVP)
Обовʼязково:
1. `title`

Опційно:
2. `description`
3. `status` (Active/Archived)

Не редагувати в modal:
- `id`, `created_at`, completion-масиви, `is_due_today`, `last_checked` (оновлюються через `toggleHabitCompletion`/backend логіку).

### Чому саме такий мінімум
- Поточний routines UI вже працює лише з назвою у create/edit flow.
- Це узгоджено з існуючими методами сервісу (`createHabit(title)`, `patchHabitTitle(...)`).
- Для Canvas MVP цього достатньо, а `description/status` можна відкрити наступною ітерацією без зламу API.

## Вибрана форма для RoutineElement

Обираємо форму: **коло (circle)** для `RoutineElement`.

### Чому саме так
- Це ваш явний продуктовий вибір: routine має бути візуально впізнаваною окремо від `Task/Story/Goal`.
- Коло максимально відрізняється від поточних card-like елементів і одразу читається як окремий тип сутності.
- У проєкті вже є базові приклади круглої геометрії (`Circle` shape), тому реалізація не є «з нуля».

### Базові візуальні параметри (MVP)
- `radius = 56` (діаметр `112`)
- `fill = #ECFDF3`
- `stroke = #22C55E`
- `lineWidth = 2`
- лейбл по центру: `Routine`/назва рутині (з truncation)

### Технічні нотатки для circle
- `contains(px, py)` має перевіряти відстань до центра (`dx*dx + dy*dy <= r*r`).
- `getBoundaryPoint(angle)` для зʼєднань: `x = cx + r*cos(angle)`, `y = cy + r*sin(angle)`.
- `getConnectionPoints()` для MVP: 4 точки (top/right/bottom/left), за потреби потім перейти на довільний кут.

> Наслідок вибору: circle складніше по текстовому layout, ніж прямокутник. Для MVP краще ліміт на 1–2 рядки назви + tooltip/деталі у modal.

## 1) Поточний стан (baseline)

Зараз Canvas працює з трьома planning-елементами:
- `GoalElement`
- `StoryElement`
- `TaskElement`

Створення елемента відбувається через `AddElementCommand`, а UI-точка входу для ручного створення — контекстне меню (`ContextMenu`).

## 2) Мінімальний план впровадження `RoutineElement`

### Крок A. Створити клас елемента

Створити файл `src/features/canvas/elements/RoutineElement.ts`:
- наслідувати від `PlanningElement`
- визначити `static width/height`
- реалізувати `draw`, `contains`, `getBoundaryPoint`, `getConnectionPoints`, `clone`
- додати рутинні поля (`backendId`, `uuid`, `title`, `status`), аналогічно `TaskElement`

Рекомендація: для MVP тримати circle-геометрію простою (радіус + 4 connection points) і не ускладнювати полігональними варіантами.

### Крок B. Розширити type-guards та місця, де перелічуються типи planning-елементів

Оновити перевірки `instanceof` у місцях, де зараз жорстко перераховані `Task/Story/Goal`, зокрема:
- `ContextMenu` (label, delete confirm key, actions)
- менеджери та сервіси Canvas, які працюють з planning-елементами

Практичне правило: всюди, де є патерн `element instanceof TaskElement || ...`, додати `RoutineElement` або винести у спільний guard.

### Крок C. Додати створення Routine через Context Menu

У `ContextMenu`:
- в секції **Add item** додати пункт `Routine`
- реалізувати `createRoutineAt(sceneX, sceneY)` через `historyService.execute(new AddElementCommand(...))`
- додати людські label-и (`Routine`) у методи на кшталт `getElementLabel`, `getElementConfirmKey`

### Крок D. Додати "existing routine" picker і сервіс

За аналогією з `AddExistingTaskService`:
1. Створити `AddExistingRoutineService`
2. Створити `ExistingRoutinePicker`
3. Зареєструвати новий drag kind у `existingPickerEvents`
4. Підключити обробку drop у `UIManager`
5. Додати secondary action у меню (`Find existing routine`)

### Крок E. Гідратація/збереження позицій (API шар)

Якщо routine має зберігатися в canvas layout як окремий тип:
- додати маппери (аналогічно task/story/goal mapper)
- оновити завантаження елементів у `CanvasApp`/репозиторій даних
- оновити payload запису позицій у Canvas API

Якщо routines поки не підтримуються бекендом Canvas layout:
- дозволити лише runtime-додавання без persistence
- явно позначити це feature-flag/коментарем, щоб уникнути «тихої» втрати даних

### Крок F. Тести

Мінімум:
- unit для `RoutineElement` (`contains`, `clone`)
- unit для `ContextMenu` (зʼявився пункт `Routine`)
- unit для `AddExistingRoutineService` (add-or-focus логіка)
- smoke-тест створення `Routine` через `AddElementCommand`

## 3) Стисла інтеграційна карта (де правити в першу чергу)

1. `src/features/canvas/elements/` — новий `RoutineElement`
2. `src/features/canvas/ui/ContextMenu.ts` — пункти меню + create handler
3. `src/features/canvas/ui/UIManager.ts` — existing-picker drag/drop
4. `src/features/canvas/core/services/` — `AddExistingRoutineService`
5. `src/features/canvas/ui/components/` — `ExistingRoutinePicker`
6. `src/features/canvas/ui/events/existingPickerEvents.ts` — новий `kind`
7. API маппінг/гідратація в Canvas data flow

## 4) Рекомендована послідовність delivery

1. `RoutineElement` + ручне створення з контекстного меню
2. Підтримка selection/edit/delete/focus/highlight
3. Existing routine picker (add/focus)
4. Persistence (тільки після узгодження контракту API)
5. Дотиснути тести

## 5) Ризики

- Пропустити одну з гілок `instanceof` і отримати «часткову» підтримку типу.
- Додати UI створення без persistence і втрачати елементи після reload.
- Невідповідність payload до бекенд-контракту для canvas positions.

## 6) Definition of Done

- `Routine` створюється з контекстного меню
- `Routine` виділяється, рухається, видаляється, копіюється/вставляється
- (опційно) додається як existing entity
- (опційно) коректно зберігається/відновлюється після reload
- тести зелені
