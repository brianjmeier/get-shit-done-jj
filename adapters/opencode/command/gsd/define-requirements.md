---
name: gsd:define-requirements
description: Define what "done" looks like with checkable requirements
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - AskUserQuestion
---

<objective>
Define concrete, checkable requirements for v1.

Two modes:
1. **With research** — Transform FEATURES.md into scoped requirements
2. **Without research** — Gather requirements through questioning

Run before `/gsd:create-roadmap`.

Output: `.planning/REQUIREMENTS.md`
</objective>

<execution_context>
@~/.config/opencode/get-shit-done/references/principles.md
@~/.config/opencode/get-shit-done/workflows/define-requirements.md
@~/.config/opencode/get-shit-done/templates/requirements.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/research/FEATURES.md (if exists)
@.planning/research/SUMMARY.md (if exists)
</context>

<process>

<step name="validate">
```bash
# Verify project exists
[ -f .planning/PROJECT.md ] || { echo "ERROR: No PROJECT.md found. Run /gsd:new-project first."; exit 1; }

# Check for research
[ -f .planning/research/FEATURES.md ] && echo "HAS_RESEARCH" || echo "NO_RESEARCH"

# Check if requirements already exist
[ -f .planning/REQUIREMENTS.md ] && echo "REQUIREMENTS_EXISTS" || echo "NO_REQUIREMENTS"
```
</step>

<step name="check_existing">
**If REQUIREMENTS_EXISTS:**

Use AskUserQuestion to offer: view existing, replace, or cancel.
</step>

<step name="execute">
**If HAS_RESEARCH:**
Follow the define-requirements.md workflow with research features.

**If NO_RESEARCH:**
Gather requirements through questioning.

Same output format either way.
</step>

<step name="done">
```
Requirements defined:

- Requirements: .planning/REQUIREMENTS.md
- v1 scope: [N] requirements across [M] categories
- v2 scope: [X] requirements deferred
- Out of scope: [Y] requirements excluded

---

## ▶ Next Up

**Create roadmap** — phases mapped to requirements

`/gsd:create-roadmap`

<sub>`/clear` first → fresh context window</sub>

---
```
</step>

</process>

<success_criteria>
- [ ] PROJECT.md validated
- [ ] Features gathered (from research OR questioning)
- [ ] User scoped each category (v1/v2/out of scope)
- [ ] User had opportunity to add missing requirements
- [ ] REQUIREMENTS.md created with checkable list
- [ ] Requirements committed to JJ
- [ ] User knows next step (create-roadmap)
</success_criteria>
