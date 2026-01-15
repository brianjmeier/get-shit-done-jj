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
cp -r workflows ~/.config/opencode/get-shit-done/
cp -r templates ~/.config/opencode/get-shit-done/
cp -r references ~/.config/opencode/get-shit-done/
```

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

# Update shared core
cp -r workflows ~/.config/opencode/get-shit-done/
cp -r templates ~/.config/opencode/get-shit-done/
cp -r references ~/.config/opencode/get-shit-done/
```
