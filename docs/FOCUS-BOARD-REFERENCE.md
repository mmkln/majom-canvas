# Focus Board Reference

## Status

- State: reference baseline
- Created: 2026-04-17
- Source: user-provided single-file HTML prototype
- Intended use: UX and behavior reference for later implementation inside the app

## Why This Document Exists

This document captures the product behavior, layout model, and interaction rules of the provided `Focus Board` prototype so future implementation work can reuse one stable reference instead of re-reading raw inline HTML/JS.

This is not a production architecture proposal by itself. It is a translation of the prototype into an implementation-oriented reference.

## Product Intent

`Focus Board` is a short-cycle planning board for managing a variable planning horizon of `3-7 days` with three coupled layers:

1. cycle-level direction,
2. day-level focus,
3. routine habit execution.

The prototype is designed to reduce planning overhead by keeping the visible scope intentionally small:

- one active cycle,
- a variable number of day columns within the selected cycle,
- one daily focus task,
- a lightweight backlog,
- reusable global habits checked per day.

## Core UX Promise

The screen should answer these questions quickly:

- What is the goal of the current cycle?
- What is the focus of each day in that cycle?
- Which task is the main task for a given day?
- Which habits were completed for that day?
- What is still unassigned in the backlog?

## Main Screen Structure

The page is a single workspace composed of five main surfaces:

1. top header,
2. horizontal multi-day board,
3. right-side backlog drawer,
4. modal stack for configuration,
5. bottom sheet for daily habits.

### 1. Header

Header responsibilities:

- brand label: `Focus Board`,
- open cycle/goal settings,
- open global habit manager,
- open/close backlog sidebar,
- show backlog count badge.

The header is intentionally light and secondary. The primary work happens in the board below it.

### 2. Main Board

The board is a horizontally scrollable row of day columns.

Each column represents one day in the current cycle and contains:

- day label: `День N`,
- formatted date,
- incomplete task counter,
- editable daily goal input,
- habit stack widget,
- dedicated focus-task slot,
- regular task list,
- inline input for adding a task.

The board width is dynamic and depends on cycle length.

### 3. Backlog Sidebar

The backlog is a right-side drawer for tasks not currently assigned to any day.

Backlog responsibilities:

- show all unassigned tasks,
- allow task completion toggle,
- accept dragged tasks from day columns,
- return tasks to visible planning flow when dragged into a day.

### 4. Modal Layer

The prototype uses centered modal overlays for:

- cycle goal and cycle length settings,
- global habit management.

### 5. Habit Day Sheet

The prototype uses a mobile-style bottom sheet for per-day habit completion.

This sheet is opened from a specific day column and shows:

- progress summary for that day,
- complete list of global habits,
- toggles for marking habits done for the selected day.

## Domain Model

The prototype keeps all state in one in-memory object:

```ts
state = {
  goal: string,
  cycleLength: number,
  tempCycleLength: number,
  habits: Array<{
    id: number,
    text: string,
    color: string,
    icon: string
  }>,
  habitChecks: Record<dayIndex, Record<habitId, boolean>>,
  dailyGoals: Record<dayIndex, string>,
  days: Record<dayIndex, Task[]>,
  backlog: Task[]
}
```

Task shape:

```ts
type Task = {
  id: number
  text: string
  completed: boolean
  isFocus: boolean
}
```

## State Semantics

### Cycle-level state

- `goal` stores the cycle-wide intent.
- `cycleLength` controls how many day columns exist on the board.
- `tempCycleLength` is a draft value used in the cycle settings modal before save.

### Habit state

- `habits` is a global catalog shared across all days.
- `habitChecks[day][habitId]` stores completion per day, not globally.
- habits have visual metadata (`color`, `icon`) as part of the reference behavior.

### Daily planning state

- `dailyGoals[day]` is a short text describing that day's focus.
- `days[day]` stores tasks assigned to that day.
- one task may be marked `isFocus = true`.

### Backlog state

- `backlog` stores tasks outside the current daily allocation.
- backlog tasks do not carry focus status.

## Core Invariants

These are the main behavioral rules visible in the prototype and should be preserved unless intentionally redesigned.

### Cycle length invariant

- allowed cycle length options are `3`, `4`, `5`, `6`, `7` days.

### Focus task invariant

- each day can have at most one focus task.
- the focus task is rendered separately above the regular task list.
- when the first task is added to an empty day, it becomes the focus task automatically.
- when a focus task is moved away from a day and other tasks remain, the first remaining task is promoted to focus.
- tasks dragged into backlog lose focus status.

### Habit ownership invariant

- habits are defined globally,
- completion is tracked per day,
- editing the global habit list affects every day column and every habit sheet.

### Backlog invariant

- backlog is a holding area, not a separate day.
- tasks in backlog are renderable and completable, but they are not eligible for a focus slot until dropped into a day.

## Rendering Model

The prototype uses imperative full-surface rerenders for each area.

Main rendering entry points:

- `initBoard()` rebuilds the day columns according to current cycle length.
- `renderTasks(day)` renders one day's focus task and non-focus tasks.
- `renderHabitStack(dayIndex)` renders compact habit summary for a day.
- `renderBacklog()` renders the sidebar task list and badge.
- `renderGlobalHabits()` renders the habit manager list.
- `openHabitSheet(dayIndex)` renders the full habit checklist for one day.

## Interaction Reference

### Board initialization

Function: `initBoard()`

Expected behavior:

- clear the existing board container,
- generate one column per cycle day,
- calculate displayed dates starting from `today`,
- inject all day-level UI,
- render habits and tasks for each day,
- recreate icons after render.

### Editing daily goal

Function: `updateDailyGoal(day, val)`

Expected behavior:

- save the text for the given day,
- commit on input blur rather than on explicit save button.

### Adding a task

Function: `handleInput(e, listId)`

Trigger:

- pressing `Enter` in the day input field with non-empty text.

Expected behavior:

- create a new task,
- append it to `state.days[listId]`,
- mark it as focus if the day was empty,
- clear the input,
- rerender that day.

### Toggling task completion

Function: `toggleTask(listId, taskId)`

Expected behavior:

- invert `completed`,
- rerender the corresponding source list,
- support both day columns and backlog.

The prototype does not remove or reorder completed tasks automatically.

### Drag and drop

Functions:

- `handleDragStart(e, id, src)`
- `handleDragOver(e)`
- `handleDragLeave(e)`
- `handleDrop(e, targetId)`

Expected behavior:

- tasks can move between days and backlog,
- a drop target highlights during drag-over,
- dropping into the same source does nothing,
- moving a focus task away promotes a new focus task in the source day if tasks remain,
- dropping into a day makes the task focus only if that day has no tasks yet,
- dropping into backlog clears focus,
- affected source and target surfaces rerender after the move.

### Backlog open/close

Function: `toggleBacklog()`

Expected behavior:

- sidebar slides in from the right,
- backlog contents render when opened,
- badge shows current task count.

### Habit stack interaction

Function: `openHabitSheet(dayIndex)`

Expected behavior:

- open the bottom sheet for the selected day,
- calculate and display `done/total`,
- render the full list of global habits,
- reflect current checked state for that day.

### Habit completion in sheet

Function: `toggleHabitInSheet(habitId)`

Expected behavior:

- toggle one habit for `activeSheetDay`,
- rerender the sheet,
- rerender that day's compact habit stack summary.

### Global habit management

Functions:

- `renderGlobalHabits()`
- `addHabit()`
- `removeHabit(id)`

Expected behavior:

- modal lists all global habits,
- a new habit can be added via text input,
- removing a habit updates the global catalog,
- after add/remove the board is rebuilt so all day widgets reflect the new habit set.

The prototype assigns default visual metadata to newly created habits:

- color: `bg-indigo-400`
- icon: `circle`

### Cycle settings

Functions:

- `openGoalModal()`
- `renderCycleSelector()`
- `setTempCycle(num)`
- `saveGoalAndCycle()`

Expected behavior:

- modal opens with current goal and current cycle length,
- cycle options are fixed buttons from `3` to `7`,
- selection is staged in temporary state,
- save commits both goal and cycle length,
- board is rebuilt after save.

## Visual and Interaction Language

The prototype has a clear visual direction that should be treated as part of the reference.

### Mood

- calm,
- light,
- spacious,
- low-friction,
- focused on clarity instead of density.

### Design characteristics

- soft gray background,
- white or very light column surfaces,
- large rounded corners,
- subtle borders,
- indigo as the main action/focus accent,
- colored circular habit markers,
- lightweight shadows for elevated controls,
- restrained motion and transitions.

### Special visual signals

- focus task uses an animated ring effect,
- active cycle selection button uses stronger indigo styling,
- drag-over target changes background and border color,
- bottom sheet uses slide-up motion,
- modal overlays use blur and opacity transitions.

## Screen-by-Screen Reference

### Day Column

A day column combines four layers of intent:

1. date context,
2. one-line daily goal,
3. habit completion summary,
4. task execution list.

This combination is the main product idea of the prototype.

The daily goal is intentionally lightweight. It is not a formal task and does not compete visually with the focus task.

### Focus Task Zone

The focus task is separated from the rest of the task list. This is not merely a styled first card. It has a dedicated rendering zone and should remain conceptually distinct in implementation.

### Habit Stack Widget

The compact habit card is not just a shortcut button. It serves as a daily health indicator.

It shows:

- a small label,
- up to four overlapping habit icons,
- a numeric progress summary.

### Backlog Drawer

The backlog is secondary, hidden by default, and opened on demand.

This reinforces the board as the main execution surface, while still keeping overflow visible and recoverable.

## Behavior Gaps In The Prototype

These behaviors are absent or only implicit in the raw prototype and should be resolved explicitly during implementation.

### Persistence

- all data is in-memory only,
- reload loses all state.

### Validation

- no duplicate prevention for habits,
- no task text validation beyond trimming,
- no cycle reduction safeguards when tasks exist outside the new visible range.

### Accessibility

- inline `onclick` handlers only,
- no keyboard drag-and-drop alternative,
- no explicit ARIA semantics for dialogs, drawers, or bottom sheet,
- no focus management for overlays,
- no escape-key handling.

### Ordering semantics

- tasks append to the end of a list,
- no manual reordering within the same day,
- drop target supports moving across lists but not precise insertion positions.

## Implementation Translation Notes

When this prototype is implemented in the app, preserve the behavior contract but not the single-file architecture.

### Preserve

- short-cycle board model,
- one dedicated focus task per day,
- daily goal input separate from task list,
- global habits with per-day checks,
- hidden backlog drawer,
- modal for cycle settings,
- bottom sheet for daily habit completion.

### Re-architect

- replace global mutable object with feature-owned state,
- replace inline DOM handlers with typed UI/controller bindings,
- formalize entities and IDs,
- separate render concerns from domain state,
- add persistence and hydration,
- define explicit overlay ownership and cleanup,
- add accessibility and keyboard support.

## Recommended App-Level Domain Mapping

If this concept is carried into the main app, the cleanest conceptual mapping is:

- `Cycle`
  - id
  - title or goal
  - lengthDays
  - startDate

- `CycleDay`
  - cycleId
  - dayIndex
  - date
  - dailyGoal

- `CycleTask`
  - id
  - cycleId
  - dayIndex | null
  - title
  - completed
  - isFocus
  - order

- `HabitDefinition`
  - id
  - title
  - colorToken
  - iconName

- `HabitCheck`
  - habitId
  - cycleId
  - dayIndex
  - completed

This preserves the prototype semantics while making persistence and app integration feasible.

## Acceptance Reference For Future Implementation

An implementation based on this reference should satisfy at least the following:

1. user can set a cycle goal and choose a cycle length from 3-7 days;
2. board regenerates to reflect the active cycle length;
3. each day shows date, daily goal, habits summary, focus task slot, and task list;
4. first task in an empty day becomes that day's focus task;
5. focus reassignment happens correctly when the focus task is moved away;
6. tasks can move between days and backlog;
7. habits are globally managed but checked per day;
8. compact habit summary and detailed habit sheet stay in sync;
9. backlog count stays accurate;
10. visual hierarchy keeps cycle, day focus, and task focus clearly distinct.

## Reference Boundary

This document should be used as:

- a UX reference,
- a behavior contract,
- a state-model baseline,
- a decomposition aid before implementation.

It should not be used as:

- a final production architecture,
- a final accessibility model,
- a final persistence contract,
- a direct instruction to reproduce the prototype's raw inline JavaScript structure.
