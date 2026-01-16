# Codebase Structure

**Analysis Date:** 2026-01-16

## Directory Layout

```
get-shit-done-jj/
├── adapters/                      # Client-specific adapters
│   └── opencode/                  # OpenCode adapter
│       ├── README.md              # OpenCode installation guide
│       └── command/gsd/           # 31 OpenCode slash commands
├── agents/                        # Specialized execution agents (4 files)
├── assets/                        # Static assets
├── bin/                           # CLI entry points
├── commands/                      # Claude Code adapter
│   └── gsd/                       # 30 Claude Code slash commands
├── get-shit-done/                 # SHARED CORE (client-agnostic)
│   ├── references/                # Guidelines and patterns
│   │   └── debugging/             # Debugging reference docs
│   ├── templates/                 # Document templates
│   │   ├── codebase/              # Codebase mapping templates (7 files)
│   │   └── research-project/      # Research output templates
│   └── workflows/                 # Execution workflows (20 files)
├── test-output/                   # Test output files
├── .planning/                     # (Generated per-project)
├── package.json                   # npm package definition
└── README.md                      # Main documentation
```

## Directory Purposes

**adapters/opencode/**
- Purpose: OpenCode-specific adapter layer
- Contains: Slash commands with OpenCode paths (`@~/.config/opencode/...`)
- Key files: `command/gsd/execute-plan.md`, `command/gsd/new-project.md`
- Subdirectories: `command/gsd/` (31 command files)

**agents/**
- Purpose: Specialized agent definitions for subagent spawning
- Contains: Agent role definitions with YAML frontmatter
- Key files: `gsd-executor.md`, `gsd-verifier.md`, `gsd-integration-checker.md`, `gsd-milestone-auditor.md`
- Subdirectories: None

**bin/**
- Purpose: CLI entry points
- Contains: JavaScript ES modules for installation
- Key files: `install.js` (main installer), `test-install.js` (test suite)
- Subdirectories: None

**commands/gsd/**
- Purpose: Claude Code slash command definitions
- Contains: 30 command files with YAML frontmatter
- Key files: `execute-plan.md`, `new-project.md`, `help.md`, `progress.md`
- Subdirectories: None (flat structure)

**get-shit-done/references/**
- Purpose: Core philosophy and guidance documents
- Contains: Principles, patterns, integration guides
- Key files: `principles.md`, `checkpoints.md`, `jj-integration.md`, `plan-format.md`
- Subdirectories: `debugging/` (5 debugging reference docs)

**get-shit-done/templates/**
- Purpose: Document templates for `.planning/` files
- Contains: Template definitions with placeholders
- Key files: `phase-prompt.md`, `summary.md`, `roadmap.md`, `project.md`
- Subdirectories: `codebase/` (7 files), `research-project/` (5 files)

**get-shit-done/workflows/**
- Purpose: Reusable multi-step execution procedures
- Contains: Workflow definitions with `<process>`, `<step>` XML structure
- Key files: `execute-plan.md`, `plan-phase.md`, `verify-phase.md`, `debug.md`
- Subdirectories: None

## Key File Locations

**Entry Points:**
- `bin/install.js` - CLI installer (`npx gsd-jj`)
- `bin/test-install.js` - Installation test suite
- `commands/gsd/new-project.md` - Project initialization command
- `commands/gsd/execute-plan.md` - Plan execution command

**Configuration:**
- `package.json` - npm package manifest
- `get-shit-done/templates/config.json` - Project config template

**Core Logic:**
- `get-shit-done/workflows/execute-plan.md` - Main execution workflow (1,803 lines)
- `get-shit-done/workflows/plan-phase.md` - Phase planning workflow
- `get-shit-done/workflows/verify-phase.md` - Verification workflow

**Testing:**
- `bin/test-install.js` - Installation integration tests
- `test-output/` - Test artifacts (should be gitignored)

**Documentation:**
- `README.md` - User-facing documentation
- `CONTRIBUTING.md` - Contributor guidelines
- `CHANGELOG.md` - Version history
- `adapters/opencode/README.md` - OpenCode adapter docs

## Naming Conventions

**Files:**
- `kebab-case.md` for commands, workflows, templates: `execute-plan.md`
- `kebab-case.js` for JavaScript: `install.js`, `test-install.js`
- `UPPERCASE.md` for important project files: `README.md`, `CHANGELOG.md`

**Directories:**
- `kebab-case` for all directories: `get-shit-done/`, `research-project/`
- Plural for collections: `templates/`, `workflows/`, `references/`

**Special Patterns:**
- `gsd-*.md` for agent definitions: `gsd-executor.md`, `gsd-verifier.md`
- Planning artifacts use UPPERCASE: `PROJECT.md`, `ROADMAP.md`, `STATE.md`
- Phase directories: `XX-kebab-name/` (e.g., `01-foundation/`, `02-core-features/`)
- Plan files: `{phase}-{plan}-PLAN.md` (e.g., `01-01-PLAN.md`)

## Where to Add New Code

**New Slash Command:**
- Claude Code: `commands/gsd/{command-name}.md`
- OpenCode: `adapters/opencode/command/gsd/{command-name}.md`
- Must update both adapters for consistency

**New Workflow:**
- Implementation: `get-shit-done/workflows/{name}.md`
- Usage: Reference from command with `@~/.claude/get-shit-done/workflows/{name}.md`

**New Template:**
- Implementation: `get-shit-done/templates/{name}.md`
- Codebase templates: `get-shit-done/templates/codebase/{NAME}.md`

**New Reference Document:**
- Implementation: `get-shit-done/references/{name}.md`
- Debugging refs: `get-shit-done/references/debugging/{name}.md`

**New Agent:**
- Implementation: `agents/gsd-{role}.md`
- Follow existing agent structure with YAML frontmatter

**Utilities:**
- No utility directory yet
- If extracting from `bin/install.js`: create `src/utils/` or `lib/`

## Special Directories

**get-shit-done/**
- Purpose: Shared core resources (client-agnostic)
- Source: Copied by `bin/install.js` during installation
- Committed: Yes (source of truth)
- Note: Should not contain client-specific paths, but currently has some violations

**commands/**
- Purpose: Claude Code adapter layer
- Source: Copied to `~/.claude/commands/` during installation
- Committed: Yes

**adapters/opencode/**
- Purpose: OpenCode adapter layer
- Source: Copied to `~/.config/opencode/` during installation
- Committed: Yes

**test-output/**
- Purpose: Test artifacts
- Source: Generated by tests
- Committed: Should be gitignored

**.planning/** (in user projects)
- Purpose: Project planning artifacts
- Source: Generated by workflows
- Committed: Yes (version controlled with project)

---

*Structure analysis: 2026-01-16*
*Update when directory structure changes*
