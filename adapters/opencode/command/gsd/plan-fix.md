---
name: gsd:plan-fix
description: Plan fixes for UAT issues from verify-work
argument-hint: "<phase, e.g., '4'>"
allowed-tools:
  - Read
  - Bash
  - Write
  - Glob
  - Grep
  - AskUserQuestion
  - SlashCommand
---

<objective>
Create FIX.md plan from UAT issues found during verify-work.

Purpose: Plan fixes for issues logged in {phase}-UAT.md.
Output: {phase}-FIX.md in the phase directory, ready for execution.
</objective>

<execution_context>
@~/.config/opencode/get-shit-done/references/plan-format.md
@~/.config/opencode/get-shit-done/references/checkpoints.md
</execution_context>

<context>
Phase: $ARGUMENTS (required - e.g., "4")

@.planning/STATE.md
@.planning/ROADMAP.md
</context>

<process>

<step name="parse">
**Parse phase argument:**

$ARGUMENTS should be a phase number like "4" or "04".

If no argument provided, show error and exit.
</step>

<step name="find">
**Find UAT.md file:**

```bash
ls .planning/phases/${PHASE_ARG}*/*-UAT.md 2>/dev/null
```

Verify file exists and testing is complete.
</step>

<step name="read">
**Read issues from UAT.md:**

Read the "Issues for /gsd:plan-fix" section.
Parse each issue with ID, summary, severity, test number, and root_cause if diagnosed.
</step>

<step name="plan">
**Create fix tasks:**

For each issue (or logical group), create task XML with:
- Root cause (if diagnosed)
- Issue description (verbatim)
- Expected behavior
- Fix approach
- Verification steps
</step>

<step name="write">
**Write FIX.md:**

Create `.planning/phases/XX-name/{phase}-FIX.md` with proper structure.
</step>

<step name="offer">
**Offer execution:**

Use AskUserQuestion to offer:
- Execute fix plan
- Review plan first
- Done for now
</step>

</process>

<success_criteria>
- [ ] UAT.md found and issues parsed
- [ ] Fix tasks created for each issue
- [ ] FIX.md written with proper structure
- [ ] User offered next steps
</success_criteria>
