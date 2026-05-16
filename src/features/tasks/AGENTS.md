# Tasks Shared Feature Rules

## Scope

- Owns reusable task-domain UI and contracts that are shared across workspaces such as Flows, Canvas, Boards, Focus Board, and future task surfaces.
- Treat this module as a shared product feature, not as a generic UI library and not as a page/workspace implementation.
- `src/ui-lib/src` remains the owner of generic primitives. This module composes those primitives into task-aware components.

## Dependency Direction

- Allowed: workspace features import from `src/features/tasks`.
- Allowed: `src/features/tasks` imports from `src/ui-lib/src`, app/runtime types, i18n contracts, and neutral task/domain interfaces.
- Forbidden: `src/features/tasks` importing from `src/features/flows`, `src/features/boards`, `src/features/focus-board`, `src/features/canvas`, or `src/features/canvas-core`.
- Forbidden: shared task UI importing concrete stores, scene objects, history services, or concrete API services.

## Directory Map

- `domain/`: task edit/read models, patch contracts, normalization helpers, and pure task-domain rules.
- `data/`: optional API-backed adapters and API payload mapping helpers for shared task ports.
- `ui/`: reusable task-aware UI components/controllers such as a task edit modal.
- `ports/`: interfaces/callback contracts that consumers implement to load, save, or search task data.

## Architecture Rules

1. Keep shared task components workspace-agnostic. They should receive task data and callbacks/ports through typed options.
2. Keep persistence in the consuming feature store or adapter. The shared component can call `onSave`, but it must not decide which endpoint or store owns the request.
3. Keep Canvas-specific behavior in Canvas adapters. Do not move `Scene`, `TaskElement`, `historyService`, or canvas commands into this module.
4. Keep Flow-specific behavior in Flows. For example, Flows decides whether a completed task disappears from an open-task column.
5. Prefer small contracts first. Add broader task module services only after at least two consumers need the same behavior.

## Expected Pattern

```txt
features/flows  -> features/tasks -> ui-lib
features/canvas -> features/tasks -> ui-lib
features/boards -> features/tasks -> ui-lib
```

Not:

```txt
features/flows -> features/canvas
features/boards -> features/flows
features/tasks -> concrete workspace stores
```
