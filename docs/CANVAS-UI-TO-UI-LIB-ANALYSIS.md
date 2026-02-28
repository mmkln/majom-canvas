# Аналіз: що з `features/canvas/ui` варто винести в `ui-lib`

## Короткий висновок

У `canvas/ui` вже є шар досить універсальних примітивів (кнопки, інпути, дропдауни, segmented control, поля форми), які фактично дублюють роль `ui-lib` і мають потенціал для повторного використання в інших фічах. Саме вони мають бути **першою хвилею міграції**.

Другим етапом можна винести складені, але все ще доменно-нейтральні патерни: керування floating/popover поведінкою, generic single-select групи, статусний селектор у вигляді абстрактного step/select контролу.

Чисто canvas-специфічні речі (контекстне меню для елементів canvas, мінікарта, drag&drop-пікери сутностей з прив’язкою до координат сцени) краще залишати в модулі canvas.

## Пріоритезація на винесення

### P0 — винести першими (висока цінність, низький ризик)

1. **HUD primitives як дизайн-системний набір**
   - `HudButtonBase`, `HudTextButton`, `HudIconButton` — спільна логіка loading/disabled/state для кнопок.
   - `HudInput`, `HudTextInputControl`, `HudField`, `HudFormMessage` — типовий формовий стек.
   - `HudDropdown`, `HudDropdownItem`, `HudSurface`, `HudDivider`, `HudSegmentedControl` — базові composable UI-блоки.
   - `hudClassNames.ts` — централізовані токени/класи стилю HUD.

**Чому:** це фундаментальні універсальні building blocks без прив’язки до canvas-домену.

### P1 — винести після стабілізації примітивів

2. **`FloatingMenuController` як утиліту поведінки**
   - Незалежна логіка закриття оверлею по outside click/Escape, яку використовує dropdown.

3. **`SingleSelectGroup` як generic-компонент**
   - Працює з generic типом, має інжектовані стилі та render-функції.
   - Може бути базою для сегментованих та pill-груп у різних модулях.

4. **Частини `StatusSelector` (абстрагована форма)**
   - Як reusable “stepper + dropdown selector”, якщо винести canvas-специфічні `ElementStatus`/іконки/лейбли через конфіг.

### P2 — опційно, якщо є запит від інших модулів

5. **Каркас модалок (`ModalFactory`)**
   - Базовий shell для модального контейнера та дій.
   - Лише якщо буде уніфікація з `ui-lib` `Modal` і потрібна єдина API.

6. **`NotificationContainer` (після відв’язки від canvas-стріму)**
   - Може стати адаптером до загального toast/notification сервісу.

## Що залишити в `features/canvas/ui`

- `ContextMenu`, `SelectionActionMenu`, `RelatedItemsPicker`, `StatusPicker` — жорстко пов’язані зі сценою, selection та canvas-командами.
- `MiniMap`, `CanvasNavigationDock`, `CanvasControls`, `Toolbar`, `ZoomIndicator`, `UndoRedoControls` — спеціалізована навігація/керування canvas.
- `ExistingEntityPicker` і похідні (`ExistingTask/Goal/StoryPicker`) — доменний drag&drop-потік зі сценою, координатами та canvas-інтеграціями.
- `EditElementModal` та confirm-модалки для canvas сутностей — доменний UX.

## Де вже видно перетин із `ui-lib`

- У `ui-lib` уже існують `Button`, `Input`, `Modal`, `Notification`, `SearchSelect`, `Select`, `Textarea`.
- У canvas-пакеті є паралельний набір `Hud*` компонентів для тих самих базових задач.

Це означає, що доцільно не просто “переносити файли”, а зробити **консолідацію API** з чіткою базою на `Hud*`:

1. **Зафіксувати HUD як основу**: у конфліктах/дублюванні саме `Hud*` реалізації є джерелом правди.
2. Існуючі перетини в `ui-lib` (`Button`, `Input`, `Modal`, `Notification`, `Select`, `SearchSelect`, `Textarea`) **замінювати на HUD-реалізації** або їх API/поведінку.
3. Підтягнути відсутні можливості в загальний шар (loading-state кнопок, формові повідомлення, сегментований контрол, поведінка dropdown/floating).
4. Дати адаптерний шар у canvas, щоб міграція була поступовою.

## Рекомендований план міграції

1. **Стандартизувати API в `ui-lib` на основі HUD**
   - Додати/уніфікувати пропси для loading-state, tone/variant, розмірів, доступності так, як це реалізовано в `Hud*`.
2. **Замінити перетинні компоненти `ui-lib` HUD-реалізаціями**
   - Для `Button`/`Input`/`Select`/`SearchSelect`/`Modal`/`Notification` пріоритет — перенесення поведінки й стилів з `Hud*`.
3. **Після перенесення прибрати префікс `Hud`/`HUD` у назвах**
   - Наприклад: `HudTextButton` → `TextButton`, `HudInput` → `Input`, `HudDropdown` → `Dropdown`, `HUD_*_CLASS` → `*_CLASS`.
4. **Зробити canvas-адаптери**
   - Тимчасові thin wrappers у `features/canvas/ui/primitives` з реекспортом з `ui-lib`.
5. **Поступово замінити імпорти у canvas/ui**
   - Почати з форм/кнопок/простих меню, потім складніші контроли.
6. **Прибрати дублікати і стабілізувати тему/токени**
   - Перенести `hudClassNames` у загальний шар і депрефіксувати константи після стабілізації API.

## Цільовий неймінг після міграції (без `Hud`/`HUD`)

- Компоненти: `TextButton`, `IconButton`, `Input`, `TextInputControl`, `Field`, `FormMessage`, `Dropdown`, `DropdownItem`, `SegmentedControl`, `Surface`, `Divider`.
- Базові класи/токени: без `HUD_` префікса, у єдиному стилі іменування `ui-lib`.
- Перехідний період: дозволені alias-експорти (`HudTextButton` → `TextButton`) для сумісності, з подальшим видаленням.

## Ризики

- Роз’їзд стилів між HUD та поточними `ui-lib` компонентами.
- Ламання UX через різну поведінку focus/hover/loading.
- Надмірне “узагальнення” canvas-специфічних контролів, які краще залишити локальними.

## Практичний список кандидатів на винесення

- `src/features/canvas/ui/primitives/HudButtonBase.ts`
- `src/features/canvas/ui/primitives/HudTextButton.ts`
- `src/features/canvas/ui/primitives/HudIconButton.ts`
- `src/features/canvas/ui/primitives/HudInput.ts`
- `src/features/canvas/ui/primitives/HudTextInputControl.ts`
- `src/features/canvas/ui/primitives/HudField.ts`
- `src/features/canvas/ui/primitives/HudFormMessage.ts`
- `src/features/canvas/ui/primitives/HudDropdown.ts`
- `src/features/canvas/ui/primitives/HudDropdownItem.ts`
- `src/features/canvas/ui/primitives/HudSegmentedControl.ts`
- `src/features/canvas/ui/primitives/HudSurface.ts`
- `src/features/canvas/ui/primitives/HudDivider.ts`
- `src/features/canvas/ui/primitives/FloatingMenuController.ts`
- `src/features/canvas/ui/components/SingleSelectGroup.ts`
