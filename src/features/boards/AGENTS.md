# Boards Feature

## Board Selection Session State

- Treat the selected board as tab/window-scoped runtime state owned by `BoardsStore`.
- Persist per-tab selected board restore through `sessionStorage`, so reload returns each tab to its own board without affecting other windows.
- Do not write routine board selection into `user.meta`; reserve profile-backed board defaults for an explicit user-facing default-board preference if one is introduced later.
- Resolve board selection through validated available boards: explicit runtime/preferred board first, then tab session board, then the first available board.
- Keep `BoardsView` free of selected-board persistence; it should emit selection intents and render store state only.
- Board picker chips are filters such as all/starred/recent, not duplicate board shortcuts.
- Read board picker filter metadata from `Board.meta` in the same guarded style as canvas metadata. Persist starred state as `meta.favorite` and recent selection as `meta.lastOpenedAt`; keep fallback reads for legacy boolean fields such as `favourite`/`starred` and date fields such as `lastActivityAt`, `last_activity_at`, `updatedAt`, `updated_at`, `createdAt`, or `created_at`.
- Persist board picker groups in `Board.meta` using the canvas-compatible shape `group: { id, name }` plus `groupId`, `groupName`, `group_id`, and `group_name` mirrors for tolerant reads.
- Keep persisted board picker metadata mutations in `BoardsStore`; `BoardsView` owns only transient picker UI state such as search text, active filter chip, and collapsed sections.

## Board Import And Export Exchange

- Keep board import/export parsing, serialization, preview planning, and future apply orchestration in `src/features/boards/exchange` plus `BoardsStore`; `BoardsView` should only collect user input, show preview/configuration, and emit intents.
- Treat Markdown import as partial and AI-editable: missing titles or fields should produce diagnostics and safe fallbacks instead of forcing the user to provide every parameter.
- Run import through a preview plan before any mutation. The plan must expose create/update/skip/conflict counts, diagnostics, paths, target ids when resolved, and whether apply is blocked.
- Apply import policies before mutation: `mode`, missing-field behavior, match strategy, and unknown-field strictness must be represented in typed exchange contracts.
- JSON import/export is the full-fidelity path; Markdown is tolerant and human/AI-friendly, with warnings when unsupported or unknown fields are skipped.
- Keep card data card-owned and placement/order column-owned. Do not make Markdown placement data create duplicate source cards unless the user-facing import policy explicitly chooses that behavior.

## Trello-Like Card Fronts

- Card fronts should open card details; do not place delete actions directly on the card front.
- Card labels use the shared backend `Tag` contract: read `card.tags`, persist card assignments with `card.tag_ids`.
- Reuse `TagPickerField` for card label selection and label editor screens; do not create a feature-local tag picker for Boards.
- Label title/color edits use the shared tag API callbacks, while card assignments save immediately through `card.tag_ids` PATCH requests.
- Save label changes through the existing card patch flow, not through a separate card-label state channel.
- If a card has a description, show only a compact description badge icon on the front, not the description text.
- If card comment metadata is available, show a compact comments badge icon with the count.
- Keep destructive card actions inside the card details modal or another explicit action surface.
- Do not show standalone explanatory mirroring text blocks in card details; expose mirroring as an action from the card details actions menu.
- Do not show disabled topbar actions such as Cover unless the action has a working flow.
- Mirroring may create more than one active placement for the same card in the same list. Show a warning if useful, but do not disable the mirror action for that case.
- Original/source card placements should look like normal cards. Do not add an "Original" badge or other source indicator to originals.
- Mirror placements should have a distinct card-front treatment and source location label using the source board/list metadata from the backend.
- Treat `mirror_source` as the only public mirror-placement marker. A placement with no `mirror_source` must render as a normal source card.
- Do not use `is_primary`, `is_mirror`, or `mirror_count` in the frontend contract; those are not public board-card response fields.
- Archive/remove semantics differ by placement context: source cards use the card archive/delete action, while mirror cards use placement removal and must not affect the source card.
- Card ordering is placement-owned. Frontend should send semantic placement targets (`before_placement`, `after_placement`, or `position`) instead of calculating or persisting numeric ranks. Backend owns the exact `pos` value and rebalance logic.
- Board, list, card, and card-placement public ids are UUID strings. Numeric database primary keys are backend-internal only; frontend code must not parse board entity ids with `Number(...)`.

## Card Checklists

- Treat checklists as card-owned execution details, not board-owned data, placement-owned data, task relations, or Focus Board items.
- Read card-front checklist badges from `card.checklist_summary`; do not include full checklist item payloads in board card fronts.
- Load full checklist data only for the card details surface through the card checklist API.
- Keep checklist mutations routed through `BoardsStore`/`BoardsApiService`; `BoardsView` may own modal-local loading and form state only.
- Mirror placements must show the same checklist state because the source of truth is `Card.id`, not `placement_id`.

## Card Entity Links

- Treat card links to Task/Story/Goal as explicit domain links, not as a conversion that makes a card equal to a task, story, or goal.
- Keep the MVP relation shape simple: `card`, `entity_type`, `entity_id`, plus metadata returned by the backend for display.
- Persist link/unlink through `BoardsStore` and `BoardsApiService`; `BoardsView` may own only picker/search UI state.
- Card fronts should show compact link badges from `card.entity_links`; detailed link management belongs in card details or an explicit card action surface.
- Linked entity rows in card details should expose open, unlink, and delete-entity actions from a right-side row menu that appears on hover/focus/open, not as always-visible inline buttons.
- Mirror placements must show the same linked entities because links are owned by `Card.id`, not `placement_id`.
- Search/link picker data should come from Task/Story/Goal APIs through a catalog port instead of importing those services directly into `BoardsView`.

## Trello-Like List Headers

- List headers should keep the title editable inline.
- Do not show routine counters or destructive actions directly in the list header.
- Keep list operations behind the header menu button; destructive list actions belong in the list actions popover.
- Do not expose future, unavailable, or non-implemented list action sections as disabled production UI. If a workflow is not going to be implemented or has no working flow yet, remove it from the menu and translation catalogs instead of leaving placeholder actions.

## Card Drag And Drop

- Keep board card drag/drop gesture state in `BoardDragController`, not in `BoardsView`.
- Keep conversion from visual insertion position to backend payload in pure domain helpers such as `placementTargetResolver`.
- `BoardsView` should only provide stable DOM data attributes, mount/unmount the controller, and route drop intents to `onPatchCardPlacement`.
- Drag/drop should emit semantic placement targets and must not calculate or persist numeric `pos` values on the frontend.

## Column Drag And Drop

- Keep board column drag/drop gesture state in `BoardColumnDragController`, separate from card drag/drop.
- Keep conversion from horizontal insertion position to backend payload in pure domain helpers such as `columnTargetResolver`.
- Frontend should send semantic column targets (`before_column`, `after_column`, or `position`) instead of calculating or persisting numeric ranks.
- Backend owns column `pos` values and legacy `order` normalization.
