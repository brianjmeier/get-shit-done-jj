---
phase: 02-core-workflows
plan: 05
subsystem: vcs
tags: [jj, jujutsu, workflows, remaining-workflows]

# Dependency graph
requires:
  - phase: 01-jj-foundation
    provides: jj-integration.md reference with JJ command mappings
  - phase: 02-01
    provides: execute-plan.md workflow using JJ patterns
provides:
  - All remaining workflow files updated with JJ commands
  - Consistent JJ patterns across entire workflow layer
affects: [workflow-consistency, jj-migration]

# Tech tracking
tech-stack:
  added: []
  patterns: [jj-commit-workflow]

key-files:
  created: []
  modified:
    - get-shit-done/workflows/research-project.md
    - get-shit-done/workflows/research-phase.md
    - get-shit-done/workflows/discuss-phase.md
    - get-shit-done/workflows/verify-work.md
    - get-shit-done/workflows/diagnose-issues.md
    - get-shit-done/workflows/debug.md
    - get-shit-done/workflows/map-codebase.md
    - get-shit-done/workflows/define-requirements.md
    - get-shit-done/workflows/create-milestone.md

key-decisions:
  - "Use jj commit for all workflow commits"
  - "Remove git add staging commands - JJ auto-tracks"
  - "Rename git_commit steps to jj_commit for consistency"

patterns-established:
  - "All workflows use jj commit for VCS operations"
  - "No staging commands needed - JJ auto-tracking"

# Metrics
duration: 4min
completed: 2026-01-15
---

# Phase 2 Plan 5: Remaining Workflows Summary

**Updated 9 remaining workflow files to use JJ commands instead of git**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-15T15:05:00Z
- **Completed:** 2026-01-15T15:13:30Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments

- Updated research-project.md to use jj commit for research artifacts
- Updated research-phase.md to use jj commit for phase research
- Updated discuss-phase.md to use jj commit for phase context
- Updated verify-work.md to use jj commit for UAT files
- Updated diagnose-issues.md to use jj commit for root cause documentation
- Updated debug.md to use jj commit for debug fixes
- Updated map-codebase.md to use jj commit for codebase maps
- Updated define-requirements.md to use jj commit for requirements
- Updated create-milestone.md to use jj commit for milestones
- Removed all git add staging commands (JJ auto-tracks)
- Renamed step names from git_commit to jj_commit for consistency

## Task Breakdown

| # | Task | Status | Commit |
|---|------|--------|--------|
| 1 | Update research and discovery workflows | Complete | 6a1520db |
| 2 | Update verification and debugging workflows | Complete | 6a1520db |
| 3 | Update remaining workflows | Complete | 6a1520db |

## Technical Notes

- All 9 workflow files now use jj commit instead of git add + git commit
- The workflow layer is fully JJ-native
- Patterns match execute-plan.md (Plan 01) for consistency

## Related Changes

- Part of Phase 2: Core Workflows
- Completes workflow layer migration to JJ
- Only templates remain (handled by 02-06)
