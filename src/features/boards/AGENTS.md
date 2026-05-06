# Boards Feature

## Board Selection Session State

- Treat the selected board as tab/window-scoped runtime state owned by `BoardsStore`.
- Persist per-tab selected board restore through `sessionStorage`, so reload returns each tab to its own board without affecting other windows.
- Do not write routine board selection into `user.meta`; reserve profile-backed board defaults for an explicit user-facing default-board preference if one is introduced later.
- Resolve board selection through validated available boards: explicit runtime/preferred board first, then tab session board, then the first available board.
- Keep `BoardsView` free of selected-board persistence; it should emit selection intents and render store state only.

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

## Trello-Like List Headers

- List headers should keep the title editable inline.
- Do not show routine counters or destructive actions directly in the list header.
- Keep list operations behind the header menu button; destructive list actions belong in the list actions popover.

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
