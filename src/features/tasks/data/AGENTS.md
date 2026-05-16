# Tasks Data Adapter Rules

## Scope

- Owns reusable adapters that connect shared task-domain ports to platform API services.
- Keep these adapters optional: workspace stores may still implement ports directly when they need local optimistic updates or workspace-specific side effects.

## Allowed Content

- Mapping helpers between `TaskEditPatch` and platform API payloads.
- API-backed implementations of task edit/relation catalog ports.
- Imports from `src/majom-wrapper/data-access` and neutral task domain/port contracts.

## Forbidden Content

- No DOM or UI component code.
- No imports from Flows, Boards, Focus Board, Canvas, or Canvas Core.
- No workspace-specific state updates, command history, drag/drop behavior, or local view-model mutation.

## Design Guidance

- Keep adapters thin and replaceable.
- If a workspace must update its own projection after save, let that workspace store own persistence and reuse only the shared mapping helpers.
