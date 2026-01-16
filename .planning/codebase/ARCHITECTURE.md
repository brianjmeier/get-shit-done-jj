# Architecture

**Analysis Date:** 2026-01-16

## Pattern Overview

**Overall:** Shared Core + Client Adapters (Context Engineering Framework)

**Key Characteristics:**
- Documentation-driven architecture (Markdown as code)
- Thin adapters with rich shared core
- Client-agnostic workflows with client-specific entry points
- Zero runtime dependencies

## Layers

**Command Layer (Entry):**
- Purpose: Slash command definitions - parse arguments, invoke workflows
- Contains: YAML frontmatter + XML-structured prompts
- Location: `commands/gsd/*.md` (Claude Code), `adapters/opencode/command/gsd/*.md` (OpenCode)
- Depends on: Workflow layer via `@` file references
- Used by: AI coding assistants (Claude Code, OpenCode)

**Workflow Layer (Logic):**
- Purpose: Execution logic and orchestration
- Contains: Step-by-step process definitions with `<process>`, `<step>` XML structure
- Location: `get-shit-done/workflows/*.md`
- Depends on: Templates, References
- Used by: Commands

**Template Layer:**
- Purpose: Document generation templates
- Contains: Markdown templates with placeholders for PLAN, SUMMARY, ROADMAP, etc.
- Location: `get-shit-done/templates/*.md`, `get-shit-done/templates/codebase/*.md`
- Depends on: None
- Used by: Workflows

**Reference Layer:**
- Purpose: Guidelines, patterns, best practices
- Contains: Principle documents, debugging guides, format specifications
- Location: `get-shit-done/references/*.md`, `get-shit-done/references/debugging/*.md`
- Depends on: None
- Used by: Commands, Workflows

**Agent Layer:**
- Purpose: Specialized execution agents with defined roles
- Contains: Agent definitions with YAML frontmatter + role specifications
- Location: `agents/gsd-*.md`
- Depends on: Templates, References
- Used by: Workflows (spawned as subagents)

**Installer Layer:**
- Purpose: CLI tool for installation
- Contains: JavaScript ES modules
- Location: `bin/install.js`
- Depends on: Node.js built-ins only
- Used by: End users via `npx gsd-jj`

## Data Flow

**Command Execution:**

1. User invokes slash command (e.g., `/gsd:execute-plan`)
2. Command adapter parses arguments, resolves file references
3. Workflow invocation via `@~/.claude/get-shit-done/workflows/...` reference
4. Workflow loads project state from `.planning/STATE.md`, `ROADMAP.md`, `PROJECT.md`
5. Fresh subagents spawned with templates from `get-shit-done/templates/`
6. Artifacts generated in `.planning/phases/*-PLAN.md`, `*-SUMMARY.md`
7. JJ atomic commits per completed task

**State Management:**
- File-based: All state lives in `.planning/` directory
- Key files: `PROJECT.md`, `STATE.md`, `ROADMAP.md`
- Phase artifacts: `.planning/phases/XX-name/`
- No persistent in-memory state

## Key Abstractions

**Command:**
- Purpose: Entry point for user interaction
- Examples: `commands/gsd/execute-plan.md`, `commands/gsd/new-project.md`
- Pattern: YAML frontmatter + XML-structured content (`<objective>`, `<process>`)

**Workflow:**
- Purpose: Multi-step execution logic
- Examples: `get-shit-done/workflows/execute-plan.md`, `get-shit-done/workflows/plan-phase.md`
- Pattern: `<purpose>`, `<process>`, `<step name="...">` XML structure

**Template:**
- Purpose: Document generation with placeholders
- Examples: `get-shit-done/templates/phase-prompt.md`, `get-shit-done/templates/summary.md`
- Pattern: Markdown with variable substitution

**Agent:**
- Purpose: Specialized execution role
- Examples: `agents/gsd-executor.md`, `agents/gsd-verifier.md`
- Pattern: YAML frontmatter + `<role>`, `<execution_flow>` XML structure

**Checkpoint:**
- Purpose: Blocking points requiring user interaction
- Types: human-verify, decision, human-action
- Reference: `get-shit-done/references/checkpoints.md`

## Entry Points

**CLI Installer:**
- Location: `bin/install.js`
- Triggers: `npx gsd-jj` invocation
- Responsibilities: Parse args, copy files to target directory, handle client selection

**Test Installer:**
- Location: `bin/test-install.js`
- Triggers: Development testing
- Responsibilities: Verify installation behavior for both clients

**Primary Commands:**
- Location: `commands/gsd/new-project.md`, `commands/gsd/execute-plan.md`
- Triggers: User slash command in AI assistant
- Responsibilities: Orchestrate project initialization and plan execution

**Help:**
- Location: `commands/gsd/help.md`
- Triggers: `/gsd:help` command
- Responsibilities: Display available commands and usage

## Error Handling

**Strategy:** File-based validation with user feedback

**Patterns:**
- Check for required files before operations (e.g., `.planning/STATE.md`)
- Use `AskUserQuestion` tool for clarification on errors
- Exit with descriptive error messages
- No exceptions - workflows designed to guide through issues

**Installer Error Handling:**
- try/catch with colored console output
- `process.exit(1)` on failure
- Location: `bin/install.js` lines 198-202

## Cross-Cutting Concerns

**Logging:**
- Workflows: No explicit logging (AI context is the "log")
- Installer: Custom `log()` function with ANSI colors (`bin/install.js`)

**Validation:**
- Workflows: State file checks (does `STATE.md` exist?)
- Commands: Argument validation via YAML frontmatter

**Version Control:**
- JJ (Jujutsu) for atomic commits
- Git colocated for GitHub compatibility
- Reference: `get-shit-done/references/jj-integration.md`

---

*Architecture analysis: 2026-01-16*
*Update when major patterns change*
