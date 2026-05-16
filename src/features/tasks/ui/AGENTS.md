# Tasks UI Rules

## Scope

- Owns reusable task-aware UI components and lifecycle-heavy controllers.
- Build on top of `src/ui-lib/src` primitives and HUD controls.

## Component Rules

1. Components in this directory may know task-domain concepts such as title, description, status, priority, due date, and completion state.
2. Components must not know which workspace opened them.
3. Components must not import concrete stores, API services, Canvas scene/runtime classes, or workspace modules.
4. Components should expose typed callbacks/ports such as `onSave`, `onCancel`, `onClose`, and optional `loadTask`.
5. Components may own local draft state, validation state, dirty-state tracking, focus management, and modal cleanup.
6. Components should return patches, not perform persistence.

## Styling Rules

- Reuse `ui-lib` modal shells, buttons, fields, dropdowns, segmented controls, form messages, and notification primitives.
- Put repeated task-specific class recipes in a local `task*Styles.ts` file.
- Do not duplicate large class strings inside business logic branches.

## Modal Guidance

- A reusable task edit modal should be workspace-agnostic.
- Unsaved changes guards belong in the modal/controller because they protect local draft state.
- Save/loading/error lifecycle belongs to the modal UI, but the actual request belongs to the consumer-provided callback.
- If a consumer needs full task data, support lazy loading through an injected port/callback rather than expanding every task list projection.
