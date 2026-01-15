# Adapter Architecture

## Overview

The Get Shit Done (GSD) framework uses a **shared core + client adapters** architecture to support multiple AI coding assistants (Claude Code, OpenCode) without code duplication.

**Core principle:** Workflows, references, and templates are client-agnostic. Client-specific logic lives in thin adapter layers.

## Architecture Pattern

```
┌─────────────────────────────────────────┐
│         Shared Core (Client-Agnostic)   │
│                                          │
│  • Workflows (execute-plan, plan-phase) │
│  • References (checkpoints, tdd)        │
│  • Templates (PLAN, SUMMARY, ROADMAP)   │
│                                          │
│  Location: get-shit-done/               │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
┌───────▼──────┐    ┌──────▼────────┐
│ Claude Code  │    │   OpenCode    │
│   Adapter    │    │    Adapter    │
│              │    │               │
│ commands/    │    │ adapters/     │
│ gsd/*.md     │    │ opencode/     │
│              │    │ command/gsd/  │
└──────────────┘    └───────────────┘
```

## Directory Structure

### Shared Core

```
get-shit-done/
├── workflows/           # Execution workflows (19 files)
│   ├── execute-plan.md
│   ├── plan-phase.md
│   └── ...
├── references/          # Reference documentation (22 files)
│   ├── checkpoints.md
│   ├── jj-integration.md
│   ├── adapter-architecture.md  # This file
│   └── ...
└── templates/           # Prompt templates (15 files)
    ├── phase-prompt.md
    ├── summary.md
    └── ...
```

**Install location:**
- Claude Code: `~/.claude/get-shit-done/`
- OpenCode: `~/.config/opencode/get-shit-done/`

### Claude Code Adapter

```
commands/gsd/
├── execute-plan.md
├── plan-phase.md
├── new-project.md
└── ...
```

**Install location:** `~/.claude/commands/gsd/`

**Responsibilities:**
- Parse slash command arguments (e.g., `/gsd:execute-plan 03-01`)
- Resolve `~/.claude/get-shit-done/` paths
- Invoke shared workflows with appropriate context

### OpenCode Adapter

```
adapters/opencode/command/gsd/
├── execute-plan.md
├── plan-phase.md
├── new-project.md
└── ...
```

**Install location:** `~/.config/opencode/adapters/gsd/` (or similar - structure TBD)

**Responsibilities:**
- Parse OpenCode slash command arguments
- Resolve `~/.config/opencode/get-shit-done/` paths
- Invoke shared workflows with appropriate context

## Path Resolution

### Runtime Path Resolution

All `@~/.claude/get-shit-done/...` references in execution_context sections are resolved at runtime by the client's slash command system.

**Example from PLAN.md:**

```markdown
<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>
```

**Resolution:**
- **Claude Code:** Reads from `~/.claude/get-shit-done/workflows/execute-plan.md`
- **OpenCode:** Reads from `~/.config/opencode/get-shit-done/workflows/execute-plan.md`

The shared core uses the pattern `@~/.claude/` consistently. Each client resolves this to their install location.

### Client Detection

Adapters can detect their client context if needed:

**Claude Code:**
```bash
[ -d ~/.claude/get-shit-done ] && echo "CLAUDE_CODE"
```

**OpenCode:**
```bash
[ -d ~/.config/opencode/get-shit-done ] && echo "OPENCODE"
```

## Adapter Responsibilities

### What Adapters Do

1. **Parse slash command arguments**
   - Extract parameters from user's command
   - Validate and provide defaults
   - Handle help/usage messages

2. **Resolve client-specific paths**
   - Convert generic `get-shit-done/` references to full client paths
   - Example: `get-shit-done/workflows/execute-plan.md` → `~/.claude/get-shit-done/workflows/execute-plan.md`

3. **Invoke shared workflows**
   - Call shared workflow files with resolved paths
   - Pass through execution context
   - Let shared core handle the actual work

### What Adapters Don't Do

1. **Implement workflow logic** - That's in the shared core
2. **Duplicate templates** - Use shared templates
3. **Reimplement references** - Reference shared docs
4. **Contain business logic** - Just routing and path resolution

### Example: execute-plan Command

**Claude Code Adapter (`commands/gsd/execute-plan.md`):**

```markdown
# /gsd:execute-plan

Parse arguments, resolve paths, invoke shared workflow.

<objective>
Execute a PLAN.md file by invoking the shared execute-plan workflow.
</objective>

<process>
1. Parse argument: path to PLAN.md or phase-plan identifier
2. Resolve shared workflow path: ~/.claude/get-shit-done/workflows/execute-plan.md
3. Read and execute shared workflow
4. Pass through all context from shared workflow
</process>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
@~/.claude/get-shit-done/references/checkpoints.md
</execution_context>
```

**OpenCode Adapter (`adapters/opencode/command/gsd/execute-plan.md`):**

```markdown
# /gsd:execute-plan

Parse arguments, resolve paths, invoke shared workflow.

<objective>
Execute a PLAN.md file by invoking the shared execute-plan workflow.
</objective>

<process>
1. Parse argument: path to PLAN.md or phase-plan identifier
2. Resolve shared workflow path: ~/.config/opencode/get-shit-done/workflows/execute-plan.md
3. Read and execute shared workflow
4. Pass through all context from shared workflow
</process>

<execution_context>
@~/.config/opencode/get-shit-done/workflows/execute-plan.md
@~/.config/opencode/get-shit-done/templates/summary.md
@~/.config/opencode/get-shit-done/references/checkpoints.md
</execution_context>
```

**Difference:** Only the path prefix changes. Workflow invocation is identical.

## Adding New Commands

When adding a new command to GSD:

### 1. Create Shared Workflow (if needed)

If the command needs significant logic, create a workflow in `get-shit-done/workflows/`:

```bash
# Example: New command for code review
touch get-shit-done/workflows/review-code.md
```

Keep workflows client-agnostic - no hardcoded paths, no client-specific logic.

### 2. Create Claude Code Adapter

```bash
# Create command file
touch commands/gsd/review-code.md
```

**Structure:**
```markdown
# /gsd:review-code

<objective>Brief description</objective>

<process>
1. Parse arguments
2. Invoke shared workflow
</process>

<execution_context>
@~/.claude/get-shit-done/workflows/review-code.md
</execution_context>
```

### 3. Create OpenCode Adapter

```bash
# Create command file (structure TBD)
touch adapters/opencode/command/gsd/review-code.md
```

Same structure as Claude Code adapter, but with OpenCode paths.

### 4. Test Both Clients

- Verify command works in Claude Code
- Verify command works in OpenCode
- Ensure shared workflow is truly client-agnostic

## Migration from Monolithic to Adapter Pattern

The original GSD framework had all logic in command files. Migration steps:

1. **Extract shared logic** from commands into `get-shit-done/workflows/`
2. **Keep commands thin** - just argument parsing and workflow invocation
3. **Use generic paths** in workflows - `@~/.claude/` pattern for runtime resolution
4. **Test incrementally** - migrate one command at a time

## Benefits of Adapter Architecture

### For Users

- **Consistent experience** across Claude Code and OpenCode
- **Same workflows** regardless of client choice
- **Easy switching** between clients without relearning

### For Maintainers

- **Single source of truth** for workflows and templates
- **Bug fixes once** - benefit both clients
- **New features once** - available everywhere
- **Less code to maintain** - no duplication

### For the Framework

- **Client-agnostic core** - can add new clients without touching core
- **Clean separation** - client concerns don't leak into workflows
- **Testable** - shared core can be tested independently

## JJ Integration

The adapter architecture works seamlessly with JJ (Jujutsu) version control:

- JJ integration logic lives in shared core (`get-shit-done/references/jj-integration.md`)
- Adapters don't need JJ-specific code
- Both clients benefit from JJ's atomic commits and change IDs
- Works with both colocated (`.git` + `.jj`) and native JJ repos

## Future Considerations

### Additional Clients

To add a new AI coding assistant client:

1. Create new adapter directory structure
2. Implement thin command wrappers
3. Test against shared core
4. No changes to shared core needed

### Shared Core Evolution

As GSD evolves:

- Workflows can be enhanced without adapter changes
- New references can be added
- Templates can be refined
- Adapters only change if argument parsing needs change

### Path Resolution Improvements

Future enhancements could include:

- Dynamic path resolution in shared core
- Environment variable based client detection
- Unified installer that detects client automatically

## Summary

The adapter architecture enables:

- **One codebase** for workflows, references, templates
- **Multiple clients** supported without duplication
- **Clean separation** between core logic and client integration
- **Easy maintenance** through shared infrastructure
- **Flexibility** to add new clients without core changes

The pattern is simple: **thin adapters, rich core**. Adapters handle only what must differ between clients. Everything else is shared.
