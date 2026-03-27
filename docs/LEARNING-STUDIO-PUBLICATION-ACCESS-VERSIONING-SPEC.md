# Learning Studio Publication, Access, and Versioning Spec

## Status

- State: decision draft
- Updated: 2026-03-27
- Scope: product and domain rules for publication, access, and versioning
- Related docs:
  - `docs/LEARNING-STUDIO.md`
  - `docs/LEARNING-STUDIO-IMPLEMENTATION-BLUEPRINT.md`
  - `docs/LEARNING-STUDIO-AUTHOR-UX-SPEC.md`

## Why this spec exists

`Learning Studio` cannot be implemented confidently until the product rules for publication, learner access, and course edits are explicit.

Without these rules, the following become unstable:

- publish button behavior
- share/access behavior
- enrollment model
- learner progress integrity
- draft vs live editing semantics

This document defines the recommended v1 direction and the questions it resolves.

## Problem Statement

The ambiguity was concentrated in these questions:

- what exactly is a `draft` course
- what exactly is a `published` course
- whether a creator can edit a course after learners already started it
- whether learners stay on an old version or get moved to a new one
- what `share` actually means
- whether a learner gets permission to consume, copy, or edit

## Recommended v1 Product Position

For v1, `Learning Studio` should optimize for:

- one creator-owned course
- explicit learner access
- stable published versions
- simple, trustworthy learner progress

It should **not** try to solve in v1:

- collaborative course editing
- public marketplace distribution
- public template publishing
- automatic migration of learner progress across changed course structures
- cohort-grade version management

## First Target Segment

Recommended v1 target:

- creator-led courses shared with explicitly invited learners

This means:

- not self-directed open course publishing first
- not mentor/cohort complexity first
- not generic public catalog publishing first

This is the smallest model that still proves the main product thesis:

- a creator can build a course
- a creator can give another user access
- a learner can progress through a stable version of that course

## Core Definitions

### Course

The long-lived authoring object owned by a creator.

### Draft

The mutable working version of a course that the creator is currently editing.

### Published version

An immutable learner-facing snapshot created from a draft at the moment of publish.

### Enrollment

A learner’s right to consume a specific published course version.

### Access grant

A creator-issued permission that allows a learner to open the course.

### Share

In v1, `Share` means:

- grant learner access to consume the course

It does **not** mean:

- collaborative authoring
- public discoverability
- automatic template cloning

## Ownership Model

Recommended v1 rule:

- one course has one owner

Implications:

- only the owner can edit draft structure
- only the owner can publish a new version
- learners never edit the canonical course

Future roles such as editor or reviewer may be added later, but they should not shape the v1 domain contract.

## Publication Model

Recommended v1 lifecycle:

- `draft`
- `published`
- `archived`

### Draft

- editable
- not learner-facing by default
- used for structure changes, metadata updates, and AI refinements

### Published

- learner-facing
- stable snapshot
- safe for enrollments and progress

### Archived

- no longer actively distributed
- remains in history
- may stay readable for the owner

## Versioning Policy

Recommended v1 rule:

- publishing creates a new immutable version snapshot

This means:

- the creator edits the draft
- publish creates `course_version_n`
- learner progress attaches to that published version

### Critical v1 rule

Learner progress should belong to a published version, not to a floating mutable draft.

This prevents fragile cases such as:

- a lesson being deleted after completion
- prerequisites changing after a learner already progressed
- module structure shifting under active learners

## Editing After Publication

Recommended v1 behavior:

- the creator can continue editing the draft after publishing
- those edits do **not** immediately change what current learners consume
- a learner keeps seeing the published version they were enrolled into

This gives a simple and trustworthy rule:

- draft is mutable
- published version is stable

## Learner Upgrade Policy

Recommended v1 rule:

- existing learners remain on the published version they started
- new learners enroll into the latest published version by default

This avoids silent progress corruption.

In v1, do **not** attempt:

- automatic learner migration between versions
- partial progress remapping
- structural diff reconciliation

If the creator wants a materially different learner experience, publishing a new version is the correct mechanism.

## Share and Access Model

Recommended v1 access modes:

- `private draft`
- `published with explicit learner access`

Out of scope for v1:

- anonymous public access
- public catalog listing
- public template marketplace
- editor collaboration by share link

### What `Share` should do in v1

When the creator opens `Share`, they should be able to:

- invite a learner
- revoke learner access
- view which learners currently have access

`Share` should not imply:

- “anyone with this link can edit”
- “anyone with this link can browse all drafts”

## Enrollment Model

Recommended v1 rule:

- enrollment points to a learner and a published course version

Conceptually:

- `CourseAccessGrant` says the learner is allowed in
- `Enrollment` says which published version they are consuming

This distinction matters because permission and progression are not the same thing.

## Progress Integrity Rule

Recommended v1 rule:

- learner progress is version-scoped

This means:

- `LearnerProgress` must reference the published version context
- progress should not be invalidated by draft edits

Without this rule, completion data becomes ambiguous the moment a creator changes structure.

## UX Implications

### In `Overview`

The UI should clearly distinguish:

- draft status
- latest published status
- whether learners are already enrolled

### In `Settings`

The creator should understand:

- whether they are editing a draft
- whether a published version already exists
- whether a new publish will affect only future learners or also current ones

### In `Share`

The UI should communicate:

- this grants learner consumption access
- this is not collaborative editing
- access is tied to published learner-facing material

### In `Preview`

The creator is previewing a learner experience, not becoming a real learner.

That means `Preview` should remain distinct from:

- an actual learner enrollment
- version-bound learner progress

## Recommended v1 Messaging

The product should use language close to:

- `Draft changes are private until you publish`
- `Publishing creates a new learner-facing version`
- `Current learners stay on the version they already started`
- `New learners receive the latest published version`

These messages reduce ambiguity better than generic labels like only `Publish` or `Share`.

## Minimal Data Model Implications

The exact backend schema is future work, but the domain already implies something like:

- `Course`
- `CourseDraft`
- `CourseVersion`
- `CourseAccessGrant`
- `Enrollment`
- `LearnerProgress`

The important point is not the exact class names.
The important point is that mutable authoring state and stable learner state must not be collapsed into one record.

## What this spec resolves

This spec resolves the following product questions for v1:

- what `Share` means
- what `Publish` means
- whether editing after publish is allowed
- whether learners get silently moved to new course structure
- whether progress belongs to mutable draft data

## What this spec does not resolve yet

These still need separate focused decisions:

- exact progress semantics for `started`, `completed`, and `review`
- assessment/checkpoint rules
- whether course topology is linear, graph-based, or hybrid in v1
- how lessons sync into the planning/task system
- AI generation trust and approval policy in detail
- future template and public distribution behavior

## Recommended next follow-up specs

After this document, the next most important design specs are:

1. `Progress + Assessment`
2. `Preview vs real learner runtime`
3. `Planning synchronization`
