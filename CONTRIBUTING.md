# Contributing to GSD-JJ

Thank you for your interest in contributing to GSD-JJ! This guide will help you understand the project structure and development workflow.

---

## Overview

GSD-JJ uses a **shared core + client adapters** architecture:

- **Shared Core** (`get-shit-done/`) - Client-agnostic workflows, references, and templates
- **Claude Code Adapter** (`commands/gsd/`) - Thin wrappers for Claude Code slash commands
- **OpenCode Adapter** (`adapters/opencode/`) - Thin wrappers for OpenCode slash commands

**Key principle:** Keep adapters thin, keep core rich. Adapters handle only argument parsing and path resolution. All workflow logic lives in the shared core.

---

## Project Structure

```
get-shit-done-jj/
├── get-shit-done/          # Shared core (client-agnostic)
│   ├── workflows/          # Execution workflows (19 files)
│   ├── references/         # Reference documentation (22 files)
│   └── templates/          # Prompt templates (15 files)
│
├── commands/gsd/           # Claude Code adapter
│   ├── execute-plan.md
│   ├── plan-phase.md
│   └── ...                 # ~20 command files
│
├── adapters/opencode/      # OpenCode adapter (planned)
│   └── command/gsd/
│       ├── execute-plan.md
│       └── ...
│
├── bin/
│   └── install.js          # Interactive installer
│
└── .planning/              # Project planning documents
    ├── PROJECT.md
    ├── ROADMAP.md
    ├── STATE.md
    └── phases/
```

---

## Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/glittercowboy/get-shit-done-jj.git
cd get-shit-done-jj
```

### 2. Install Locally for Testing

```bash
node bin/install.js --claude-code --local
```

This installs to `./.claude/` in the repo for testing your changes.

### 3. Verify Installation

Inside Claude Code:

```
/gsd:help
```

You should see all GSD commands listed.

---

## Making Changes

### Modifying Shared Core

**Location:** `get-shit-done/workflows/`, `get-shit-done/references/`, `get-shit-done/templates/`

**Affects:** Both Claude Code and OpenCode

**Rules:**
- Must remain client-agnostic (no hardcoded paths)
- Use `@~/.claude/` pattern for runtime path resolution
- Test with both Claude Code and OpenCode adapters
- Document any breaking changes

**Example:** Adding a new workflow

```bash
# Create workflow in shared core
touch get-shit-done/workflows/review-code.md

# Edit workflow with client-agnostic logic
# Use @~/.claude/get-shit-done/... for internal references
```

### Adding New Commands

To add a new command, you need to create adapters for each client.

#### 1. Create Shared Workflow (if needed)

If your command needs significant logic:

```bash
touch get-shit-done/workflows/my-new-command.md
```

Write client-agnostic workflow logic here.

#### 2. Create Claude Code Adapter

```bash
touch commands/gsd/my-new-command.md
```

**Structure:**

```markdown
# /gsd:my-new-command

<objective>
Brief description of what this command does.
</objective>

<process>
1. Parse arguments from user input
2. Resolve paths to shared workflows
3. Invoke shared workflow
</process>

<execution_context>
@~/.claude/get-shit-done/workflows/my-new-command.md
@~/.claude/get-shit-done/references/relevant-reference.md
</execution_context>
```

#### 3. Create OpenCode Adapter

```bash
touch adapters/opencode/command/gsd/my-new-command.md
```

Same structure as Claude Code adapter, but paths will be resolved by OpenCode's system.

#### 4. Test Both Clients

- Test command in Claude Code
- Test command in OpenCode (once implemented)
- Verify shared workflow is truly client-agnostic

### Modifying Existing Commands

**Location:** `commands/gsd/` or `adapters/opencode/command/gsd/`

**Affects:** Only the specific client

**When to modify:**
- Changing argument parsing
- Updating help text
- Client-specific bug fixes

**Remember:** If the fix affects workflow logic, update the shared core instead.

---

## Testing

### Manual Testing

1. **Install locally:**
   ```bash
   node bin/install.js --claude-code --local
   ```

2. **Test commands in Claude Code:**
   ```
   /gsd:help
   /gsd:new-project
   /gsd:execute-plan
   ```

3. **Verify workflows execute correctly**

4. **Check generated files:**
   ```bash
   ls .planning/
   cat .planning/PROJECT.md
   ```

### Testing Installer

```bash
# Test interactive mode
node bin/install.js

# Test non-interactive modes
node bin/install.js --claude-code --global
node bin/install.js --claude-code --local
node bin/install.js --opencode --global
```

Verify files are copied to correct locations:
- Global: `~/.claude/` or `~/.config/opencode/`
- Local: `./.claude/` in current directory

---

## Using JJ for Commits

GSD-JJ uses Jujutsu (JJ) for version control. Basic workflow:

### Making Changes

```bash
# Make your changes
# JJ automatically tracks them

# Create a commit
jj commit -m "feat(area): description

More details about the change.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to Git remote (for GitHub)
jj git push
```

### Viewing History

```bash
# View commit log
jj log

# View changes in working copy
jj status

# View diff
jj diff
```

### Common Operations

```bash
# Create new change on top of current
jj new

# Amend current change
jj describe -m "new message"

# Revert a change by ID
jj revert -r <change-id>

# Fetch from Git remote
jj git fetch

# Push to Git remote
jj git push
```

**Note:** If you're more comfortable with Git, you can use Git commands in the colocated repo. Just remember that JJ's change-based workflow is more powerful for atomic commits.

---

## Pull Request Guidelines

### Before Submitting

1. **Test your changes locally**
   - Install with `node bin/install.js --local`
   - Test affected commands
   - Verify no regressions

2. **Ensure code quality**
   - Workflows must remain client-agnostic
   - No hardcoded paths in shared core
   - Use `@~/.claude/` pattern consistently

3. **Update documentation**
   - Update README.md if adding features
   - Update this CONTRIBUTING.md if changing development workflow
   - Add comments to complex workflow logic

### PR Description

Include:
- **What:** Brief summary of changes
- **Why:** Reason for the change
- **Testing:** How you tested it
- **Breaking changes:** If any, document migration path

### Commit Messages

Follow conventional commits:

```
feat(area): add new feature
fix(area): fix bug
docs(area): update documentation
refactor(area): refactor code
test(area): add tests
```

**Areas:** workflows, commands, adapters, installer, references, templates

### Review Process

- Maintainers will review PRs within a few days
- Address feedback and update PR
- Once approved, maintainers will merge

---

## Architecture Guidelines

### Shared Core Must Be Client-Agnostic

Bad:
```markdown
<execution_context>
@/Users/username/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>
```

Good:
```markdown
<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>
```

The `@~/.claude/` pattern is resolved at runtime by each client.

### Adapters Should Be Thin

Bad (too much logic in adapter):
```markdown
# /gsd:execute-plan

1. Read PLAN.md
2. Parse XML tasks
3. Execute each task
4. Commit results
5. Create SUMMARY.md
```

Good (adapter delegates to core):
```markdown
# /gsd:execute-plan

Parse arguments, invoke shared workflow.

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>
```

### Workflows Should Have Single Responsibility

Each workflow should do one thing well:
- `execute-plan.md` - Execute a PLAN.md file
- `plan-phase.md` - Generate plans for a phase
- `new-project.md` - Create PROJECT.md

Don't mix concerns or create god workflows.

---

## Common Tasks

### Adding a New Reference Document

```bash
touch get-shit-done/references/my-reference.md
# Write documentation
# Reference it in workflows with @~/.claude/get-shit-done/references/my-reference.md
```

### Adding a New Template

```bash
touch get-shit-done/templates/my-template.md
# Write template
# Reference it in workflows with @~/.claude/get-shit-done/templates/my-template.md
```

### Updating Installer

Edit `bin/install.js`:
- Add new installation options
- Update file copy logic
- Test with `node bin/install.js`

---

## Getting Help

- **Issues:** [GitHub Issues](https://github.com/glittercowboy/get-shit-done-jj/issues)
- **Discussions:** [GitHub Discussions](https://github.com/glittercowboy/get-shit-done-jj/discussions)
- **Architecture:** See `get-shit-done/references/adapter-architecture.md`

---

## Code of Conduct

Be respectful, be constructive, be helpful. We're all here to make AI coding better.

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to GSD-JJ! Every improvement helps make AI coding more reliable for everyone.
