# Canvas Element Details — UX/Architecture Implementation Plan

## Request summary

Implement richer **Element Details** behavior in canvas:

1. In Edit modal (or in a dedicated read-only `View Element/Element Details` modal) add a right-side column with related stories for the selected goal/task.
2. Add one more right-side column with tasks for the currently selected story.
3. For Story view, show story tasks in the same pattern.

## Current architecture (what we should reuse)

- `EditElementModal` is currently a **single-column form modal** that edits title/description/status/priority (+ due date for task, scale for goal). It is opened from `UIManager` via `editElement$`.  
- Related entities loading logic already exists in `RelatedItemsPicker` and uses `StoriesApiService` / `GoalsApiService` with backend references (`id`/`uuid`) and missing-item filtering.
- `StoryElement` already stores local `tasks: TaskElement[]`, which is useful for immediate rendering, but this list is incomplete when only part of the graph is loaded — so API-backed hydration is still needed for reliable details view.

## UX recommendation (senior-level)

### 1) Split “Edit” and “Details” concerns

**Recommended:** keep `EditElementModal` lightweight and create a new `ElementDetailsModal` (or `ViewElementModal`) for exploration/navigation.

Why:
- Editing form and relationship browsing are different intents.
- 3-column content in edit flow increases cognitive load and accidental edits.
- Details modal can be safely reused from context menu, double-click, and future deep-linking.

**Fallback:** if product wants one entry point now, keep tabs in a unified modal:
- `Edit` tab (existing form)
- `Details` tab (new columns)

### 2) 3-column interaction model

Desktop layout:
- **Column A (primary):** selected element summary (title, type, status, description).
- **Column B (middle):** related stories list.
- **Column C (right):** tasks of selected story.

Behavior:
- First story auto-selected when list is non-empty.
- Empty states must be explicit:
  - “No related stories”
  - “Select a story to see tasks” / “No tasks in this story”
- Keep row density compact (32–36px rows), with status dot + title.
- Preserve keyboard support (↑/↓ for lists, Enter to focus/open).

For **Story Details**:
- Reuse Columns A + C only (or keep B hidden and treat selected story as context).
- Tasks list should match same component as Column C to avoid visual divergence.

### 3) Microinteractions

- Skeleton loaders per column (not full-modal blocking).
- Sticky column headers with counts: `Stories (12)`, `Tasks (34)`.
- “Open on canvas” action for list item to pan/zoom + highlight element if it exists on scene.
- “Add to canvas” CTA for backend items missing on scene (reuse existing add services).

## Technical implementation in current codebase

## A. New UI component structure

Create:
- `src/features/canvas/ui/components/ElementDetailsModal.ts`
- `src/features/canvas/ui/components/ElementDetailsColumns.ts` (optional split)
- `src/features/canvas/ui/components/RelatedStoryList.ts`
- `src/features/canvas/ui/components/RelatedTaskList.ts`

Reuse modal shell utilities from `ui-lib` (`createModalShell`, action rows).

## B. Data orchestration service (important for dependency separation)

Create dedicated service:
- `src/features/canvas/core/services/ElementDetailsService.ts`

Responsibilities:
- Resolve selected element backend reference (`id/uuid`).
- Load related stories for Goal/Task context.
- Load tasks for selected story.
- Normalize to view models:
  - `StoryListItemVM`
  - `TaskListItemVM`
- Cache requests for modal session (Map by ref key) to avoid duplicate roundtrips.

Why service layer:
- Keeps modal components presentational.
- Avoids duplicating logic currently embedded in `RelatedItemsPicker`.
- Easier to unit test (API mapping + fallback behavior).

## C. Shared relationship resolver extraction

`RelatedItemsPicker` already contains useful methods (`collectStoriesFromGoalTasks`, backend ref keys, filtering). Extract shared pure helpers into:
- `src/features/canvas/core/services/relationshipResolvers.ts`

Then consume in both picker and details modal.

## D. Modal entry points

In `UIManager`:
- Keep current `editElement$ -> EditElementModal` behavior.
- Add a new trigger (e.g. `viewElementDetails$` or custom DOM event) to open `ElementDetailsModal`.

Context menu / selection actions:
- Add “View details” action for Goal/Story/Task.
- Optional: from Edit modal add secondary button `Show details`.

## E. State model for cascading selection

Within Details modal state:
- `selectedElement`
- `stories: StoryListItemVM[]`
- `activeStoryId: string | number | null`
- `tasks: TaskListItemVM[]`
- `loadingStories`, `loadingTasks`, `errorStories`, `errorTasks`

Rules:
- On element change -> load stories -> auto-select first -> load tasks.
- On manual story click -> load tasks for clicked story.
- Keep previous tasks visible until new tasks arrive (with subtle loading state), avoiding flicker.

## F. Performance and resilience

- Debounce rapid reselection (100–150ms) before API call.
- Cancel stale in-flight requests via RxJS `switchMap`.
- Show partial content if one column fails; do not fail whole modal.
- Respect offline/error fallback text and retry action per column.

## G. Accessibility

- Columns as ARIA regions with clear labels.
- List rows are buttons (`role="option"` inside `listbox` or semantic `<button>` list).
- Visible focus ring and keyboard navigation parity.
- Maintain ESC-close and modal focus trap behavior.

## Suggested delivery phases

### Phase 1 (low risk, quick value)
- Create `ElementDetailsModal` read-only.
- Goal/Task: stories + selected story tasks.
- Story: direct tasks list.

### Phase 2
- Add “Open on canvas” / “Add to canvas” actions.
- Add session cache + stale request cancellation.

### Phase 3
- Optional merge with Edit via tabs if product insists on single modal entry point.

## Acceptance criteria

- Opening Details for Goal/Task shows related stories in middle column.
- Selecting story updates right column with its tasks.
- Opening Details for Story shows its tasks with identical list component.
- Empty/loading/error states are distinct and non-blocking.
- Keyboard-only flow works across both lists.

## Risks and mitigations

- **Risk:** duplicated business rules between picker and details modal.  
  **Mitigation:** extract relationship resolver helpers once.
- **Risk:** modal becomes overloaded if merged with Edit.  
  **Mitigation:** keep separate modal or enforce tab separation.
- **Risk:** inconsistent scene-vs-backend entity presence.  
  **Mitigation:** explicit badges (“On canvas” / “Not on canvas”) and clear CTA.

## Practical implementation walkthrough in existing code

This section explains exactly **how I would implement it in the current canvas architecture**.

### 1) Keep existing `EditElementModal` as-is, add separate Details modal

Why in this codebase:
- `EditElementModal` already contains a focused edit form lifecycle (unsaved guard, save patch emission, keyboard enter/escape behavior).
- Expanding it into 3 columns will couple API-loading/orchestration into form code and make maintainability worse.

Implementation:
- New file: `src/features/canvas/ui/components/ElementDetailsModal.ts`.
- Reuse the same modal shell primitives (`createModalShell`) for visual consistency.
- Keep `EditElementModal` untouched except optional “Show details” secondary action.

### 2) Add Details trigger alongside existing edit trigger in `UIManager`

Current behavior:
- `UIManager` subscribes to `editElement$` and opens `new EditElementModal(el, this.scene).show()`.

Implementation:
- Add new event bus stream (example: `viewElementDetails$`) in `core/eventBus.ts`.
- Subscribe in `UIManager` similarly to edit flow and open `ElementDetailsModal`.
- Add invocation point in context menu / selection action menu: “View details”.

Result:
- No regression in existing edit flow.
- Details opens from the same UI interaction patterns users already know.

### 3) Extract relationship helpers from `RelatedItemsPicker`

Current problem:
- `RelatedItemsPicker` owns useful relationship logic but it is embedded as private methods and tightly coupled to picker UI state.

Implementation:
- Create `src/features/canvas/core/services/relationshipResolvers.ts` with pure helper functions:
  - get backend ref keys for story/task/goal,
  - collect stories from goal tasks,
  - merge/de-duplicate story arrays,
  - filter out already-on-canvas entities.
- Replace duplicated private picker logic with imported helpers.
- Reuse same helpers in `ElementDetailsService`.

Result:
- One source of truth for relation rules.
- Lower bug risk when relation policy changes.

### 4) Add `ElementDetailsService` for data flow orchestration

New service:
- `src/features/canvas/core/services/ElementDetailsService.ts`.

Dependencies:
- `StoriesApiService`, `GoalsApiService` (same as picker).
- Optional `TasksApiService` only if needed for enriched task details.

Public API (example):
- `loadStoriesForElement(element: TaskElement | StoryElement | GoalElement): Observable<StoryListItemVM[]>`
- `loadTasksForStory(storyRef: { id?: number; uuid?: string }): Observable<TaskListItemVM[]>`

Behavior by element type:
- **Goal**: fetch goal -> derive related stories (direct + from goal tasks) -> de-duplicate.
- **Task**: if task has story relation, return that story as list of one; otherwise empty.
- **Story**: treat current story as selected and load its tasks directly.

Data normalization:
- Map API DTOs into lightweight list VMs (`id`, `uuid`, `title`, `status`, `isOnCanvas`).
- `isOnCanvas` computed from current `scene.getElements()` snapshot.

### 5) Implement 3-column Details UI state machine

State in `ElementDetailsModal`:
- `stories`, `tasks`, `selectedStoryRef`, loading/error states per column.

Flow:
1. On open -> set skeleton state.
2. Load stories for selected element.
3. Auto-select first story (if exists).
4. Load tasks for selected story.
5. On user selecting another story -> reload tasks column only.

Important UX behavior:
- Keep old tasks visible during next story load (soft loading indicator), avoid harsh empty flicker.
- Column-level errors (e.g. tasks failed) should not close modal or clear successful stories.

### 6) “Open on canvas” and “Add to canvas” actions

Open on canvas:
- If entity exists in scene (`backendId/uuid` match), call canvas pan/zoom manager to center and select element.

Add to canvas:
- Reuse existing add services:
  - `AddExistingTaskService`
  - `AddExistingStoryService`
- Trigger same command flow as current existing pickers to keep undo/redo consistency.

### 7) Story view parity requirement

Requested requirement:
- “For view stories show story tasks identically”.

Implementation decision:
- Reuse the **same `RelatedTaskList` component** used in column C.
- For Story details, hide Stories column and pin selected story to current story context.

This guarantees visual and behavioral parity without duplicate UI logic.

### 8) Test strategy before merge

Unit tests:
- `ElementDetailsService`:
  - goal->stories mapping,
  - de-duplication behavior,
  - error isolation,
  - stale request cancellation (`switchMap`) semantics.

Component tests:
- Details modal renders empty/loading/success/error per column.
- Story selection updates tasks column.

Regression checks:
- Existing `EditElementModal` save/unsaved-guard behavior unaffected.
- Existing `RelatedItemsPicker` still works after helper extraction.
