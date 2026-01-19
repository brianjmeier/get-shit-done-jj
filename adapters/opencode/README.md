# GSD-JJ OpenCode Adapter

OpenCode-specific installation and usage for Get Shit Done with Jujutsu.

## Installation

### 1. Install Slash Commands

Copy the OpenCode command files to your OpenCode configuration directory:

```bash
cp -r adapters/opencode/command/gsd ~/.config/opencode/command/
```

### 2. Install Shared Core

The slash commands reference shared workflows, templates, and references. Install these to your OpenCode config:

```bash
mkdir -p ~/.config/opencode/get-shit-done
cp -r get-shit-done/workflows ~/.config/opencode/get-shit-done/
cp -r get-shit-done/templates ~/.config/opencode/get-shit-done/
cp -r get-shit-done/references ~/.config/opencode/get-shit-done/
```

### 3. Install OpenCode-Specific Templates (Critical!)

Some templates contain `@` file references that must point to OpenCode paths. Copy the OpenCode-specific templates to overwrite the generic ones:

```bash
cp -r adapters/opencode/templates/* ~/.config/opencode/get-shit-done/templates/
```

**Why this matters:** The generic templates reference `~/.claude/get-shit-done/...` paths which don't exist in OpenCode installations. The OpenCode-specific templates use `~/.config/opencode/get-shit-done/...` paths instead.

Templates overwritten:
- `subagent-task-prompt.md` - Used when spawning plan execution agents
- `continuation-prompt.md` - Used when resuming after checkpoints
- `phase-prompt.md` - Template for creating PLAN.md files

## Usage

After installation, GSD slash commands are available in OpenCode:

- `/gsd:new-project` - Initialize a new project
- `/gsd:execute-plan` - Execute a PLAN.md file
- `/gsd:plan-phase` - Create detailed execution plan for a phase
- `/gsd:execute-phase` - Execute all plans in a phase
- `/gsd:progress` - Check project progress and route to next action
- `/gsd:help` - Show available commands

## Path Structure

OpenCode uses a different configuration path than Claude Code:

- **Claude Code:** `~/.claude/get-shit-done/`
- **OpenCode:** `~/.config/opencode/get-shit-done/`

The adapter commands in `adapters/opencode/command/gsd/` have been updated to reference the OpenCode paths.

## General GSD Usage

For general Get Shit Done usage, workflow documentation, and methodology, see the main [README.md](../../README.md) in the repository root.

## Updates

To update your OpenCode installation after pulling changes:

```bash
# Update commands
cp -r adapters/opencode/command/gsd ~/.config/opencode/command/

# Update shared core (templates first, then overwrite with OpenCode-specific)
cp -r get-shit-done/workflows ~/.config/opencode/get-shit-done/
cp -r get-shit-done/templates ~/.config/opencode/get-shit-done/
cp -r get-shit-done/references ~/.config/opencode/get-shit-done/
cp -r adapters/opencode/templates/* ~/.config/opencode/get-shit-done/templates/
```
