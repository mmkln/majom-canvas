# Learning Studio Canvas Author Journeys

## Status

- State: working audit
- Updated: 2026-03-28
- Scope: creator journey for course creation on canvas
- Related docs:
  - `docs/LEARNING-STUDIO.md`
  - `docs/LEARNING-STUDIO-AUTHOR-UX-SPEC.md`
  - `docs/LEARNING-STUDIO-BUILD-INTERACTION-SPEC.md`
  - `docs/LEARNING-STUDIO-PREVIEW-LEARNER-RUNTIME-SPEC.md`

## Why this doc exists

The product already has screen-level specs, but the actual creator path still risks drifting when individual surfaces are changed in isolation.

This document fixes one narrower question:

- what exact journeys the creator follows while creating a course on canvas
- which surface is primary at each step
- where the workflow currently holds together
- where the workflow still has friction

This is the reference for future `Build` and `Preview` changes.

## Core Rule

Course creation has one dominant path:

1. create or open a course
2. orient on `Overview`
3. build structure on canvas
4. double-click an element to edit details in a modal
5. run fast lesson checks inside `Build` when needed
6. validate the course as a whole in `Preview`
7. return to `Build` until the flow feels coherent

`Canvas` is the primary work surface.
Details modal is the primary editing surface for a selected element.
Quick lesson preview is a local validation aid.
`Preview` is the broader course-level validation surface.

The creator should feel that the course is made on canvas, not in side chrome.

## Important Current Product Reality

The intended journey and the currently implemented journey are close, but not identical.

As of now:

- there is no separate `Create course` screen
- `Create manually` immediately creates an empty course + draft and routes the creator to `Overview`
- `Overview` currently edits only `title` and `description`
- `Build` and `Preview` are recommended by the product flow, but not strictly gated by it
- the current `Build` shell intentionally omits `Course map` and side `Inspector`
- detail editing happens through modal entry from the selected canvas element

This means the document below describes:

- the intended author journey
- and the current product behavior where it differs

## Validation Loops

The creator now has two different validation loops:

- micro-loop inside `Build`: open a quick lesson preview, check one lesson, close it, keep editing
- macro-loop in `Preview`: validate sequence, gating, next-step logic, and overall course coherence

These loops must not collapse into each other.

- quick lesson preview is lesson-local, read-only, and route-local
- `Preview` is course-level, read-only, and broader than any one lesson

## Surface Roles

### Course library

Primary job:

- create a new course
- reopen an existing one

Primary surface:

- course list with one dominant CTA: `Create course`

Secondary surfaces:

- compact search
- lifecycle filters

### Overview

Primary job:

- confirm what the course is
- understand structure at a glance
- choose the next step

Primary surface:

- one integrated page with `Course structure`, lightweight `Course basics`, and `Next step`

Secondary surfaces:

- quick edit for title and description

### Build

Primary job:

- shape the course structure
- add modules
- add lessons
- add exercises and checkpoints
- edit lesson content and prerequisites

Primary surface:

- canvas workspace

Secondary surfaces:

- no persistent side surfaces in the current shell

Tertiary supporting surface:

- quick lesson preview modal from a lesson node

### Preview

Primary job:

- validate the course as a whole from the learner point of view
- confirm sequence, clarity, gating, and next-step logic across the full course

Primary surface:

- read-only course preview surface with overall course context and focused lesson content

Secondary surfaces:

- lesson rail
- lightweight sandbox context

## Canonical Journey 1: First-Time Creator Starts a Course

### Goal

Create the first structure of a new course from scratch.

### Path

1. Enter `Course library`
2. Click `Create course`
3. Land on `Overview`
4. Confirm title and description if needed
5. Click `Build`
6. Click `Add module`
7. Select the new module
8. Click `Add lesson`
9. Select the lesson
10. Start filling lesson content in the details modal

### Primary surfaces by step

- `Course library`: list + create CTA
- `Overview`: orientation + next-step CTA
- `Build`: canvas

### What must be true

- the user never lands on a dead blank workspace
- `Add module` is always visible at the build level
- after creation, the new module becomes selected
- after lesson creation, the lesson becomes selected
- details modal opens from the selected object without route changes

### Current implementation status

- supported
- `Create manually` creates the course immediately and routes to `Overview`
- `Build` now exposes explicit `Add module`
- empty-state canvas shows a creation path
- module and lesson creation are wired through canvas host commands

### Current friction

- there is no explicit "course creation setup" step before `Overview`
- the creator still enters `Overview` first, not directly into `Build`
- this is acceptable, but only if `Overview` remains lightweight
- `Overview` currently captures only `title` and `description`, not the wider authoring context

## Canonical Journey 2: Creator Builds the Main Structure

### Goal

Shape the course into modules, lessons, exercises, and checkpoints.

### Path

1. Work inside `Build`
2. Use `Add module` for top-level structure
3. Use module-level `Add lesson`
4. Select a lesson
5. Use lesson-level actions to add `Exercise` and `Checkpoint`
6. Continue across modules

### Primary surface

- canvas workspace

### Supporting surfaces

- details modal to refine the selected entity

### What must be true

- top-level structural action is always `Add module`
- contextual action for modules is `Add lesson`
- contextual action for lessons is `Add exercise` / `Add checkpoint`
- the user can understand hierarchy at a glance

### Current implementation status

- supported
- canvas actions exist for module, lesson, exercise, and checkpoint creation
- selection sync between canvas and app state is implemented
- `Course map` now reflects the same structure as the canvas document

### Current friction

- `Course map` is useful but still somewhat utilitarian
- module and lesson hierarchy is clearer than before, but still not yet a highly polished construction tree
- `Add lesson` is less discoverable than `Add module` when the map is hidden, because it remains contextual

## Canonical Journey 3: Creator Edits Lesson Details

### Goal

Turn a structural lesson node into a meaningful learning step.

### Path

1. Select lesson from canvas or `Course map`
2. Double-click the lesson to open the details modal
3. Optionally open a quick lesson preview modal from the lesson node or lesson preview action
4. Edit title, description, and objective
5. Add structured blocks
6. Attach exercise/checkpoint references
7. Configure prerequisites

### Primary surface

- details modal

### Supporting surfaces

- canvas keeps context
- course map helps jump to another lesson
- inspector may remain available as a secondary side surface if explicitly shown
- lesson preview modal gives a fast read-only check without leaving `Build`

### What must be true

- only one lesson is edited at a time
- lesson block editing does not require a separate modal editor
- reference picking stays local to the current lesson
- prerequisites are visible and editable inside the details modal without leaving `Build`
- quick lesson preview must be read-only and dismissible without route changes
- quick lesson preview must not steal the normal single-selection gesture if that makes lesson selection less predictable

### Current implementation status

- supported
- structured lesson block editor exists
- prerequisite editing exists in inspector and canvas actions

### Current friction

- lesson editing is already powerful, but the surrounding `Build` shell still needs stronger overall composure than the inspector itself
- the overall flow still assumes the user understands the split between structure on canvas and content in inspector

## Canonical Journey 4: Creator Peeks a Lesson Without Leaving Build

### Goal

Quickly understand how one selected lesson feels to a learner without switching into full-course preview.

### Path

1. Stay inside `Build`
2. Select a lesson node
3. Open a quick lesson preview modal from the lesson node, dedicated preview affordance, or an equivalent low-friction gesture
4. Read the lesson as a learner would
5. Close the modal
6. Continue editing in the same build context

### Primary surface

- lesson preview modal

### Supporting surfaces

- canvas remains visible as the structural context behind the modal
- inspector remains the editing surface after the modal closes

### What must be true

- opening quick preview must not replace `Build`
- the creator must not lose current selection
- the modal must feel like a fast local check, not a second workflow
- the modal should provide a clear path to full `Preview` when a broader validation pass is needed
- if a direct node click opens the modal, selection behavior must still stay predictable and drag gestures must not become fragile

### Current intended position

- planned
- this is the correct role for lesson preview in `Build`
- it should complement, not replace, the full `Preview` stage

### Main risk

- if the modal grows too much, it will start competing with the real `Preview` page
- that would blur the product boundary between local lesson checking and full-course validation

## Canonical Journey 5: Creator Focuses on Canvas

### Goal

Temporarily remove navigation and editing chrome to work directly on the canvas.

### Path

1. Enter `Build`
2. Hide `Course map`
3. Hide `Inspector`
4. Work on canvas with maximum width
5. Reopen either side surface only when needed

### Primary surface

- canvas only

### Supporting surfaces

- hidden until explicitly restored

### What must be true

- hiding side surfaces must not remount or reset the canvas
- the restore controls must remain obvious
- hide/show controls should live close to the surfaces they affect

### Current implementation status

- supported
- `Course map` can be hidden from inside the rail
- `Inspector` can be hidden from inside the inspector pane
- restore controls appear inside the workspace when a panel is hidden

### Current friction

- no single `focus canvas` control yet
- current pattern is functional, but still slightly mechanical

## Canonical Journey 6: Creator Uses Course Map for Navigation

### Goal

Jump quickly across a larger course without relying only on spatial canvas navigation.

### Path

1. Open `Build`
2. Use `Course map` header for orientation
3. Select a module from the map
4. Select a lesson from the map
5. Jump back to canvas context and inspector editing

### Primary surface

- `Course map`

### Supporting surfaces

- canvas
- inspector

### What must be true

- the map is compact and readable
- it does not duplicate the same summary in multiple places
- it is navigation-first, not a second full editor

### Current implementation status

- supported
- duplicate top-level summary was removed from the old root block
- rail header now owns the structural summary

### Current friction

- course map is now cleaner, but still not a final mature tree control
- readiness cues are minimal
- selection and navigation are coherent, but the rail is not yet strong enough to fully replace canvas exploration on large courses

## Canonical Journey 7: Creator Validates in Preview and Returns

### Goal

Check whether the whole course feels coherent without leaving the authoring flow permanently.

### Path

1. Open `Preview` from `Overview` or `Build`
2. See the course as a whole, including module and lesson sequence
3. Inspect the currently focused lesson in learner-facing form
4. Validate blocked lessons, prerequisites, and next-step logic
5. Inspect warnings and broken refs
6. Return to `Build`
7. Fix structure or lesson content

### Primary surface

- full-course preview surface

### Supporting surfaces

- preview lesson rail
- creator sandbox context
- focused lesson presentation inside the broader course-level validation shell

### What must be true

- preview stays read-only
- preview uses draft content for creator validation
- preview does not mutate learner progress
- preview shows enough whole-course structure that the creator understands where the focused lesson sits in the overall flow
- returning to `Build` is always easy
- returning from `Preview` should restore the author to the relevant lesson or module context
- preview must remain broader than a single lesson, otherwise it collapses into the quick lesson modal role

### Current implementation status

- supported as a creator-facing validation surface
- preview is not a second canvas editor
- opening `Preview` from `Build` already carries top-level lesson focus forward when possible

### Current friction

- the handoff back to `Build` should keep feeling immediate
- preview still needs more product polish around "what to do next"
- the route model allows the creator to open `Preview` before the flow is truly ready, even if the product recommendation points back to `Build`
- returning from `Preview` currently falls back too easily to course-level context instead of taking the author back to the lesson or module that needs fixing
- there is still no strong explicit `Back to Build` action inside preview itself; the route switch exists, but the workflow cue is weak

## UX Contract for Build

### What is primary

- canvas workspace

### What is secondary

- `Course map`
- optional `Inspector`

### What is contextual

- `Add lesson`
- `Add exercise`
- `Add checkpoint`
- prerequisite editing

### What should never dominate the screen

- duplicated summary blocks
- repeated top-level stats
- extra action panels competing with canvas
- management actions inside authoring flow

## Current Product Assessment

The current course creation flow is now coherent enough to support real work:

- there is a real first-time path
- `Build` has a usable creation path
- side surfaces can be hidden
- preview is separate from authoring
- route, selection, and creation are all wired through one app-level state model

The flow is not yet fully mature:

- `Course map` still needs refinement as a navigation tree
- `Build` can still become more intentional in spacing and hierarchy
- preview needs a stronger return/continuation story
- the product still relies on recommendation more than enforcement for the intended step order
- preview handoff still needs context preservation, not only stage switching
- quick lesson preview modal still needs a formal implementation contract so it does not drift into a second preview system
- quick lesson preview must be wired carefully so it reduces route switching without weakening single-selection on canvas

## Implementation Anchors

Current key implementation files:

- `src/features/learning-studio/LearningStudioApp.ts`
- `src/features/learning-studio/ui/components/LearningStudioHomeView.ts`
- `src/features/learning-studio/ui/components/LearningStudioOverviewView.ts`
- `src/features/learning-studio/ui/components/LearningStudioBuildStageView.ts`
- `src/features/learning-studio/ui/components/LearningStudioBuildInspectorView.ts`
- `src/features/learning-studio/ui/components/LearningStudioCanvasHostView.ts`
- `src/features/learning-studio/ui/components/LearningStudioPreviewView.ts`
- `src/features/learning-studio/canvas/LearningCanvasInteractionAdapter.ts`
- `src/features/learning-studio/canvas/LearningCanvasHostApi.ts`

## Next Design Priorities

1. Strengthen `Course map` as a mature navigation tree without turning it into a second editor.
2. Add one explicit `focus canvas` action that hides both side surfaces together.
3. Improve `Preview` handoff and next-step clarity.
4. Keep `Overview` lightweight so it does not delay entry into real authoring work.
