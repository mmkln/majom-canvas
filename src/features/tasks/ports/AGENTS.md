# Tasks Ports Rules

## Scope

- Owns neutral interfaces that connect shared task UI/domain contracts to consuming workspace stores or adapters.
- Ports define what task UI needs, not how a specific feature stores or fetches data.

## Allowed Content

- Interfaces such as `TaskEditPort`, `TaskLoader`, `TaskSaver`, and task search/link ports when they become shared across consumers.
- Typed request/response contracts expressed in terms of `features/tasks/domain` models.

## Forbidden Content

- No concrete HTTP clients.
- No `TasksApiService` construction.
- No imports from Flows, Boards, Canvas, Focus Board, or Canvas Core.
- No DOM or UI component code.

## Design Guidance

- Prefer callback-shaped ports first:

```ts
type SaveTaskPatch = (patch: TaskEditPatch) => Promise<TaskEditModel | void>;
```

- Introduce named port interfaces only when multiple callbacks start traveling together across consumers.
- Keep workspace-specific decisions, such as optimistic updates or Canvas command history, outside the shared port implementation.
