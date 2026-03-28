# Learning Studio Preview and Learner Runtime Spec

## Status

- State: decision draft
- Updated: 2026-03-28
- Scope: creator preview behavior, real learner runtime behavior, and the product boundary between them
- Related docs:
  - `docs/LEARNING-STUDIO.md`
  - `docs/LEARNING-STUDIO-IMPLEMENTATION-BLUEPRINT.md`
  - `docs/LEARNING-STUDIO-AUTHOR-UX-SPEC.md`
  - `docs/LEARNING-STUDIO-PUBLICATION-ACCESS-VERSIONING-SPEC.md`
  - `docs/LEARNING-STUDIO-PROGRESS-ASSESSMENT-SPEC.md`

## Why this spec exists

The project already decided that creator-facing `Learn` should be treated as `Preview`.

That decision removed one ambiguity, but left another one unresolved:

- what exactly preview is
- how it differs from the real learner experience
- whether preview writes progress
- whether preview and learner runtime use the same UI
- which metadata and controls belong only to the creator

Without these rules, the module risks building a mixed-mode interface that is confusing for both authors and learners.

## Problem Statement

The unresolved questions were:

- whether preview is just the learner screen opened by the creator
- whether preview should simulate progress or write real progress
- whether draft content can be previewed before publication
- whether a learner sees the same navigation and chrome as the creator
- whether preview should expose editing context

This document defines the recommended v1 boundary.

## Recommended v1 Product Position

For v1, `Preview` and real learner runtime should be treated as:

- visually related
- structurally aligned
- behaviorally distinct

They should share the same learning model and much of the same presentation language, but they should not be treated as the same runtime context.

## Core Definitions

### Preview

A creator-facing validation surface used to inspect how a course would feel to a learner.

Preview exists to answer:

- does the course hold together as a whole
- is the sequence understandable
- does the current lesson feel clear
- does the next-step recommendation make sense
- do prerequisites and progression gates behave as intended

Preview is therefore course-level validation, not just a lesson-level peek.

Recommended v1 implication:

- the preview page should show the course-level shell and enough overall structure to explain where the focused lesson sits in the broader flow
- preview should never collapse into a single isolated lesson card without course context

### Quick lesson preview in Build

A lightweight creator-facing modal opened from a lesson node while remaining inside `Build`.

Quick lesson preview exists to answer:

- does this specific lesson read clearly right now
- does the lesson content roughly match its role in the structure
- should the creator keep editing here or move into full-course preview

Recommended v1 rule:

- quick lesson preview is not the same thing as `Preview`
- it does not change the current route
- it does not replace the full preview screen
- it should remain read-only
- it should not break normal lesson selection and drag behavior in `Build`

### Real learner runtime

The actual learner-facing consumption flow for an enrolled learner on a published course version.

Learner runtime exists to support:

- entering the course
- progressing through units
- saving real progress
- resuming from the correct next step

## Core Decision

Recommended v1 rule:

- creator preview is **not** the same thing as real learner runtime

They may reuse many UI components, but they must be treated as different modes with different data, permissions, and side effects.

## Entry Points

### Creator preview entrypoint

The creator reaches preview from the author journey:

- `Home`
- `Course Overview`
- `Build`
- `Preview`

The creator should be able to preview from:

- the course overview
- the build screen

But preview is still conceptually inside the creator workspace.
It is the broader course-level validation checkpoint, not the fastest lesson inspection tool.

### Quick lesson preview entrypoint

The creator reaches quick lesson preview from:

- a lesson node in `Build`
- or a lesson-specific contextual action inside `Build`

It should always feel like a local inspection surface, not a mode switch.
If the product uses click-based opening, it must still preserve predictable build selection semantics.

### Real learner runtime entrypoint

The learner should enter from a learner-facing context such as:

- enrolled course library
- access link that resolves into an enrollment
- assigned course list

The learner should not be entering through creator-oriented course management screens.

## Source of Content

### Preview content source

Recommended v1 rule:

- preview may use the current draft as its content source

This is necessary so the creator can validate unpublished changes before publishing.

### Learner runtime content source

Recommended v1 rule:

- real learner runtime must use a published course version

This follows the versioning rules already defined in:

- `docs/LEARNING-STUDIO-PUBLICATION-ACCESS-VERSIONING-SPEC.md`

Critical implication:

- learner runtime must never point directly at a mutable draft

## Progress and Side Effects

### Preview progress

Recommended v1 rule:

- preview uses sandbox progress only

This means:

- opening lessons in preview may simulate `available`, `in_progress`, `completed`, and `review`
- those state changes exist only for the creator session or a creator-specific preview sandbox
- preview must not modify enrollment progress

### Quick lesson preview progress

Recommended v1 rule:

- quick lesson preview does not simulate sandbox progression
- it is a content check, not a flow simulation environment

### Real learner progress

Recommended v1 rule:

- learner runtime writes real progress for the learner's enrollment on a published course version

This includes:

- started state
- completion state
- review state
- resume position
- next-step recommendation context

## Permission Boundary

### Creator in preview can:

- open any lesson
- inspect blocked paths and prerequisites
- simulate progression
- move freely across the course structure
- see warnings about incomplete or awkward sequencing

### Creator in preview cannot:

- write real learner progress
- impersonate a learner's actual enrollment history
- access creator editing controls from inside the core learner content surface without leaving preview mode

### Learner in runtime can:

- open allowed lessons
- complete lessons, exercises, and checkpoints
- resume progress
- see next recommended steps

### Learner in runtime cannot:

- edit structure
- publish
- grant access
- view creator-only management metadata

## Information Visibility Rules

### Preview should show

- course-level structure and orientation
- learner-facing content
- learner-facing progression cues
- current-step and next-step behavior
- prerequisite and lock behavior
- optional creator-only preview banner or context label
- clear relation between the focused lesson and the wider course sequence

### Preview may also show limited creator context

Only in lightweight supporting surfaces such as:

- a preview badge
- a note that this is sandbox progress
- an exit back to `Build`

It should not clutter the learner surface with authoring controls.

### Quick lesson preview should show

- the selected lesson in learner-facing presentation language
- the lesson's current blocks and references
- lightweight lesson context such as module title
- an obvious CTA to open full `Preview`

### Quick lesson preview should not show

- structure editing controls
- inspector editing controls
- full creator navigation chrome
- simulated learner progression controls

### Learner runtime should show

- only learner-relevant content and progression cues
- enrollment-relevant status
- resume and completion context

### Learner runtime should hide

- draft-only metadata
- creator settings
- publish state controls
- access-management actions
- authoring inspector behavior

## Navigation Model

### Preview navigation

Recommended v1 behavior:

- the creator can jump more freely than a learner
- preview should allow quick switching between lessons or modules to validate the whole flow

This is deliberate.
Preview is a validation environment, not a strict attempt to trap the creator inside learner pacing.

### Quick lesson preview navigation

Recommended v1 behavior:

- the modal stays local to the currently selected lesson
- it should be easy to close and continue editing
- it may link out to full `Preview`
- it should not become a second full navigation shell
- it should not try to simulate the whole course-level validation story

### Learner navigation

Recommended v1 behavior:

- the learner sees one dominant next step
- blocked lessons remain visibly blocked
- navigation should encourage the recommended path even if some exploration remains possible

The learner experience should optimize for clarity and momentum, not author-style inspection.

## UI Relationship

Recommended v1 direction:

- preview and learner runtime should share the same core lesson presentation language
- but they should not share exactly the same surrounding shell

Recommended distinction:

- preview keeps lightweight creator context and an obvious path back to authoring
- learner runtime keeps learner context such as enrolled course state, resume status, and completion summaries
- quick lesson preview keeps even less chrome than preview and behaves as a local build overlay
- preview keeps more course-level structure than quick lesson preview so the creator can reason about the overall flow

## Structural Recommendation

Recommended v1 implementation shape:

- one shared lesson/step presentation system
- one shared course progression model
- two runtime modes:
  - `preview`
  - `learner`

The mode should affect:

- content source
- side effects
- visible controls
- surrounding shell

It should not require a completely separate rendering system unless later complexity proves that necessary.

## Required Distinctions for v1

These distinctions should be enforced explicitly:

- preview can use draft content
- learner runtime uses published content only
- preview uses sandbox progress
- learner runtime writes real enrollment progress
- preview exposes a route back to build
- learner runtime does not expose creator management controls
- quick lesson preview stays lesson-local and does not become a second preview route

## Naming Decision

Creator-facing naming:

- use `Preview`

Learner-facing naming:

- do not call the learner's real experience `Preview`
- it is simply the course or learning experience

This prevents role confusion.

## Analytics and Interpretation

Recommended v1 rule:

- preview behavior should never be mixed into learner analytics

This means:

- preview openings
- preview completions
- preview next-step simulations

must not inflate real learner completion or engagement numbers.

## Explicitly Out of Scope for v1

- creator previewing as a specific real learner identity
- co-viewing or live mentoring inside runtime
- collaborative annotations between creator and learner
- branch-specific analytics
- multiple learner personas in preview

## Decisions This Spec Resolves

- preview is a creator validation mode, not the real learner mode
- preview may use draft content
- learner runtime must use published versions
- preview must use sandbox progress
- learner runtime alone writes real enrollment progress
- preview and learner runtime may share core presentation components, but not the same surrounding product context

## Recommended Next Documentation Step

After this spec, the next most useful clarification is:

- `Build Interaction Spec`

That document should define:

- where modules, lessons, and exercises are created
- what opens inline vs in an inspector or side panel
- what the primary CTA is on each build-state screen
- how the future block-based shell can transition into a stronger canvas-centered experience
