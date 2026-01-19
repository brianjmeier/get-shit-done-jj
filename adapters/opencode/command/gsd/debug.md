---
name: gsd:debug
description: Systematic debugging with persistent state across context resets
argument-hint: [issue description]
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
  - Task
  - AskUserQuestion
---

<objective>
Debug issues using scientific method with subagent isolation for investigation.

**Orchestrator role:** Gather symptoms interactively, spawn investigation subagent, handle checkpoints, spawn continuation agents as needed.

**Why subagent:** Investigation burns context fast (reading files, forming hypotheses, testing). Fresh 200k context per investigation attempt. Main context stays lean for user interaction.
</objective>

<execution_context>
@~/.config/opencode/get-shit-done/workflows/debug.md
@~/.config/opencode/get-shit-done/templates/DEBUG.md
@~/.config/opencode/get-shit-done/templates/debug-subagent-prompt.md
</execution_context>

<context>
User's issue: $ARGUMENTS

Check for active debug sessions:
```bash
ls .planning/debug/*.md 2>/dev/null | grep -v resolved | head -5
```
</context>

<process>

## 1. Check Active Sessions

If active sessions exist AND no $ARGUMENTS:
- List sessions with status, hypothesis, next action
- User picks number to resume OR describes new issue

## 2. Gather Symptoms (Main Context)

Use AskUserQuestion for each:

1. **Expected behavior** - What should happen?
2. **Actual behavior** - What happens instead?
3. **Error messages** - Any errors? (paste or describe)
4. **Timeline** - When did this start? Ever worked?
5. **Reproduction** - How do you trigger it?

## 3. Create Debug File

```bash
mkdir -p .planning/debug
```

Create `.planning/debug/{slug}.md` with symptoms and empty sections.

## 4. Spawn Investigation Subagent

Fill debug-subagent-prompt template and spawn Task.

## 5. Handle Subagent Return

**If `## ROOT CAUSE FOUND`:**
- Display root cause and offer fix options

**If `## CHECKPOINT REACHED`:**
- Present checkpoint details, get user response, spawn continuation

**If `## INVESTIGATION INCONCLUSIVE`:**
- Show what was checked and eliminated, offer options

## 6. Spawn Continuation Agent (After Checkpoint)

When user responds to checkpoint, spawn fresh agent with context.

## 7. Fix (Optional)

If user chooses "Fix now" after root cause found, spawn fix agent.

</process>

<success_criteria>
- [ ] Symptoms gathered interactively in main context
- [ ] Investigation runs in subagent (fresh context)
- [ ] Debug file tracks all state across agent boundaries
- [ ] Checkpoints handled via continuation agents
- [ ] Root cause confirmed with evidence before fixing
- [ ] Fix verified and session archived
</success_criteria>
