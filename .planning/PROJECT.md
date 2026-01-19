# GSD-JJ

## What This Is

A fork of the Get Shit Done (GSD) context engineering framework adapted to use JJ (Jujutsu) instead of Git, with support for both Claude Code and OpenCode clients. Enables spec-driven development with atomic commits via JJ's modern VCS workflow.

## Core Value

Per-task atomic commits working perfectly with JJ—the commit workflow is the foundation everything else depends on.

## Current State (v1.0)

**Shipped:** 2026-01-15

GSD-JJ v1.0 delivers complete JJ integration with dual-client support:
- 68 files, ~22,000 lines of markdown
- All 19 workflows updated for JJ
- Shared core + adapter architecture
- Unified installer with client detection

## Requirements

### Validated

- ✓ Hierarchical command/workflow/template architecture — existing
- ✓ Subagent-per-plan execution model — existing
- ✓ Plans as executable prompts (PLAN.md) — existing
- ✓ State-based resumption (STATE.md) — existing
- ✓ 28 slash commands for project lifecycle — existing
- ✓ Zero npm dependencies — existing
- ✓ Replace all git commands with JJ equivalents — v1.0
- ✓ Support both colocated (.git backend) and native JJ repos — v1.0
- ✓ Use `jj git push/fetch` for remote operations — v1.0
- ✓ Create shared core (workflows, references, templates) — v1.0
- ✓ Create Claude Code adapter layer (commands/gsd/*.md) — v1.0
- ✓ Create OpenCode adapter layer (adapters/opencode/) — v1.0
- ✓ Single installer that detects client and installs appropriate commands — v1.0

### Active

(None — v1.0 milestone complete, ready for next milestone planning)

### Out of Scope

- Git fallback/backwards compatibility — pure JJ only, no detection/switching
- Advanced JJ features (evolve, obslog, complex revsets) — basic commit/describe/new only for v1
- Full OpenCode feature parity polish — basic support, Claude Code is primary

## Context

**Current Codebase (v1.0):**
- GSD-JJ framework with 28 commands, 19 workflows, 22 templates
- All VCS operations use JJ commands
- Adapter architecture: shared core + client-specific adapters
- Key files: `jj-integration.md`, `adapter-architecture.md`

**Tech Stack:**
- Markdown-based prompts and workflows
- Node.js installer (ES modules, built-ins only)
- JJ for version control

## Constraints

- **Structure**: Preserve GSD directory layout, file naming, workflow patterns — maintains familiarity and documentation validity

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Replace git entirely (no fallback) | Cleaner codebase, JJ-native experience | ✓ Good |
| Shared core + adapters | Avoids duplication, easier maintenance | ✓ Good |
| Support colocated + native JJ | Flexibility for different project setups | ✓ Good |
| jj git push/fetch for remotes | GitHub/GitLab compatibility without pure jj remotes | ✓ Good |
| Use `jj commit` shorthand | Brevity, equivalent to describe + new | ✓ Good |
| Thin adapters, rich core | Adapters handle only path resolution; core handles logic | ✓ Good |

---
*Last updated: 2026-01-15 after v1.0 milestone*
