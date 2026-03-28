# Learning Studio Canvas Desktop V1 UX Contract

## Status Note

This document is historical as of 2026-03-28.

It defined a canvas-based authoring contract that is no longer the primary product strategy.
Parts of it may still help inform:

- preview map design
- learner runtime map design
- node hierarchy and visual language

But it should not be used as the canonical spec for `Build`.

## Status

- State: decision synthesis
- Updated: 2026-03-28
- Scope: desktop-first course authoring on canvas
- Explicitly out of scope for this pass:
  - touch/mobile interaction model
  - a mature `Course map` for very large courses
- Related docs:
  - `docs/LEARNING-STUDIO.md`
  - `docs/LEARNING-STUDIO-BUILD-INTERACTION-SPEC.md`
  - `docs/LEARNING-STUDIO-CANVAS-AUTHOR-JOURNEYS.md`
  - `docs/LEARNING-STUDIO-CANVAS-UX-FINDINGS.md`
  - `docs/LEARNING-STUDIO-PREVIEW-LEARNER-RUNTIME-SPEC.md`

## Why this doc exists

Recent UX changes simplified `Build`:

- no persistent `Course map`
- no persistent side `Inspector`
- deep editing happens in a modal from the selected canvas element

That simplification needs one explicit answer:

- is the current canvas element/action model enough for convenient desktop v1 authoring

This document answers that question after scenario passes over the updated flow.

## Current Desktop V1 Product Shape

### Build

`Build` is one immersive canvas workspace.

Primary job:

- create structure
- select context
- open deep editing for the selected element

Primary surfaces:

- canvas workspace
- details modal

Supporting surfaces:

- empty-state CTA for the first module
- selection action menu
- context menu

Not part of current desktop v1 shell:

- persistent `Course map`
- persistent side `Inspector`

### Preview

`Preview` is the full course-level validation surface.

Its job is to validate:

- sequence
- prerequisites
- warnings
- overall learner flow

It is not the place for structure editing.

## Surface Responsibilities

The safest way to keep this product clean is to give each surface one dominant job.

### Canvas workspace

Primary job:

- structure authoring
- hierarchy reading
- selection
- local structural continuation

What it should show well:

- parent-child hierarchy
- current selection
- next likely structural action for the selected node

What it should not become:

- a dense form
- a second preview screen
- a page of persistent side chrome

### Details modal

Primary job:

- dense editing
- content editing
- prerequisite editing
- edits that would clutter the canvas if always visible

What belongs here:

- module title and description
- lesson title, description, and objective
- lesson blocks
- prerequisite editing
- advanced lesson-local settings

What should not depend on it:

- creating an empty module
- creating an empty lesson
- routine structural continuation

### Selection action menu

Primary job:

- accelerate the most likely next step after selection already exists

Best fit:

- `Add lesson`
- `Add exercise`
- `Add checkpoint`
- `Edit`

Poor fit:

- long enumerated lists
- heavy advanced settings
- cursor-position-dependent actions

### Context menu

Primary job:

- expert or cursor-local acceleration
- advanced actions
- list-heavy actions

Best fit:

- blank-space `Add module`
- prerequisite editing when it stays relatively compact
- secondary access to actions already visible elsewhere

Poor fit:

- the only discovery path for common creation steps

### Preview

Primary job:

- validate the course as a course
- inspect sequence
- inspect blocked lessons and prerequisite behavior
- decide what to fix next in `Build`

What belongs here:

- course-level learner-facing reading
- warning and blocked-state inspection
- `Back to Build`

What does not belong here:

- structure editing
- dense authoring controls
- competing local edit chrome

## Canonical Element Set

The current element model is the right one for desktop v1:

- `Module`
- `Lesson`
- `Exercise`
- `Checkpoint`
- `Prerequisite` as a dependency, not as the main structure model

This remains the cleanest mental model:

- modules own lessons
- lessons own practice and confirmation units
- prerequisites are exceptions to the main hierarchy

No new primary node type is required for convenient v1 authoring.

## Visual System

The canvas should feel like one coherent product surface, not a set of unrelated cards.

### Design character

The intended feel is:

- calm
- architectural
- editorial
- precise

It should not feel:

- playful
- dashboard-like
- over-decorated
- graph-toy-like

### Visual hierarchy

The canvas should be readable in this order:

1. module containers
2. lesson cards
3. exercise and checkpoint child units
4. prerequisite lines
5. selected-state actions

If this order flips, the canvas becomes visually noisy.

### Color direction

Base palette:

- background: warm or neutral white
- node surfaces: white to very light slate
- borders: soft slate
- text: deep slate, not pure black
- selected state: one controlled accent family

Recommended role split:

- `Module`: neutral with slightly stronger border and surface weight
- `Lesson`: white primary surface with the clearest contrast
- `Exercise`: subtle cool tint
- `Checkpoint`: subtle amber or sand tint
- `Prerequisite`: restrained accent line, never heavier than the nodes

Avoid:

- many saturated colors
- status-rainbow logic
- heavy shadows
- thick black outlines

### Shape language

The system should use one shared geometry family:

- rounded rectangles
- medium radius
- soft border edges
- restrained elevation

Recommended corner rhythm:

- module: largest radius in the system
- lesson: medium radius
- child units: slightly smaller radius

This keeps hierarchy readable without inventing different components for every type.

### Depth and elevation

Use elevation sparingly.

Recommended depth rule:

- module gets the strongest surface presence
- lesson gets slight lift only when selected or hovered
- exercise/checkpoint stay mostly flat
- selected-state actions may float lightly above the node

The canvas should feel layered, but not shadow-heavy.

## Shared Node Grammar

Every node should follow one internal structure:

1. type cue
2. title
3. optional short supporting text
4. local actions only when relevant

That structure should stay stable across all element types.

### Type cue

The type cue should be compact and quiet.

Good examples:

- short uppercase label
- small icon + label
- subtle color chip

Bad examples:

- giant badges
- full-width banners
- decorative ribbons

### Title behavior

Titles should be:

- prominent
- single-purpose
- truncated cleanly when long

The title should always win over metadata.

### Supporting text

Supporting text should be limited.

Recommended use:

- lesson description snippet
- module description snippet
- tiny status or count cues

Avoid turning nodes into mini-inspectors.

## Module Visual Spec

`Module` is the strongest container in the canvas.

### Role

It should read as:

- structural container
- section of the course
- owner of the lessons inside it

### Surface

Recommended visual treatment:

- slightly tinted or slightly heavier neutral surface
- clear border
- broader internal padding than any other node
- enough space to frame lessons inside it

### Header

Module header should contain:

- compact type cue: `Module`
- strong module title
- optional one-line description snippet

### Internal body

The body should visually gather lessons.

It should:

- feel like one owned region
- make lesson stacking/order obvious
- leave room for the selected-state `Add lesson` affordance

### Selected state

When selected, `Module` should:

- receive the clearest border accent in the container layer
- slightly strengthen its background or ring
- expose `Add lesson`
- keep that action visually attached to the module, not floating far away

### Empty module state

If a module has no lessons, it should show:

- one short empty hint
- one clear local `Add lesson`

It should not look broken or error-like.

## Lesson Visual Spec

`Lesson` is the primary authoring node.

### Role

It should read as:

- the core content step
- the place where most creator attention belongs

### Surface

Recommended visual treatment:

- clean white surface
- crisp but soft border
- strongest typography after module title
- enough padding for title, short description, and local actions

### Information structure

Preferred lesson content:

- type cue: `Lesson`
- title
- short description snippet or objective snippet
- optional tiny prerequisite indicator when relevant

The node should stay concise even when the lesson itself is rich.

### Selected state

When selected, `Lesson` should:

- get the clearest selected ring in the primary node layer
- show `Add exercise`
- show `Add checkpoint`
- show `Edit`

These actions should appear as a compact local action row, not a full toolbar.

### Edit affordance

`Edit` should be visible when selected.

It should feel:

- deliberate
- obvious
- one click away

It should not visually overpower the structural continuation actions.

## Exercise Visual Spec

`Exercise` is a secondary practice unit under a lesson.

### Role

It should read as:

- practical follow-up
- lighter than lesson
- owned by the lesson

### Surface

Recommended visual treatment:

- smaller card than lesson
- slightly cooler surface tint
- lighter border and text hierarchy

### Information structure

Keep it small:

- type cue: `Exercise`
- title
- optional one-line helper text

### Selected state

When selected, `Exercise` should:

- show a clean selected ring
- expose `Edit`
- remain visually subordinate to its parent lesson

## Checkpoint Visual Spec

`Checkpoint` is a secondary confirmation or evaluation unit under a lesson.

### Role

It should read as:

- validation or confirmation
- not the same thing as practice

### Surface

Recommended visual treatment:

- same size family as `Exercise`
- different tint family from `Exercise`
- warmer, more evaluative accent

### Information structure

Keep it parallel to `Exercise`:

- type cue: `Checkpoint`
- title
- optional one-line helper text

### Selected state

When selected, `Checkpoint` should:

- show `Edit`
- keep the same interaction model as `Exercise`
- still feel distinct by color and type cue

## Prerequisite Visual Spec

`Prerequisite` is a dependency, not a content node.

### Role

It should read as:

- exception
- conditional dependency
- cross-structure rule

It should not read as:

- the main structure of the course

### Line style

Recommended treatment:

- thin line
- restrained accent color
- lower contrast than node borders
- directional enough to understand, but not diagrammatic theater

### Visibility rule

Prerequisite lines should support interpretation, not dominate the board.

If the board becomes line-first, the structure is failing.

## Typography and Density

## Exact Size Defaults

These are the recommended desktop-v1 implementation defaults.

They are intentionally exact enough to build from, while still leaving a small
implementation tolerance of roughly `±8px` where needed to preserve rhythm.

### Module

Recommended default size:

- width: `520px`
- minimum height: `180px` for empty modules
- typical populated height: auto-grow from content
- header height: `56px`
- horizontal padding: `24px`
- top body padding below header: `20px`
- bottom padding: `20px`
- corner radius: `24px`

Why:

- wide enough to frame lessons as the owned region
- compact enough that the canvas does not become one-module-per-screen by force

### Lesson

Recommended default size:

- width: `376px`
- minimum height: `112px`
- corner radius: `18px`
- internal padding: `16px`
- top-right reserved area for selected action row: `96px x 28px`

Why:

- large enough for a strong title, one short supporting line, and 3 selected actions
- still clearly smaller and lighter than a module

### Exercise

Recommended default size:

- width: `288px`
- minimum height: `72px`
- corner radius: `14px`
- internal padding: `12px`
- top-right reserved area for `Edit`: `28px x 28px`

Why:

- clearly subordinate to lesson
- large enough for type cue, one-line title, and optional helper text

### Checkpoint

Recommended default size:

- width: `288px`
- minimum height: `72px`
- corner radius: `14px`
- internal padding: `12px`
- top-right reserved area for `Edit`: `28px x 28px`

Why:

- same size family as exercise
- distinct by tint and type cue, not by a different geometry family

### Prerequisite line

Recommended default treatment:

- stroke width: `1.5px`
- default opacity: `0.4`
- selected-related opacity: `0.8`
- arrowhead or directional tip size: `6px`

Why:

- readable as a dependency
- still quieter than node borders and node hierarchy

### Spacing defaults

Recommended canvas spacing:

- canvas outer breathing room before first module: `64px`
- module-to-module horizontal gap: `96px`
- module-to-module vertical gap: `112px`
- module header to first lesson: `20px`
- lesson-to-lesson gap inside module: `20px`
- lesson to child cluster gap: `10px`
- child-unit indent under lesson: `24px`
- child-to-child gap: `8px`

Why:

- structure should be understood from spacing before lines or extra chrome

### Title clamps

Recommended defaults:

- module title: clamp to `2` lines
- lesson title: clamp to `2` lines
- exercise title: clamp to `1` line
- checkpoint title: clamp to `1` line

Long titles should truncate cleanly without moving local action placement.

### Typography scale

Recommended hierarchy:

- module title: largest node text
- lesson title: second largest
- child-unit titles: one step smaller
- type cues and meta: smallest

### Copy density

Node text should stay short.

Recommended rule:

- one strong title
- at most one short supporting line
- no paragraph-length copy on nodes

Longer content belongs in the modal.

## State Design

### Default

The default state should feel quiet and readable.

### Hover

Hover should:

- clarify clickability
- slightly strengthen border or surface
- not trigger a large visual jump

### Selected

Selected is the key interactive state.

It should:

- be obvious at a glance
- remain elegant
- reveal the next likely actions

### Editing

Editing is not an inline node state.

The node should indicate that it is the active edit context, but the actual dense editing should happen in the modal.

## Motion and Transition Rules

Motion should support orientation.

Recommended use:

- subtle fade/slide for selected-state actions
- small emphasis when modal opens from the node
- restrained hover transitions

Avoid:

- bounce
- theatrical zooms
- overly animated dependency lines

## Canvas Composition Rules

### Spacing

Use spacing to explain structure before using borders or lines.

Recommended reading:

- modules have the largest spacing envelope
- lessons sit with regular, readable rhythm inside modules
- child units cluster under their lesson

### Background

The background should stay quiet.

Light dot-grid is acceptable because it helps spatial orientation without taking over.

### Visual balance

The canvas should still feel open.

Do not fill every gap with helper text, badges, or controls.

## Anti-Fragility Rules

The design should still hold if:

- module titles are long
- there are many lessons in one module
- some lessons have no child units
- some lessons have prerequisites
- only one node is selected

If the layout only works in the ideal demo case, it is not mature enough.

## Canonical Action Structure

### Top-level

Visible top-level action:

- `Add module`

Secondary top-level accelerator:

- blank-space context menu `Add module`

### Module-level

Visible selected-state action:

- `Add lesson`

Secondary accelerators:

- module selection action menu
- module context menu

### Lesson-level

Visible selected-state actions:

- `Add exercise`
- `Add checkpoint`
- `Edit`

Secondary accelerators:

- lesson selection action menu
- lesson context menu

Advanced lesson-local action:

- prerequisite editing

Best surfaces for that action:

- lesson context menu
- details modal

## Element Action Matrix

This section is the most practical desktop-v1 reference.

### Course

Primary action:

- `Add module`

Secondary action:

- open full `Preview`

Deep edit surface:

- none inside `Build`; course-level basics stay in `Overview`

### Module

Primary action after selection:

- `Add lesson`

Secondary actions:

- `Edit`
- context menu actions
- selection action menu actions

Deep edit surface:

- details modal

### Lesson

Primary actions after selection:

- `Add exercise`
- `Add checkpoint`
- `Edit`

Secondary actions:

- prerequisite editing
- future quick lesson preview
- context menu actions
- selection action menu actions

Deep edit surface:

- details modal

### Exercise

Primary action after selection:

- `Edit`

Secondary actions:

- context menu actions
- selection action menu actions

Deep edit surface:

- details modal

### Checkpoint

Primary action after selection:

- `Edit`

Secondary actions:

- context menu actions
- selection action menu actions

Deep edit surface:

- details modal

## Selected-State Affordance Rule

The next desktop-v1 UX improvement should not add more persistent chrome.

Instead, the most important actions should become visible only on the currently selected node.

### Selected module

Visible selected-state action:

- `Add lesson`

Why:

- this is the most frequent next structural step after a module is selected
- keeping it visible removes over-dependence on menus
- it stays local to the correct parent element

### Selected lesson

Visible selected-state actions:

- `Add exercise`
- `Add checkpoint`
- `Edit`

Why:

- these are the most likely next actions after a lesson is selected
- they keep the authoring loop on canvas
- they reduce dependence on double click and right click for routine work

### Rule

Selected-state actions should:

- appear only for the active node
- feel attached to that node, not to global page chrome
- disappear when selection changes

They should not:

- turn every node into a toolbar
- remain visible on unselected nodes
- compete visually with the node title and hierarchy

## Selected-State Visual Rules

Visible selected-state actions should feel like a natural extension of the selected node.

### Placement

- actions should sit close to the selected node
- actions should read as belonging to that node, not to the page
- actions should not shift the whole layout when they appear

### Density

- keep the action set short
- show only the 1-3 most likely next actions
- push everything else into selection/context menus or the modal

### Visual priority

- the selected node still remains the main object
- actions are supportive, not louder than the node title
- `Edit` should be clear, but should not overpower structural continuation actions

## Interaction Contract

For desktop v1 the strongest surviving interaction model is:

- single click selects
- double click opens the details modal
- explicit `Edit` action should also exist for discoverability
- context menu is an accelerator, not the only discovery path
- selection action menu is for fast next-step actions on the current selection

This keeps the canvas readable while still letting authors move quickly.

## Deep Edit Rule

The product should treat double click as:

- a shortcut

It should not treat double click as:

- the only obvious way to edit

The intended deep-edit stack is:

1. single click selects
2. explicit `Edit` on the selected node is visible
3. double click remains the faster shortcut

This keeps editability discoverable without bloating the canvas.

## Detailed Editing Split

The cleanest split for desktop-v1 is:

### On canvas

What should stay on canvas:

- selection
- structure reading
- local continuation
- a small number of next-step actions

### In the details modal

What should move into the modal:

- long text
- structured lesson blocks
- prerequisite editing
- settings that are not needed for structural scanning

### In menus

What should stay in menus:

- secondary accelerators
- advanced actions
- list-shaped actions

This keeps the center surface legible.

## Scenario Passes

The updated flow was checked against four practical desktop scenarios.

### 1. First-time structure start

Path:

- `Course library -> Overview -> Build -> Add module -> Add lesson -> Edit lesson`

Verdict:

- strong enough for desktop v1

What makes it work:

- `Overview` stays lightweight
- empty-state `Add module` is visible
- the first lesson can move quickly into modal editing

Main friction:

- if `Add lesson` is discoverable only through menus, the flow slows down immediately after the first module

### 2. Repeated structural authoring loop

Path:

- add module
- add lesson
- add exercise/checkpoint
- continue on canvas

Verdict:

- element set is sufficient
- action placement is the real risk

What makes it work:

- hierarchy is already clear enough in the node model
- structural creation stays local to the relevant parent

Main friction:

- `Add lesson` must stay visibly attached to selected module context
- `Add exercise` and `Add checkpoint` must stay visibly attached to selected lesson context

### 3. Dense lesson editing loop

Path:

- select lesson
- open details modal
- edit title/description/objective/blocks/prerequisites
- close
- continue on canvas

Verdict:

- strong enough for desktop v1

What makes it work:

- dense editing leaves the canvas and moves into one focused surface
- lesson blocks and prerequisite editing fit the modal better than inline canvas chrome

Main friction:

- relying on double click alone is too weak
- an explicit `Edit` action should stay available on selected lessons

### 4. Validation loop

Path:

- build structure
- open `Preview`
- inspect the course as a whole
- return to `Build`

Verdict:

- acceptable for desktop v1
- not mature yet

What makes it work:

- `Preview` stays course-level instead of becoming another editor

Main friction:

- return context back into `Build` still needs to feel tighter
- a future quick lesson preview modal can reduce route switching, but is not required to call the current element set sufficient

## Detailed Author Loops

### Loop A: first module to first lesson

1. creator enters `Build`
2. sees the empty-state `Add module`
3. creates the first module
4. module becomes selected
5. selected module exposes visible `Add lesson`
6. creator adds the first lesson
7. lesson becomes selected
8. selected lesson exposes visible `Edit`
9. creator opens details modal and starts writing content

This is the most critical onboarding loop.
If any of these steps hides behind a menu, first-time confidence drops sharply.

### Loop B: repeated course construction

1. creator selects a module
2. adds one or more lessons
3. selects a lesson
4. adds exercise/checkpoint units
5. continues across the course without leaving canvas

This loop should feel like local continuation, not mode switching.

### Loop C: deep lesson refinement

1. creator selects a lesson
2. opens `Edit`
3. updates metadata, objective, blocks, and prerequisites
4. closes the modal
5. continues in the same structural context

The creator should never feel that deep editing broke the build flow.

### Loop D: validate and return

1. creator opens `Preview`
2. checks sequence and blocked logic
3. identifies the lesson or module that needs fixing
4. uses `Back to Build`
5. returns to that relevant context

This loop is only good if the return lands near the needed fix.

## Preview Return Contract

The next desktop-v1 improvement for `Preview` should be context restoration, not more preview chrome.

When the creator enters `Preview` from `Build`, the product should preserve:

- selected module
- selected lesson
- relevant canvas viewport context when practical

When the creator returns from `Preview`, the product should:

- restore the same lesson or module when possible
- make `Back to Build` explicit
- prefer returning to the item that most likely needs fixing

This keeps `Preview` as a validation detour rather than a separate workflow island.

## Detailed Preview Return Rules

### What should be remembered

- selected lesson id when a lesson is selected
- selected module id when no lesson is selected but a module is selected
- last meaningful build context before entering `Preview`

### What should happen on return

- if a lesson was the meaningful context, return to that lesson
- otherwise if a module was the meaningful context, return to that module
- otherwise return to course-level build context

### What the creator should see

- an obvious `Back to Build`
- no ambiguity about whether they are still previewing
- no surprise reset to the course root if a more useful target exists

## Quick Lesson Preview Priority Rule

Quick lesson preview is still useful, but it is not the next highest-value UX fix.

Priority order should be:

1. visible `Add lesson` on selected modules
2. visible `Add exercise` / `Add checkpoint` on selected lessons
3. visible `Edit` on selected lessons and modules
4. stronger `Preview -> Build` context restore
5. only then quick lesson preview as a local secondary validation aid

## Anti-Patterns

The following directions would weaken the current desktop-v1 model:

- hiding `Add lesson` only in menus
- hiding `Edit` only behind double click
- putting every action in both context menu and selection action menu
- letting quick lesson preview compete with selection and drag
- turning `Preview` into a second editor
- reintroducing persistent side chrome just to surface actions
- giving every node a permanent mini-toolbar

If any of these appears, the canvas either becomes too empty or too noisy.

## Sufficiency Verdict

### Enough now

The currently documented canvas element set is enough for convenient desktop v1 authoring.

That statement is only true if these product rules remain in place:

1. `Add module` stays visible without needing right click.
2. `Add lesson` stays visible on the selected module, not menu-only.
3. `Add exercise` and `Add checkpoint` stay visible on the selected lesson, not menu-only.
4. `Edit` is available explicitly, not only through double click.
5. Full `Preview` remains separate from authoring.

### Not enough yet for a mature product

The updated model is still not enough to call the canvas authoring experience fully mature.

The biggest remaining gaps are:

- local action discoverability on selected module and lesson nodes
- tighter context restoration after returning from `Preview`
- stronger visual distinction between `Lesson` and `Exercise / Checkpoint`
- a cleaner quick validation story inside `Build`

## What Is Deferred On Purpose

These are real future concerns, but they are not blockers for this desktop-v1 decision:

- touch/mobile interaction model
- a stronger `Course map` for large-course navigation

Those should stay deferred instead of bloating the current authoring shell.

## Product Rule To Keep Stable

For the current desktop-v1 pass, the product should stay anchored on this split:

- `canvas = structure`
- `details modal = deep editing`
- `selection action menu = fast next-step actions`
- `context menu = secondary accelerator`
- `Preview = course-level validation`

If that split drifts, the canvas will either become too empty or too noisy.

## Acceptance Criteria For Desktop V1 UX

The contract should be considered satisfied when all of these are true:

1. A first-time creator can create the first module and first lesson without discovering right click.
2. A creator can tell how to edit a selected lesson without being forced to guess double click.
3. A creator can add exercises and checkpoints from the selected lesson context without opening dense editing first.
4. Dense lesson editing happens in one focused modal instead of scattered inline forms.
5. `Preview` clearly reads as validation, not editing.
6. Returning from `Preview` restores a useful build context instead of dropping the creator into the course root by default.
7. The canvas still feels structurally readable because selected-state affordances do not become permanent toolbars.

## Remaining Implementation-Level Decisions

The product direction is now clear enough to build.
What remains is not product ambiguity, but implementation-level precision.

These are the details that should be fixed before or during implementation in a controlled way.

### 1. Exact action anchoring

Still to define precisely:

- whether selected module actions sit in the module header edge or inside the module body edge
- whether selected lesson actions sit top-right, bottom-right, or as a small attached action rail

Recommended default:

- `Module`: attach `Add lesson` to the lower-right edge of the module header region
- `Lesson`: attach `Add exercise`, `Add checkpoint`, `Edit` as a compact top-right action row inside the lesson card

Why:

- module continuation should read as "grow inside this container"
- lesson actions should read as "continue or edit this focused content node"

### 2. Maximum visible action count

Still to define precisely:

- how many visible actions a selected node may show before it becomes noisy

Recommended default:

- `Module`: 1 visible action
- `Lesson`: 3 visible actions maximum
- `Exercise` / `Checkpoint`: 1 visible action

Everything else should fall back to selection/context menus.

### 3. Warning-state ownership

Still to define precisely:

- which node types can show warning styling directly on the card

Recommended default:

- `Module`: warning only for missing lessons
- `Lesson`: warning for missing description/objective or prerequisite issue
- `Exercise` / `Checkpoint`: warning only for obviously broken reference/config states

Keep warnings compact.
Do not turn nodes into alert panels.

### 4. Long-title behavior

Still to define precisely:

- how to handle very long titles without breaking the node rhythm

Recommended default:

- clamp titles to 2 lines for `Module` and `Lesson`
- clamp child-unit titles to 1 line
- use ellipsis after the clamp
- never let visible action placement jump because of long text

### 5. Empty child-state behavior

Still to define precisely:

- how much hinting to show when a lesson has no exercises/checkpoints

Recommended default:

- an empty `Lesson` should still look valid
- it may show a light suggestion for `Add exercise` / `Add checkpoint`
- it should not look broken or incomplete by default

### 6. Dense-module behavior

Still to define precisely:

- what happens when a module contains many lessons and the selected-state actions start competing with density

Recommended default:

- selected-state actions remain attached only to the active lesson
- unselected lessons stay visually quiet
- if density becomes too high, keep visible actions only on the active lesson and push the rest to the selection action menu

### 7. Prerequisite line visibility

Still to define precisely:

- when prerequisite lines are all visible
- when only selected-related prerequisite lines are visible

Recommended default:

- show prerequisite lines at low emphasis by default only when overall dependency count stays modest
- always highlight prerequisite lines connected to the selected lesson
- increase contrast on hover/selection
- never let prerequisite lines visually outrank lesson/module structure

### 8. Preview return precedence

Still to define precisely:

- what happens if the creator entered `Preview` from one lesson but then navigated to another lesson inside `Preview`

Recommended default:

- `Back to Build` returns to the original build context
- explicit `Edit this lesson` returns to the currently previewed lesson

This preserves both stability and intentionality.

### 9. Deferred by design

The following should stay unresolved for now on purpose:

- touch/mobile interaction model
- mature `Course map`
- large-scale search/filter over canvas structure
- complex multi-selection authoring

These are real future concerns, but they are not blockers for starting the desktop-v1 implementation.

## Next UX Priorities

The next highest-value UX work is not adding new primary node types.

It is:

- keep strong visible `Add lesson` on selected modules
- keep strong visible `Add exercise` / `Add checkpoint` on selected lessons
- expose explicit `Edit` alongside double click
- tighten `Preview -> Build` context restore
- add quick lesson preview only if it stays clearly secondary to full `Preview`
