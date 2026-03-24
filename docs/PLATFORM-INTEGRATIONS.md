# Platform Integrations

## Status

- State: discovery
- Started: 2026-03-24
- Scope: cross-platform strategy

This document covers external service integrations and delegated execution as platform-level concerns.
It is intentionally separate from feature-specific module docs such as `Learning Studio`.

## Why This Exists

Some work items will not be completed inside this product.
That is true for both planning and learning workflows.

Examples:

- read or watch material in another product
- complete work in GitHub, GitLab, Jira, or Linear
- schedule or verify time blocks in a calendar system
- sync reminders and notifications through communication tools
- launch or verify workflows through automation platforms

The app should therefore behave as a coordination layer even when execution happens elsewhere.

## Core Strategy

The long-term strategy should not be "add many integrations."
It should be:

- build one connector model
- use that model across modules
- prioritize a small number of high-leverage first-party integrations
- cover long-tail integrations through automation platforms where possible

This keeps integration complexity under control and prevents platform strategy from fragmenting into per-feature one-offs.

## Recommended Integration Model

Separate three things:

- planning and coordination inside this app
- execution in either this app or an external system
- verification and sync back into this app

The app remains the system of coordination.
The external service remains the system of execution for work that naturally belongs there.

## Execution Modes

Tasks or work items can be classified by execution mode:

- `internal`
  Fully completed inside the product.
- `external-manual`
  The product sends the user to another place and completion is user-confirmed.
- `external-connected`
  The product launches or syncs with another system and can verify some state automatically.
- `agent-delegated`
  The product sends the work to an external agent or automation and tracks result state.

These modes are platform-level.
Modules such as planning or learning can reuse them rather than inventing their own execution semantics.

## Good First Version

The best initial version is not deep automation.
It is an explicit execution model:

- a work item can point to an external target
- a work item can declare how it is meant to be completed
- the system can store completion evidence or sync status
- AI can suggest the correct execution target, but should not have unrestricted mutation access

## Suggested Domain Concepts

- `ExecutionTarget`
- `ExternalToolConnection`
- `TaskExecutionMode`
- `ExternalRun`
- `CompletionEvidence`
- `VerificationStatus`

These are platform concepts, not learning-specific concepts.

## Product Rules

- the app remains the source of coordination
- external tools remain the source of execution for external work
- completion may be self-reported, tool-verified, or agent-reported
- external mutations should stay confirm-first
- task state and external execution state should be related but not conflated

## Architecture Direction

The current AI assistant architecture already points in a healthy direction:

- tool registry
- bounded tool execution
- confirm-first mutation path

That suggests a future architecture with:

- read and analysis tools
- a connector layer for external systems
- a delegated execution layer for external agents or automations
- explicit approval and auditability at mutation boundaries

## Candidate Service Categories

### Work And Development

- `GitHub`
- `GitLab`
- `Jira`
- `Linear`
- `Notion`

### Calendar And Scheduling

- `Google Calendar`
- `Microsoft Graph`

### Learning Ecosystem

- `Google Classroom`
- `Canvas LMS`
- `Moodle`
- `YouTube`

### Communication

- `Slack`
- `Discord`

### Automation Fabrics

- `Zapier`
- `Make`
- `n8n`

## Recommended Priority

### Tier 1

- `Google Calendar`
- `GitHub`
- `Notion`
- `Slack`
- one automation fabric: `Zapier`, `Make`, or `n8n`

These directly strengthen planning, reminders, execution evidence, and external work coordination.

### Tier 2

- `Microsoft Graph`
- `Jira`
- `Linear`
- `YouTube`

These are highly useful, but depend more on audience and workflow.

### Tier 3

- `Google Classroom`
- `Canvas LMS`
- `Moodle`

These become more important if the product goes deeper into institution-facing or formal education scenarios.

## Open Questions

- which external tools matter enough to influence the shared task model
- which categories deserve deep first-party integrations versus automation-platform coverage
- what evidence is enough to mark external work complete
- when should AI be allowed to trigger external actions directly
- how should failures, retries, or partial completion appear in the shared execution model
