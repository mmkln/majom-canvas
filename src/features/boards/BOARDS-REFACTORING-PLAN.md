# Boards Refactoring Plan

## Purpose

This plan defines an incremental refactoring path for the Boards feature.
The goal is not to redesign the product UI, but to replace the current fragile
implementation shape with explicit state owners, command lifecycle boundaries,
and stable rendering roots.

The current implementation has grown around one large view and one broad store.
That made small interaction changes risky because rendering, modal sessions,
optimistic mutations, backend orchestration, import/export workflows, and
transient UI state are coupled inside the same runtime path.

## Current Architecture Problems

### BoardsView is a God object

`src/features/boards/ui/BoardsView.ts` owns too many responsibilities:

- board, list, and card rendering;
- board picker state;
- popover lifecycle;
- card details modal state;
- checklist loading and checklist mutations;
- card entity link workflows;
- import/export modal state machine;
- drag/drop bridge behavior;
- local inline edit state;
- notification and error presentation;
- full-page rerender recovery.

This makes the view a workflow owner instead of a renderer.

### Mutation handlers do not expose command results

Most mutation handlers return `void`, and `BoardsApp` intentionally discards
store mutation promises with `void store...`.

That means modal/session code cannot reliably know whether a command succeeded,
failed, was rolled back, or is still pending.

### Store mixes data state with command orchestration

`BoardsStore` owns confirmed board data and optimistic projection, which is
correct, but it also owns much of the backend mutation lifecycle. The result is
that command status, reload behavior, optimistic confirmation, and error
handling are all coupled to the data store.

### Full root rerender destroys interaction surfaces

`BoardsView.render(...)` rerenders the board root with `replaceChildren(...)`
and then manually restores selected transient state such as scroll, board
picker, and card modal. This creates a repeated pattern of capture/close/reopen
workarounds.

### Card details has split state ownership

Card title/description draft state now has a dedicated session model, but
checklists, entity-link refresh, hidden checked items, expanded composers, and
backend-only detail loading still live in `BoardsView`.

This is still not a single owner for the card details workflow.

### Cross-domain use cases live in the composition root

Creating or deleting Task/Story/Goal entities from cards is currently wired in
`BoardsApp`. That file should be a composition root, not a use-case
implementation layer.

## Target Architecture

```text
BoardsApp
  wires dependencies only

BoardsRuntime
  owns feature controllers, subscriptions, and view-model composition

BoardsStore
  owns confirmed board data, selected board state, optimistic projection,
  and temp-to-real reconciliation

BoardsCommandService
  owns mutations, backend calls, optimistic confirm/reject, reload policy,
  and command results

BoardSurfaceController
  owns board-surface interaction state such as quick editor, inline edits,
  surface scroll, and drag/drop bridge state

CardDetailsController
  owns the full card details workflow: open session, draft, dirty fields,
  checklists, entity links, pending submit, backend-only loading, errors,
  and temp-to-real migration

ImportExportController
  owns import/export modal workflow state, preview/apply/export lifecycle,
  stale preview handling, and errors

BoardsView
  renders view models and forwards UI events to controllers
```

## State Ownership Rules

### BoardsStore

Owns:

- confirmed boards snapshot;
- selected board id;
- load/query status;
- optimistic mutation list;
- projected boards;
- optimistic entity state;
- temp-to-real reconciliation map.

Does not own:

- DOM state;
- modal draft state;
- command-specific UI recovery;
- import/export modal workflow;
- checklist panel view state;
- cross-domain entity creation workflows.

### BoardsCommandService

Owns:

- all board/card/list/checklist/entity-link mutations;
- backend calls;
- optimistic mutation registration;
- optimistic confirmation/rejection;
- reload policy;
- command result mapping;
- command status registry.

Does not own:

- DOM rendering;
- card details draft fields;
- transient picker/popover state.

### CardDetailsController

Owns:

- open/close card details session;
- temp and real card identity;
- base/draft/dirty field state;
- queued submit before backend confirmation;
- checklist panel state;
- checklist mutation lifecycle;
- card entity link action lifecycle;
- backend-only detail load status;
- modal-level recoverable errors.

Does not own:

- board list rendering;
- global board query state;
- API services directly, except through `BoardsCommandService` ports.

### BoardsView

Owns:

- DOM mounting;
- rendering view models;
- local event listeners that forward intents.

Does not own:

- command lifecycle;
- backend request state;
- optimistic confirmation logic;
- draft merge rules;
- cross-domain workflows;
- import/export workflow state machines.

## Core Contracts

### Command Result

Every mutation command should return a typed result.

```ts
export type BoardsCommandResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: BoardsCommandError };

export type BoardsCommandError = {
  code: string;
  messageKey: string;
  recoverable: boolean;
};
```

Controllers may keep local state after a recoverable failure. For example, card
details must keep the user draft if card save fails.

### Command Status Registry

Global `status: 'saving'` is not enough for concurrent actions.

The command layer should track running commands by id and kind.

```ts
export type BoardsCommandRecord = {
  id: string;
  kind: BoardsCommandKind;
  status: 'running' | 'confirmed' | 'rejected';
  optimisticMutationId?: string;
  error?: BoardsCommandError;
};
```

The UI can derive global busy state from the registry without lying when one
command finishes while another is still running.

### Optimistic Resolution

Temp-to-real reconciliation should be explicit.

```ts
export type BoardsOptimisticResolution = {
  cards?: Record<Card['id'], Card['id']>;
  placements?: Record<CardPlacement['id'], CardPlacement['id']>;
  columns?: Record<BoardColumn['id'], BoardColumn['id']>;
};
```

This resolution belongs in `BoardsStore` state, but it should have a lifecycle
policy. It should not grow forever.

## Rendering Root Strategy

Replace one destructive root render with stable roots:

```html
<div data-boards-root>
  <div data-boards-surface-root></div>
  <div data-boards-overlay-root></div>
  <div data-boards-modal-root></div>
</div>
```

The board surface can rerender from board data. Overlay and modal controllers
should not be destroyed by a board snapshot update.

This removes the need for repeated "capture, close, rerender, restore" code.

## Migration Plan

### Implementation Status

Status after the incremental refactoring pass:

- Phase 1 completed: mutation handlers expose typed command results and card
  details keeps recoverable user state on failed commands.
- Phase 2 completed for board/list/card mutations: `BoardsCommandService` owns
  optimistic command orchestration and command status. Checklist and card
  entity-link detail actions currently flow through `CardDetailsController`
  ports backed by `BoardsStore`; moving those into the command service remains a
  follow-up if command telemetry must cover them uniformly.
- Phase 3 completed: `CardDetailsController` owns card details draft,
  unresolved temp-card reconciliation, queued submit, checklists, entity links,
  and modal-level recoverable errors. `CardDetailsSessionController` remains as
  a small internal draft/identity helper used by `CardDetailsController`.
- Phase 4 completed: stable surface, overlay, and modal roots prevent unrelated
  board data updates from destroying modals and popovers.
- Phase 5 completed: `ImportExportController` owns import/export workflow
  state and `BoardsImportExportModals` owns the import/export modal DOM.
- Phase 6 completed: `BoardSurfaceController` owns board-surface drafts,
  quick-editor state, render transition policy, and typed drag/drop intents;
  `BoardsScrollCoordinator` owns DOM scroll capture/restore.
- Phase 7 completed: `BoardsEntityLinkUseCases` owns cross-domain Task/Story/
  Goal creation/deletion orchestration; `BoardsApp` wires ports and handlers.

Known follow-ups:

- `BoardsRuntime` from the target architecture has not been introduced. The
  current composition still happens in `BoardsApp` and `BoardsView`
  constructor wiring. Add it only if another controller family needs shared
  lifecycle/view-model composition.
- `BoardsView` is still large because it renders the complete board and card
  details DOM. Further reduction should split renderer modules, not reintroduce
  workflow state into render helpers.
- Checklist and card entity-link mutation telemetry is controller-owned rather
  than command-registry-owned. Promote it into `BoardsCommandService` only when
  the UI needs one unified command registry for those operations.

### Phase 1: Command Contract

Goal: make mutation success/failure observable to controllers.

Changes:

- Add `BoardsCommandResult` and `BoardsCommandError` types.
- Change mutation entries in `BoardsIntentHandlers` from `void` to
  `BoardsIntentResult<BoardsCommandResult>`.
- Update `BoardsApp` handlers so they return command results instead of
  discarding promises.
- Keep current store internals during this phase.
- Update card details save so it closes only after a successful result.

Tests:

- card details keeps draft open when patch fails;
- card details closes after successful patch;
- checklist save shows modal-level error on failed command;
- no mutation handler used by `BoardsView` returns raw `void`.

Exit criteria:

- UI/session code can distinguish success from recoverable failure.
- Store no longer silently hides command failure from callers.

### Phase 2: BoardsCommandService

Goal: move mutation orchestration out of `BoardsStore`.

Changes:

- Add `src/features/boards/state/BoardsCommandService.ts`.
- Move create/update/delete/move commands from `BoardsStore` into the command
  service.
- Keep `BoardsStore` responsible for state transitions:
  `applyOptimistic`, `confirmOptimistic`, `rejectOptimistic`, `reload`.
- Add command registry and command ids.
- Keep optimistic projection domain helpers pure.

Tests:

- optimistic create card confirms temp-to-real ids;
- failed optimistic create rejects mutation and returns command error;
- parallel commands keep busy state until all commands settle;
- reload after command preserves selected board.

Exit criteria:

- `BoardsStore` no longer owns backend mutation orchestration.
- All board mutations flow through `BoardsCommandService`.

### Phase 3: CardDetailsController

Goal: make card details a single workflow owner.

Changes:

- Replace `CardDetailsSessionController` with or wrap it in a fuller
  `CardDetailsController`.
- Move checklist panel state from `BoardsView` into the controller.
- Move checklist load/save lifecycle into the controller.
- Move card details entity-link refresh behavior into the controller.
- Expose `CardDetailsViewModel`.
- Keep backend-only actions disabled while card identity is unresolved.

Tests:

- temp card details open without backend-only load;
- temp card resolves to real id without dropping dirty draft;
- queued save executes against real id;
- checklist load failure renders checklist error state;
- checklist mutation failure keeps previous checklist state;
- entity-link creation refreshes details without forcing modal reset.

Exit criteria:

- `BoardsView` has no checklist panel state fields.
- `BoardsView` does not call checklist APIs through handlers directly.
- Card details can be tested without DOM for core workflow behavior.

### Phase 4: Stable Rendering Roots

Goal: stop destroying overlays and modals on every board data update.

Changes:

- Add explicit surface, overlay, and modal roots.
- Move card details rendering into a dedicated modal root.
- Move board picker and other transient overlays into the overlay root.
- Rerender board surface independently from modal state.
- Remove manual modal reopen logic after board rerender.

Tests:

- board data update does not recreate an open card details modal;
- scroll is preserved without global capture/restore workaround for modal
  updates;
- board picker state survives unrelated board data updates when appropriate;
- drag/drop cleanup still happens on surface rerender.

Exit criteria:

- `BoardsView.render(...)` no longer closes all transient surfaces by default.
- Modal lifecycle is controlled by modal controllers, not board snapshot render.

### Phase 5: ImportExportController

Goal: remove import/export workflow state machine from `BoardsView`.

Changes:

- Add `ImportExportController`.
- Move source text, format, policies, preview/apply state, stale preview state,
  and export output state into the controller.
- Add `ImportExportView` or a feature-local renderer.
- Keep import/export parsing and planning in existing exchange modules.

Tests:

- preview success moves to review mode;
- source edit marks preview stale;
- apply disabled when preview cannot apply;
- apply failure keeps modal open with recoverable error;
- export failure does not mutate board state.

Exit criteria:

- `BoardsView` no longer contains import/export modal state machine functions.

### Phase 6: BoardSurfaceController

Goal: isolate board surface interaction state.

Changes:

- Add `BoardSurfaceController`.
- Move quick card editor state, inline board/list edit state, card composer
  state, and surface-level scroll concerns into the controller.
- Keep drag/drop gesture internals in existing drag controllers, but route their
  effects through the surface controller and command service.
- Expose `BoardSurfaceViewModel`.

Tests:

- quick editor survives unrelated board metadata update when appropriate;
- inline title edit does not reset on unrelated store emissions;
- card/list drag emits semantic targets through command service;
- composer state is scoped to the selected board/list.

Exit criteria:

- `BoardsView` no longer owns surface interaction state fields.

### Phase 7: Cross-Domain Use Cases

Goal: move Task/Story/Goal orchestration out of `BoardsApp`.

Changes:

- Add a Boards application service or use-case module for card entity creation
  and linked entity deletion.
- Inject Task/Story/Goal API ports into that service.
- Return `BoardsCommandResult` from cross-domain operations.

Tests:

- create task from card links created task to card;
- create story/goal from card maps title and description correctly;
- linked entity delete failure returns recoverable command error;
- BoardsApp only wires dependencies.

Exit criteria:

- `BoardsApp` contains dependency construction and subscription cleanup only.

## Testing Strategy

Prefer pure tests for state and workflow logic:

- `domain/*` tests for pure reducers and projection helpers;
- `state/*` tests for command lifecycle and controllers;
- focused `ui/*` tests only for DOM integration and accessibility-relevant
  behavior.

Do not add tests that assert only class names, markup shape, or visual styling.

Required regression coverage:

- optimistic create card shows immediately;
- temp card details opens without backend-only API calls;
- temp-to-real reconciliation keeps card details open;
- dirty card details draft survives backend reload;
- queued save uses real card id;
- command failure keeps recoverable user state;
- parallel commands do not incorrectly report idle state;
- modal roots are not destroyed by board surface rerenders.

## Rollout Rules

- Do not mix multiple phases in one broad patch unless the current phase cannot
  be completed safely without the next one.
- Each phase must leave the app in a working state.
- Keep existing UI behavior unless a phase explicitly changes the interaction
  contract.
- Add or keep regression tests for the behavior that motivated the refactor.
- Do not introduce a generic framework before at least two Boards workflows need
  the same abstraction.

## Success Criteria

The refactor is successful when:

- mutation handlers no longer return raw `void`;
- `BoardsStore` owns data/projection state, not command orchestration;
- command lifecycle is typed and testable;
- card details has one owner for draft, checklists, entity links, and pending
  commands;
- board surface rerenders do not destroy modal and overlay roots;
- `BoardsApp` is a composition root only;
- `BoardsView.ts` is substantially smaller and primarily renders view models;
- workflow tests can be written mostly without DOM.
