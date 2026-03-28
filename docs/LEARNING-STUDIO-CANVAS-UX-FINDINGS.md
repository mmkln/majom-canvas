# Learning Studio Canvas UX Findings

## Status Note

This document is historical as of 2026-03-28.

It contains useful observations about map readability and node behavior, but it was written under a canvas-authoring strategy that is no longer canonical.

Use it only as supporting reference.
Do not use it as the current answer to how creators should build courses.

## Status

- State: research synthesis
- Updated: 2026-03-28
- Scope: consolidated findings from user-path analysis and density stress-testing for the Learning Studio canvas
- Current desktop-v1 simplification reference: `docs/LEARNING-STUDIO-CANVAS-DESKTOP-V1-UX-CONTRACT.md`
- Related docs:
  - `docs/LEARNING-STUDIO.md`
  - `docs/LEARNING-STUDIO-BUILD-INTERACTION-SPEC.md`
  - `docs/LEARNING-STUDIO-CANVAS-AUTHOR-JOURNEYS.md`
  - `docs/LEARNING-STUDIO-AUTHOR-UX-SPEC.md`
  - `docs/LEARNING-STUDIO-LEARNER-UX-SPEC.md`
  - `docs/LEARNING-STUDIO-PROGRESS-ASSESSMENT-SPEC.md`
  - `docs/LEARNING-STUDIO-STRUCTURED-LESSON-FORMAT-SPEC.md`

## Why this doc exists

The product already has multiple Learning Studio documents that define domain rules, screen hierarchy, and author journeys.
What was still missing was one synthesis document that answers a narrower but critical question:

- which canvas interaction model survives realistic author behavior
- which alternatives fail and why
- which density thresholds break the UI
- when visual connections help
- when visual connections become noise
- which implementation details are merely nice-to-have
- and which ones are required for the canvas to remain usable

This document records both good and bad findings from modeled usage scenarios.
It intentionally documents rejected directions, not only the preferred one.

This is not production telemetry.
It is a structured synthesis of user-path analysis and scenario modeling against the current repo direction.

## Latest Desktop V1 Verdict

For the current desktop-v1 shell, the cleanest surviving contract is:

- no persistent side `Inspector`
- no persistent `Course map`
- `canvas = structure`
- `details modal = deep editing`
- `selection action menu` and `context menu` = accelerators
- `Preview` = course-level validation

Current conclusion:

- the documented element model is sufficient for convenient desktop v1 authoring
- the remaining risk is not missing node types, but weak visibility of repeated actions like `Add lesson` and explicit `Edit`

## Post-Update Scenario Re-check

After the latest desktop-v1 UX updates, three practical scenario families hold up better:

- first-time authoring: stronger, because `Add module` stays visible and the next missing step is now clearly `Add lesson` on selected module context
- repeated structural editing: stronger, because `Add lesson`, `Add exercise`, `Add checkpoint`, and `Edit` are now treated as selected-state actions rather than menu-only actions
- preview-return loop: clearer, because `Preview` is now explicitly treated as a validation detour that should restore the relevant build context on return

Current overall re-check verdict:

- enough for convenient desktop v1 if the selected-state action model is actually implemented
- still not mature enough to skip explicit return-context behavior and stronger visual differentiation between lesson and child units

## Baseline Constraints

The findings below were evaluated against the current Learning Studio contract, not against a blank slate.

The most important constraints were:

- `Build` is one structured authoring workspace, not a graph toy and not a form page.
- Top-level structural CTA is `Add module`.
- `Add lesson` is contextual to a module.
- `Add exercise` and `Add checkpoint` are contextual to a lesson.
- Single click selects.
- Double click opens the details modal.
- Quick lesson preview must stay secondary and must not break selection or drag behavior.
- Modules are the dominant structure containers.
- Lessons are the primary child cards.
- Exercises and checkpoints are secondary child units attached to lessons.
- `Course map` may be strengthened, but must not become a second full editor.

These constraints come primarily from:

- `docs/LEARNING-STUDIO-BUILD-INTERACTION-SPEC.md`
- `docs/LEARNING-STUDIO-CANVAS-AUTHOR-JOURNEYS.md`
- `docs/LEARNING-STUDIO-AUTHOR-UX-SPEC.md`

## Modeled Scenario Set

The following scenarios were modeled and compared:

- first-time creator: `Overview -> Build -> Add module -> Add lesson -> open details`
- structure-building loop: add modules, lessons, exercises, checkpoints
- focused lesson-editing loop: select lesson, open modal, edit blocks/objective/prerequisites, quick preview, return to canvas
- navigation and dependency management: use `Course map`, prerequisite links, focus-canvas mode, and return-context behaviors
- many modules: roughly `8`, `12`, `16`, and `20` modules
- many lessons inside one module: roughly `8`, `12`, `20`, and `30` lessons
- many child practice units inside one lesson: roughly `0-2`, `3-5`, `6-10`, and `10+` exercises/checkpoints
- mixed overload: roughly `10-12` modules, `40-60` lessons, `20-40` child practice units, and sparse-to-moderate cross-module prerequisites
- arrow semantics: no arrows, prerequisite-only arrows, sequence arrows, parent-child arrows, and on-demand arrows

## Current Implementation Signals

The current implementation already points in a direction, and that matters for evaluating what is realistic to build next.

The strongest current signals are:

- the interaction contract already starts with `Add module`, then `Add lesson`, then `Add exercise` / `Add checkpoint` in `src/features/learning-studio/canvas/LearningCanvasInteractionAdapter.ts`
- module containers and unit cards already exist in `src/features/learning-studio/canvas/LearningModuleNode.ts` and `src/features/learning-studio/canvas/LearningUnitNode.ts`
- prerequisite links are already represented as lesson-to-lesson connections in `src/features/learning-studio/canvas/learningCanvasMapping.ts`
- canvas selection already syncs back to app state in `src/features/learning-studio/canvas/LearningCanvasSelectionBridge.ts`
- `collapsed` already exists in the state model, but is not yet a full density-management system in the canvas layer

The findings below therefore prefer directions that:

- fit the existing contract
- solve the highest-value UX failures
- and do not require throwing away the entire learning canvas integration

## Current Gaps Confirmed in Repo

Several risks from the modeled scenarios are also directly visible in the current implementation.

- Selection context can collapse too easily:
  `src/features/learning-studio/canvas/LearningCanvasSelectionBridge.ts` currently maps any non-single selection back to course-level selection.
- Collapse exists in state, but is not yet a full canvas-density mechanism:
  `collapsed` exists in `src/features/learning-studio/ui/components/LearningStudioScreenModels.ts` and is toggled in `src/features/learning-studio/LearningStudioApp.ts`, but `src/features/learning-studio/canvas/learningCanvasMapping.ts` still builds expanded module scenes from ordered units.
- Lesson, exercise, and checkpoint still share too much of the same base card grammar:
  `src/features/learning-studio/canvas/LearningUnitNode.ts` is the common rendering base, while `src/features/learning-studio/canvas/LearningExerciseNode.ts` and `src/features/learning-studio/canvas/LearningCheckpointNode.ts` only differentiate node kind.
- Dependency rendering is already narrower than general structure rendering:
  `src/features/learning-studio/canvas/learningCanvasMapping.ts` only materializes lesson-to-lesson prerequisite connections, which supports the conclusion that arrows should stay limited to dependency semantics.

## Recommended Direction

The best surviving model is:

- container-first canvas
- secondary `Course map`
- modal as the primary deep-edit surface
- quick lesson preview as a local validation step
- full `Preview` as the broader validation surface

In short:

- `canvas = structure`
- `Course map = orientation and jumping`
- `details modal = content editing`
- `quick preview = local lesson validation`
- `Preview = course-level validation`

This direction won because it best preserves the author's mental model of a course:

- modules own lessons
- lessons own practice and confirmation units
- prerequisites are exceptions to the structure, not the structure itself

## Confirmed Modal and Menu Contract

The latest pass confirmed that the product is not merely considering modals and action menus.
It already has a concrete contract for them in both docs and code.

Confirmed in the current repo:

- the `Build` spec explicitly defines the details modal as the primary deep-edit surface for selected content
- the same spec keeps quick lesson preview separate, read-only, and secondary
- learning canvas UI already mounts a `ContextMenu` and a `SelectionActionMenu`
- the interaction adapter already provides contextual actions for modules and top-level lessons
- the current canvas nodes already emit an editor request on double click
- the build stage already listens for that event and opens a details modal
- even the empty-state overlay forwards right click back into the canvas so contextual creation still works there

This is an important finding because it changes the maturity level of the UX discussion.
The question is no longer whether modal editing and contextual menus should exist.
They already exist as the intended architecture.
The real UX question is how to sharpen their boundaries and make them more reliable at scale.

### Why This Matters

The strongest surviving role split is now clearer:

- `canvas` should carry placement, hierarchy, and local structure
- `details modal` should carry dense and structurally sensitive edits
- `context menu` and `selection action menu` should carry contextual structural actions
- `quick preview` should stay a read-only validation shortcut

This split performed well in the modeled author loops because it keeps the canvas readable while still making editing fast.

### What Worked Well

Healthy behavior:

- creator single-selects a module or lesson to establish context
- creator uses visible local affordance or menu action for structural creation
- creator uses double click or an explicit edit affordance to open the details modal
- creator edits metadata, objective, prerequisites, and lesson blocks in one focused place
- creator optionally opens quick preview for local learner-facing validation
- creator closes and returns to the same build context

Why it worked:

- high-density fields do not bloat the canvas card
- structural actions stay near the selected element
- preview stays useful without becoming a second editing surface
- the author does not need to route away from `Build` for common deep edits

### What Failed or Stayed Risky

The latest pass also confirmed several failure modes:

- if `Add lesson` or similar actions are available only in a context menu, discoverability is too weak
- if quick preview competes with the primary click zone, selection and drag become fragile
- if double click is the only obvious path to edit, editability becomes harder to learn
- if context menu, selection action menu, and modal all expose overlapping actions without role clarity, the interface starts feeling redundant
- if modal close does not restore the same working context, the cost of deep editing rises quickly in larger courses

### Resulting Design Rule

The strongest rule is:

- keep primary structural actions visible near the relevant parent element
- use `context menu` and `selection action menu` as accelerators, not as the sole discovery path
- use the `details modal` for richer, lower-frequency, or structurally sensitive edits
- keep `quick preview` explicitly secondary and read-only

### Implementation Consequences

This leads to concrete implementation guidance:

- keep `Add module` as a visible top-level CTA, not a menu-only action
- keep `Add lesson` visibly attached to module context even if it also exists in menus
- keep `Add exercise` and `Add checkpoint` lesson-local and available through action menus
- avoid turning the details modal into the default place for routine structural creation
- avoid turning quick preview into an authoring surface
- expand menu coverage carefully later for actions like duplicate, delete, or reorder, but do not blur the primary role split

## Context Menu vs Selection Action Menu Findings

An additional scenario pass focused specifically on menu placement:

- blank canvas right click
- single selected module
- single selected lesson
- single selected child unit
- multi-selection
- dense courses where menu overload becomes a scaling problem

This pass confirmed that the two menu surfaces should not carry the same job.

### Core Rule

The strongest surviving split is:

- `context menu` = cursor-local, target-local, secondary, good for long lists or advanced actions
- `selection action menu` = selection-scoped, always-visible while selected, good for quick and frequent actions

That rule is consistent with the current implementation direction:

- `ContextMenu` can expose creation actions when right-click happens on blank space and can include paste at the cursor location
- `SelectionActionMenu` appears only when one or more elements are selected and renders adapter-provided selection actions near the selected bounds
- the current learning interaction adapter already limits selection actions to single-selection cases, which is a useful signal that not all actions should be promoted into the floating action surface

### What the Scenario Passes Showed

What worked well:

- right click on blank space for `Add module` and `Paste`
- action menu for fast follow-up actions on the currently selected module or lesson
- context menu for advanced lesson-local actions such as prerequisite editing
- action menu for multi-selection batch actions once those are added

What failed:

- placing key creation actions only in the context menu
- placing long or list-heavy actions in the compact selection action menu
- using context menu for ambiguous multi-selection destructive actions
- overloading the action menu with too many equal-priority buttons in dense courses

### Recommended Action Placement

#### `Add module`

Best placement:

- visible top-level CTA
- blank-space `context menu` as a secondary accelerator

Why:

- this is the one top-level structural action
- it must be discoverable even before any selection exists
- blank-space right click is a good positional shortcut, but cannot be the primary discovery path

Should not live in:

- `selection action menu`

#### `Add lesson`

Best placement:

- visible module-local affordance
- `selection action menu` for a selected module
- module `context menu` as a secondary accelerator

Why:

- it is the dominant contextual action of a module
- it is frequent enough to deserve the quick selected-state surface
- hiding it only behind right click makes module authoring harder to learn

#### `Add exercise` / `Add checkpoint`

Best placement:

- visible lesson-local affordance or empty-state suggestion
- `selection action menu` for a selected lesson
- lesson `context menu` as a secondary accelerator

Why:

- these are lesson-local follow-up actions
- they are frequent enough to justify quick access on the selected lesson
- they remain structurally local and should not be pushed up to module-level by default

#### `Edit` / `Open details`

Best placement:

- `selection action menu` for single selection
- `context menu` as a secondary path

Why:

- edit is a frequent selected-state follow-up action
- relying only on double click is too fragile
- right click still works as a useful secondary discovery path for precision users

#### `Quick preview`

Best placement:

- lesson-local affordance or `selection action menu`

Why:

- preview follows from current lesson selection, not from cursor location
- it should stay visible as a secondary validation action once the lesson is selected

Should usually not live in:

- `context menu` by default

#### `Prerequisites`

Best placement:

- lesson `context menu`
- lesson details modal

Why:

- prerequisite editing is advanced, lower-frequency, and potentially list-heavy
- compact floating action menus are a poor fit for long prerequisite lists
- the current implementation already treats prerequisite editing as a context-menu action, which aligns with the scenario findings

Should not live in:

- `selection action menu` as a full enumerated list

#### `Copy`

Best placement:

- `selection action menu` for single and multi-selection
- optional single-target `context menu`

Why:

- copy is fundamentally selection-scoped
- multi-selection copy belongs on the surface that already represents the current selection

#### `Paste`

Best placement:

- blank-space `context menu`

Why:

- paste is location-dependent
- the cursor position matters more than the current selection

Should not live in:

- `selection action menu` by default

#### `Duplicate`

Best placement:

- `selection action menu` for single and multi-selection
- optional single-target `context menu`

Why:

- duplicate is selection-scoped and often part of rapid authoring loops
- it benefits from being visible once an element is selected

#### `Delete`

Best placement:

- `selection action menu` for single and multi-selection, with confirmation or immediate undo support
- optional single-target `context menu` as a secondary path

Why:

- delete is strongly selection-scoped
- multi-selection destructive actions are clearer when tied to the visible selected-state surface
- right-click delete should remain secondary to avoid ambiguity about whether the target or the whole selection will be removed

#### `Reorder`

Best placement:

- direct manipulation
- details modal only if the product later needs explicit order controls

Why:

- reorder is better expressed by drag, hierarchy controls, or list ordering than by menu items
- menu-based reorder becomes fragile and verbose quickly

Should not live in:

- `context menu` or `selection action menu` by default

### Multi-Selection Rule

Current contract note:

- `Build` still recommends single selection in v1
- multi-selection menu policy should therefore be treated as future-safe guidance, not as a requirement to immediately expand the product surface

For multi-selection, only actions that are safe and clearly batch-shaped should appear in `selection action menu`.

Examples:

- `Copy`
- `Duplicate`
- `Delete`

Actions that should not appear for multi-selection:

- `Add lesson`
- `Add exercise`
- `Add checkpoint`
- prerequisite editing
- quick preview
- open details

### Dense-Course Scaling Rule

As menu density rises, the action menu should stay narrower than the context menu.

This means:

- action menu should carry only the fastest, most frequent selected-state actions
- context menu may carry broader or more advanced lists
- list-heavy or rarely used actions should move to context menu or modal rather than expanding the action menu indefinitely

### Resulting Product Rule

The recommended menu contract is:

- `visible CTA / inline affordance` for the dominant structural action at that level
- `selection action menu` for fast, high-frequency selected-state actions
- `context menu` for cursor-local accelerators, advanced actions, and list-heavy options
- `details modal` for dense or structurally sensitive editing

This rule preserves discoverability, keeps selection workflows fast, and prevents the two menus from becoming redundant copies of one another.

### Surface Intent by Menu

To avoid redundancy, each surface should have a slightly different authoring meaning.

#### `Visible CTA / Inline Affordance`

Primary job:

- teach the next obvious action
- preserve discoverability for common structural moves
- reduce dependence on right click or selection-only states

Best fit:

- `Add module`
- `Add lesson`
- `Add exercise`
- `Add checkpoint`
- explicit `Edit` or `Preview` affordance where appropriate

Poor fit:

- long lists
- destructive overflow
- rarely used expert actions

#### `Selection Action Menu`

Primary job:

- accelerate the most likely next step after a valid selection already exists
- keep frequent selected-state actions one click away

Best fit:

- `Add lesson` on selected module
- `Add exercise` / `Add checkpoint` on selected lesson
- `Edit`
- `Quick preview`
- future-safe batch actions like `Copy`, `Duplicate`, `Delete`

Poor fit:

- long or enumerated lists
- cursor-position-dependent actions
- actions that are ambiguous under multi-selection

#### `Context Menu`

Primary job:

- expose cursor-local or target-local accelerators
- hold advanced, list-heavy, or lower-frequency actions
- provide positional actions on blank canvas

Best fit:

- blank-space `Add module`
- blank-space `Paste`
- secondary access to local creation actions
- prerequisite editing when the list is still small
- expert overflow actions on a specific node

Poor fit:

- the only discovery path for common creation steps
- the primary home for selected-state follow-up actions

### Concrete Scenario Examples

The menu split became much clearer once it was tested against realistic author loops rather than abstract rules.

#### Example 1: Empty Course, No Selection

Scenario:

- the creator opens `Build`
- the course has no modules yet
- nothing is selected

Best behavior:

- the header or empty state shows visible `Add module`
- right click on blank canvas offers `Add module`
- if clipboard content exists, blank-space `context menu` may also offer `Paste`

Why this works:

- the primary path is still obvious for a first-time user
- right click becomes a power-user accelerator without carrying discoverability by itself
- the action depends more on canvas location than on selection

What should not happen:

- hiding `Add module` only inside a menu
- showing `Add module` in `selection action menu`, because no meaningful selection exists

#### Example 2: Selected Module, Creator Is Building Structure

Scenario:

- the creator selects a module
- the next likely action is to keep building inside that module

Best behavior:

- the module itself shows a visible `Add lesson` affordance
- `selection action menu` offers `Add lesson`
- module `context menu` also includes `Add lesson` as a secondary accelerator

Why this works:

- the dominant action is attached to the correct parent
- the selected-state action becomes fast without hiding the flow behind right click
- the author can repeat the action quickly during module-building loops

What should not happen:

- forcing the creator to right click for every new lesson
- promoting `Add lesson` into a global top bar, which weakens module containment

#### Example 3: Selected Lesson, Creator Adds Practice Units

Scenario:

- the creator selects a lesson that needs practice and confirmation steps

Best behavior:

- the lesson area shows `Add exercise` and optionally `Add checkpoint`
- `selection action menu` offers `Add exercise`, `Add checkpoint`, `Edit`, and optionally `Quick preview`
- lesson `context menu` repeats `Add exercise` and `Add checkpoint` as secondary access

Why this works:

- these are the most frequent lesson-local follow-up actions
- they depend on the current selected lesson more than on exact cursor position
- the author can move quickly from lesson structure to lesson validation

What should not happen:

- hiding lesson-local creation only in context menu
- placing `Quick preview` on the primary click zone of the lesson card

#### Example 4: Selected Lesson, Creator Needs Deep Editing

Scenario:

- the creator now wants to change title, description, objective, lesson blocks, or references

Best behavior:

- `Edit` is available from `selection action menu`
- double click still opens the details modal as a shortcut
- lesson `context menu` also offers `Edit` as a secondary path
- the actual dense editing happens in the details modal

Why this works:

- edit is frequent enough to deserve a fast selected-state entry point
- the modal keeps dense form fields out of the canvas
- double click remains useful without being the only discoverable entry path

What should not happen:

- requiring double click as the only obvious edit path
- pushing lesson-block editing into compact floating menus

#### Example 5: Selected Child Unit

Scenario:

- the creator selects an `exercise` or `checkpoint`

Best behavior:

- available actions stay narrow: `Edit`, future `Duplicate`, future `Delete`
- the child unit does not expose lesson-level creation actions
- the child unit does not expose prerequisite editing

Why this works:

- child units remain visibly subordinate to lessons
- the hierarchy does not flatten
- the action set matches the semantic role of the node

What should not happen:

- giving child units the same action surface as top-level lessons
- allowing child nodes to feel like peer structure roots

#### Example 6: Lesson with Small Prerequisite Set

Scenario:

- the creator selects a lesson
- there are only one or two reasonable prerequisite candidates

Best behavior:

- lesson `context menu` can expose quick prerequisite toggles
- details modal still contains the full prerequisite editing surface

Why this works:

- prerequisite editing is still advanced and somewhat list-shaped
- right click is acceptable for expert-speed adjustment when the list is short
- the modal remains the stable place for deeper inspection

What should not happen:

- rendering the prerequisite list into the compact `selection action menu`

#### Example 7: Lesson with Many Possible Prerequisites

Scenario:

- the course is larger
- the selected lesson could depend on many other lessons

Best behavior:

- prerequisite editing moves primarily to the details modal
- context menu may still expose a lightweight entry point, but not a huge checklist

Why this works:

- long enumerated lists do not belong in a narrow floating action strip
- the modal can support scanning, reasoning, and safer editing

What should not happen:

- stuffing a long prerequisite checklist into the `selection action menu`
- using the menu as a substitute for a real prerequisite editor

#### Example 8: Dense Module with Many Lessons

Scenario:

- a module has `10-12+` lessons visible
- the workspace is already visually busy

Best behavior:

- the `selection action menu` stays very narrow
- it only shows the fastest selected-state actions
- broader or list-heavy actions stay in `context menu` or modal

Why this works:

- the floating action strip degrades quickly if too many buttons are promoted into it
- dense courses need role clarity more than they need more visible controls

What should not happen:

- turning the selected-state strip into a miniature toolbar with many equal-priority actions
- trying to solve dense-course discoverability by putting every action into the floating menu

#### Example 9: Future Multi-Selection Batch Work

Scenario:

- a future version allows selecting multiple units at once
- the creator wants to copy, duplicate, or delete the selected set

Best behavior:

- `selection action menu` carries only obviously batch-shaped actions:
  - `Copy`
  - `Duplicate`
  - `Delete`
- destructive actions should use confirmation or rely on strong undo support
- right-click remains secondary because it is less clear whether it should act on the target under the cursor or the whole selection

Why this works:

- batch actions are selection-scoped by definition
- the selected-state surface communicates scope more clearly than context menu

What should not happen:

- exposing `Add lesson`, `Add exercise`, `Quick preview`, or prerequisite editing for multi-selection
- making right-click the primary destructive surface for ambiguous batch operations

### Why This Split Wins in Practice

The menu split performed well because each surface answered a different author question:

- `visible CTA / inline affordance` answers: what is the next obvious thing to do here
- `selection action menu` answers: now that this is selected, what is the fastest likely follow-up
- `context menu` answers: what else can I do at this exact spot or on this exact target
- `details modal` answers: where do I perform the dense or sensitive edit without cluttering the canvas

When those questions were blurred, the UX degraded quickly.

The most common failure modes were:

- the same actions duplicated everywhere without different roles
- key structural actions hidden behind right click only
- advanced list-heavy actions pushed into the compact floating action menu
- menus used as substitutes for deep editing surfaces

### Practical Menu Heuristics

The following heuristics survived the scenario modeling:

- if the action is the dominant structural step at that level, it needs an inline or visible CTA
- if the action is frequent and clearly selection-scoped, it belongs in `selection action menu`
- if the action depends on cursor position, blank space, or a long advanced list, it belongs in `context menu`
- if the action edits dense structure or content, it belongs in the details modal
- if the action is destructive and multi-select is involved, selection-scoped behavior is clearer than cursor-scoped behavior

## Alternative Models Considered

### 1. Container-First Canvas

Description:

- modules are strong spatial containers
- lessons are primary child cards inside those containers
- exercises and checkpoints are visibly subordinate children

What worked well:

- aligns with the current product contract
- keeps `Add module` as the one clear top-level structural action
- keeps `Add lesson` local to the module where it belongs
- preserves the distinction between structure editing and content editing
- remains understandable as a course-authoring surface, not a graph editor

What broke:

- if module and unit shapes are too visually similar, hierarchy flattens
- if collapse is not real, larger courses become expensive to scan
- if local actions are too hidden, contextual creation starts feeling undiscoverable

Verdict:

- this is the right backbone
- it only works if hierarchy is visually sharper than it is now

### 2. Flow-Graph Canvas

Description:

- the canvas behaves more like a sequencing or dependency diagram
- modules become lighter anchors
- lessons and arrows carry more of the structure

What looked good:

- can express sequencing and dependency clearly in small cases
- makes prerequisite relations visually explicit

What failed:

- weakens module containment
- makes `Add lesson` less obviously local to a parent module
- encourages users to read the course as a graph, not a structure
- creates line noise quickly
- blurs structure editing and dependency reasoning

Verdict:

- rejected as the primary canvas model
- only limited graph behavior should survive, mainly for prerequisites

### 3. Lesson-Centric Local Constellation

Description:

- each lesson becomes the dominant local node
- exercises and checkpoints cluster around it like satellites

What looked good:

- strong local lesson focus
- lesson editing feels direct and immediate
- useful as a micro-layout for small child counts

What failed:

- weakens module-first course structure
- scales poorly when child counts rise
- makes lessons feel like islands instead of children of modules
- creates visual clutter once a lesson has several child units

Verdict:

- useful as a local sub-pattern only
- rejected as the main course-level grammar

### 4. Hybrid `Course map + Canvas`

Description:

- canvas stays the primary spatial surface
- `Course map` carries more orientation and jumping responsibility

What looked good:

- best answer to large-course navigation
- makes distant modules and lessons easier to find
- reduces pressure on the canvas to carry all orientation alone

What failed when overdone:

- easily drifts into a second editor
- can duplicate structure editing affordances
- creates “where do I act?” confusion if both surfaces can mutate content equally

Verdict:

- keep it
- but keep it navigation-first, not edit-first

## Good Cases Observed

### Empty Course to First Module

Healthy behavior:

- creator lands in `Build`
- sees one clear explanation of what a module is
- sees one dominant action: `Add module`
- after creation, the module appears, becomes selected, and makes `Add lesson` obvious

Why it works:

- the first structural step is unmistakable
- the creator learns the course grammar immediately

### First Lesson Inside a Module

Healthy behavior:

- the selected module exposes a local `Add lesson` affordance
- the new lesson appears inside that module
- the lesson becomes selected
- the details modal opens or is easy to open

Why it works:

- the user sees exactly where the lesson belongs
- creation reinforces containment

### Sparse Prerequisites

Healthy behavior:

- one selected lesson reveals a small number of prerequisite links
- the links explain gating without redrawing the whole course as a graph

Why it works:

- dependency is visible only where it matters
- structure stays dominant

## Bad Cases Observed

### Dead-Blank Build Surface

Bad behavior:

- the user sees a large empty canvas and a generic CTA
- the UI does not explain what a module is or what comes next

Why it fails:

- the first-time author does not yet know the course grammar
- one CTA without conceptual framing is not enough

Conclusion:

- the empty state must teach the structure, not only invite action

### Hidden Local Lesson Creation

Bad behavior:

- `Add lesson` exists only in a context menu or in a fragile selection state

Why it fails:

- contextual actions are correct in theory, but they must still be visible near the parent element

Conclusion:

- contextual actions should be visible at the point of use, not just technically available

### Always-Expanded Large Modules

Bad behavior:

- a module with many lessons remains fully expanded
- the creator keeps scrolling through a long stack of similar cards

Why it fails:

- hierarchy is technically preserved but practically unreadable

Conclusion:

- collapse and compact forms are not polish; they are core usability requirements

### Child-Unit Overexposure

Bad behavior:

- a lesson with many exercises/checkpoints shows all of them as fully visible child cards

Why it fails:

- the lesson loses its primacy
- child units become peers instead of attachments

Conclusion:

- child units must collapse into grouped summaries once density rises

### Graph Noise

Bad behavior:

- lines or arrows are used for parent-child structure, sequence, and prerequisites all at once

Why it fails:

- users stop reading the course as nested structure
- the canvas becomes a graph editor

Conclusion:

- the arrow language must stay singular and narrow

## Hidden Problems That Repeated Across Scenarios

### 1. Context Loss

This was the single most consistent hidden problem.

Observed pattern:

- the creator selects a lesson
- opens modal or preview
- returns
- but no longer feels anchored to the same working location

How it appears in the current implementation:

- any non-single selection collapses back to `course` in `src/features/learning-studio/canvas/LearningCanvasSelectionBridge.ts`

Why it matters:

- a correct selection state is not enough if pan/zoom, focus, and prior context are lost

### 2. False Collapse

Observed pattern:

- `collapsed` exists in state
- but the canvas still behaves as if everything is fully expanded

Why it matters:

- stored collapse state without real density relief does not solve large-course UX

### 3. Hierarchy Flattening

Observed pattern:

- lesson, exercise, and checkpoint share too much of the same base card grammar

Why it matters:

- once counts rise, the whole module reads as one flat list of similar surfaces

### 4. Action Locality Risk

Observed pattern:

- the product wants local actions
- but local actions become harder to discover if they are visually weak or menu-only

Why it matters:

- correct information architecture is not enough without visible local affordances

### 5. Double-Click Fragility

Observed pattern:

- single-click select and double-click edit is conceptually clean
- but can feel unreliable if tiny drag motion causes ambiguity

Why it matters:

- an authoring canvas cannot feel gesture-fragile

### 6. Preview/Structure Boundary Risk

Observed pattern:

- local lesson preview is useful
- but becomes harmful if placed on the main click zone or allowed to compete with selection and drag

Why it matters:

- `Build` must remain authoring-first

## Scaling Thresholds

The following thresholds emerged repeatedly across the modeled scenarios.

### Module Count

- `5+ modules`: collapse affordances should be visible by default
- `8+ modules`: `Course map` and focus-canvas behavior become necessary
- `12+ modules`: some modules should auto-collapse or enter compact mode
- `16+ modules`: canvas-only navigation is no longer sufficient
- `20+ modules`: map becomes the main orientation tool and canvas becomes a local work surface

### Lesson Count Inside One Module

- `8 lessons`: expanded mode is still acceptable
- `10-12 lessons`: compact header, counts, and stronger local creation affordances should appear
- `15+ lessons`: collapse should be a first-class behavior
- `20+ lessons`: expanded view should not remain the default
- `30+ lessons`: summary-first behavior is required

### Child Practice Units Inside One Lesson

- `0-2` child units: direct visibility is fine
- `3-5` child units: still visible, but should become lighter and more compact
- `6+` child units: collapse into grouped summaries should begin
- `8+` child units: compact mode and collapse should be available by default
- `10+` child units: full direct display is usually unjustified

### Dependency Density

- `1-2` prerequisite edges in a local view: can be shown by default if nearby
- `3+` prerequisite edges on one lesson: move to summary/count until the lesson is selected
- `5+` visible dependency edges on one screen: on-demand reveal should replace always-on visibility
- `8+ modules` or `40+ lessons`: dependencies should be hidden by default except for selected/focused contexts

### Screen-Level Heuristic

- `10+ visible nodes` in one viewport
- or more than `2` screenfuls of total visible authoring structure

At that point:

- compression
- jump navigation
- context restoration
- and progressive dependency disclosure

stop being optional.

## Node-Specific UX Implications

### Module

Should appear as:

- the strongest shape on the canvas
- clear container boundary
- persistent header
- title
- local summary
- collapse affordance

Should not appear as:

- just a slightly larger card

### Lesson

Should appear as:

- the primary child card inside a module
- the main semantic unit at the child level
- readable title and light context without opening the modal

Should not appear as:

- visually equivalent to exercise/checkpoint

### Exercise

Should appear as:

- a secondary child practice unit
- lighter and smaller than a lesson
- compact enough not to dominate the parent lesson

### Checkpoint

Should appear as:

- a secondary child unit attached to a lesson
- stronger than a normal exercise in semantic tone
- visually closer to “confirmation gate” than to free practice

Why:

- in the domain, lessons teach, exercises practice, and checkpoints confirm
- checkpoints are explicit validation moments, not decorative labels

That means:

- checkpoint should still be subordinate to the lesson
- but should read as more consequential than a standard exercise

## Connection and Arrow Findings

### Default Rule

No arrows should be used for containment.

Modules contain lessons through nesting.
Lessons contain exercises/checkpoints through attachment and grouping.

Containment should be shown by:

- nesting
- indentation
- grouping
- size
- spacing

not by arrows.

### Allowed Arrow Case

Arrows are justified only for explicit dependency semantics, primarily:

- lesson prerequisite links

This matches the current implementation direction in `src/features/learning-studio/canvas/learningCanvasMapping.ts`.

### Disallowed Arrow Cases

The following arrow uses were consistently harmful:

- module-to-lesson arrows
- lesson-to-exercise arrows
- lesson-to-checkpoint arrows
- decorative sequence arrows between all lessons
- arrows used simply because the layout felt empty

### Best Display Policy

The safest rule for dense courses is:

- hide most dependency arrows by default
- reveal them on lesson selection, focus, or explicit dependency mode

Recommended visual style:

- thin
- muted
- sparse
- clearly secondary to containment
- one singular visual grammar for dependencies

### Why This Is The Best Rule

This preserves:

- structure-first reading
- lower visual noise
- better scaling
- clearer difference between hierarchy and dependency

## Why the Recommended Direction Is Considered Best

It is not “best” because it is the most visually novel.
It is best because it survives the largest number of realistic author scenarios without breaking the course mental model.

It wins on:

- structural clarity
- compatibility with existing implementation direction
- lower cognitive load
- better scaling once compression is added
- a clean split between authoring, editing, navigation, and validation

It beats the alternatives because:

- flow-graph overemphasizes dependencies and weakens containment
- lesson-centric layouts are good locally but weak at course scale
- map-heavy approaches help orientation but become harmful if they become second editors

## Required Implementation Consequences

If the recommended direction is adopted seriously, the following are not optional:

- make collapse real in the canvas, not only stored in state
- make `Course map` navigation-first and content-read-only
- preserve last granular selection and working location across modal, preview, and focus changes
- restore context after modal close and after returning from `Preview`
- differentiate lesson, exercise, and checkpoint more strongly
- keep prerequisite visibility progressive, not persistent
- keep quick preview off the primary click zone of the lesson card

## Known Gaps / Next Research

The current findings are strong on structure, density, hierarchy, collapse, and dependency visibility.
They are still weaker in a few high-value areas that affect whether the canvas remains usable in real authoring work.

These are not small polish gaps.
They are the next research layer needed to make the recommended direction operational.

### 1. Editing Resilience

What is still under-documented:

- `undo` / `redo`
- `delete`
- `duplicate`
- `copy/paste`
- autosave behavior
- recovery after mistakes or failed saves

Why this gap matters:

- the recommended canvas model only feels strong while the author is succeeding
- real authoring requires safe recovery from mistakes, not just happy-path creation
- destructive and high-frequency actions change the UX quality of the whole workspace

Why this is not hypothetical:

- learning canvas content mutation paths already exist in `src/features/learning-studio/canvas/LearningCanvasContentStore.ts`
- shared undo/redo primitives already exist in `src/features/canvas-core/core/services/HistoryService.ts`
- shared autosave behavior already exists in `src/features/canvas-core/CanvasApp.ts`
- authoring direction already expects actions such as `duplicate` and `delete` in `docs/LEARNING-STUDIO-IMPLEMENTATION-BLUEPRINT.md`

What should be analyzed next:

- what actions belong in inline affordances versus action menus versus confirmation flows
- which actions must be undoable immediately
- how autosave, unsaved state, and recovery should be communicated in `Build`
- how destructive actions should behave for module deletion versus lesson deletion versus child-unit deletion

### 2. Input Modes and Accessibility

What is still under-documented:

- keyboard navigation
- shortcut-driven authoring
- focus restore after modal, preview, or map jump
- touch and mobile interaction
- screen reader semantics

Why this gap matters:

- the current interaction contract is still strongly desktop pointer-first
- `single click selects` and `double click opens the details modal` are not enough as a full interaction model
- a valid canvas UX cannot assume a mouse-only world

Why this is not hypothetical:

- the current interaction spec explicitly centers click and double-click behavior in `docs/LEARNING-STUDIO-BUILD-INTERACTION-SPEC.md`
- the shared canvas already has command and shortcut infrastructure in `src/features/canvas-core/core/managers/CommandManager.ts`
- the implementation blueprint already anticipates mobile adaptations such as full-screen sheets in `docs/LEARNING-STUDIO-IMPLEMENTATION-BLUEPRINT.md`

What should be analyzed next:

- keyboard-first selection, edit, creation, and movement loops
- how to expose deep edit without requiring double click
- how focus should be restored after closing modal or preview
- what mobile-specific interaction model replaces hover, right click, and tiny hit areas
- which structural semantics should be exposed to assistive tech

### 3. Large-Canvas Navigation and Viewport Controls

What is still under-documented:

- `Course map` search and filtering
- fast jump patterns
- zoom and pan behavior
- fit-to-selection or recenter controls
- minimap usage
- focus-canvas mode

Why this gap matters:

- the findings already define thresholds where dense courses become hard to scan
- without explicit navigation and viewport tooling, those thresholds remain descriptive rather than actionable
- large-course usability fails first through orientation loss, not only through node appearance

Why this is not hypothetical:

- `docs/LEARNING-STUDIO-CANVAS-AUTHOR-JOURNEYS.md` already calls out `compact search`, `lifecycle filters`, and the lack of a single `focus canvas` control
- `docs/LEARNING-STUDIO-CORE-CANVAS-MIGRATION-STRATEGY.md` already names zoom and pan behavior as a canvas concern

What should be analyzed next:

- when `Course map` becomes the dominant navigation tool
- which search and filter primitives matter most for course authors
- how viewport controls should support fast recovery after jumps
- whether minimap, recenter, and focus mode should be always visible or progressive

### 4. Density and Performance Behavior

What is still under-documented:

- lazy reveal or progressive rendering strategies
- when child units should summarize rather than render fully
- how many visible nodes the workspace should tolerate before forced compression
- what performance tradeoffs are acceptable in large courses

Why this gap matters:

- the findings already define density thresholds, but not yet the operational rendering policy behind them
- once scale increases, performance and readability become the same product problem

What should be analyzed next:

- summary-first behavior for dense lessons and modules
- progressive dependency reveal at scale
- visibility rules for compact mode, collapsed mode, and focused mode
- render/load strategies that preserve responsiveness under mixed overload

### 5. Mode / Version Boundary

What is still under-documented:

- the exact boundary between authoring canvas, creator preview, and real learner runtime
- which actions and visual affordances are allowed only in authoring mode
- how versioning, publishing state, and permissions alter canvas behavior

Why this gap matters:

- the same lesson may appear in multiple modes but cannot carry the same semantics in each one
- mixing preview behavior with learner-runtime behavior would create incorrect expectations about progress and side effects

Why this is not hypothetical:

- `docs/LEARNING-STUDIO-PREVIEW-LEARNER-RUNTIME-SPEC.md` explicitly states that creator preview and real learner runtime are different modes with different data, permissions, and side effects

What should be analyzed next:

- what canvas affordances disappear or change in preview
- how published versus draft state should influence actions
- where permission-aware behavior belongs in the authoring contract

### Recommended Next Passes

The most justified follow-up research passes are now narrow rather than broad:

1. `Undo/redo + delete/duplicate/copy-paste + autosave/recovery`
2. `Keyboard/focus/screen-reader + touch/mobile`
3. `Course map search/filter + zoom/pan/minimap + lazy reveal/performance`

These passes should not re-open the primary canvas model question.
They should stress-test the already preferred model in the areas where the current synthesis is still thin.

## Nice-to-Have Later, Not Required First

The following can wait until the core structure UX is correct:

- richer graph exploration tools
- more expressive dependency visualizations
- stronger inline authoring on the canvas itself
- more decorative node treatments
- additional edge grammars

## Summary

The canvas should not try to be everything at once.

The surviving rule set is:

- modules organize
- lessons anchor learning work
- exercises practice
- checkpoints confirm
- map orients
- modal edits
- preview validates
- arrows explain dependency only when needed

The strongest version of Learning Studio is therefore not the one with the most visible mechanics.
It is the one where the course structure remains obvious under stress:

- many modules
- many lessons
- many child units
- and some real prerequisite logic

That is the standard the recommended direction was chosen against.
