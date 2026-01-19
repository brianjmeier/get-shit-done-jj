---
name: gsd:plan-milestone-gaps
description: Create phases to close all gaps identified by milestone audit
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
Create all phases necessary to close gaps identified by `/gsd:audit-milestone`.

Reads MILESTONE-AUDIT.md, groups gaps into logical phases, creates phase entries in ROADMAP.md, and offers to plan each phase.

One command creates all fix phases — no manual `/gsd:add-phase` per gap.
</objective>

<execution_context>
@~/.config/opencode/get-shit-done/references/principles.md
@~/.config/opencode/get-shit-done/workflows/plan-phase.md
</execution_context>

<context>
**Audit results:**
Glob: .planning/v*-MILESTONE-AUDIT.md (use most recent)

**Original intent (for prioritization):**
@.planning/PROJECT.md
@.planning/REQUIREMENTS.md

**Current state:**
@.planning/ROADMAP.md
@.planning/STATE.md
</context>

<process>

## 1. Load Audit Results

```bash
# Find the most recent audit file
ls -t .planning/v*-MILESTONE-AUDIT.md 2>/dev/null | head -1
```

Parse YAML frontmatter to extract structured gaps.

## 2. Prioritize Gaps

Group gaps by priority from REQUIREMENTS.md:

| Priority | Action |
|----------|--------|
| `must` | Create phase, blocks milestone |
| `should` | Create phase, recommended |
| `nice` | Ask user: include or defer? |

## 3. Group Gaps into Phases

Cluster related gaps into logical phases (2-4 tasks each).

## 4. Determine Phase Numbers

New phases continue from highest existing phase.

## 5. Present Gap Closure Plan

Show proposed phases and wait for user confirmation.

## 6. Update ROADMAP.md

Add new phases to current milestone.

## 7. Create Phase Directories

```bash
mkdir -p ".planning/phases/{NN}-{name}"
```

## 8. Commit Roadmap Update

```bash
jj commit -m "docs(roadmap): add gap closure phases {N}-{M}"
```

## 9. Offer Next Steps

</process>

<success_criteria>
- [ ] MILESTONE-AUDIT.md loaded and gaps parsed
- [ ] Gaps prioritized (must/should/nice)
- [ ] Gaps grouped into logical phases
- [ ] User confirmed phase plan
- [ ] ROADMAP.md updated with new phases
- [ ] Phase directories created
- [ ] Changes committed
- [ ] User knows to run `/gsd:plan-phase` next
</success_criteria>
