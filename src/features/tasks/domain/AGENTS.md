# Tasks Domain Rules

## Scope

- Owns shared task-domain contracts that can be used by multiple workspaces.
- Keep files in this directory pure and deterministic.

## Allowed Content

- `TaskEditModel`, `TaskEditPatch`, task summary/list models, capability flags, and pure normalization helpers.
- Mapping helpers only when both input and output types are neutral shared contracts.
- Domain rules that do not touch DOM, browser APIs, stores, HTTP clients, or workspace runtime classes.

## Forbidden Content

- No DOM creation.
- No `ui-lib` imports.
- No API service imports.
- No imports from Flows, Boards, Focus Board, Canvas, or Canvas Core.
- No runtime side effects or global events.

## Design Guidance

- Prefer the smallest shared contract that supports the current consumers.
- Do not mirror the full backend `PlatformTask` shape unless a component genuinely needs every field.
- Keep patch contracts partial and explicit so consumers can decide how to persist unchanged fields.
