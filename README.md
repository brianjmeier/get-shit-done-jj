# GET SHIT DONE (JJ Fork)

**A JJ-first fork of [glittercowboy/get-shit-done](https://github.com/glittercowboy/get-shit-done) -- the meta-prompting, context engineering and spec-driven development system.**

This fork replaces all Git commands with [JJ (Jujutsu)](https://github.com/martinvonz/jj) equivalents and includes an adaptation script to generate OpenCode-compatible packages.

---

## What's Different

| Upstream GSD | This Fork |
|--------------|-----------|
| Git commands (`git add`, `git commit`) | JJ commands (`jj commit`, `jj status`) |
| `git-integration.md` reference | `jj-integration.md` reference |
| Claude Code only | Includes OpenCode adapter + transformation script |

### JJ Benefits for GSD

- **No staging area** -- JJ auto-tracks all changes, eliminating `git add` steps
- **Change IDs persist through rebases** -- More stable references than commit hashes
- **Working copy IS a commit** -- Every save is tracked, safer workflow
- **Conflicts as first-class citizens** -- Continue working while conflicts exist

---

## Installation

### For Claude Code (JJ workflows)

Clone and install locally:

```bash
git clone https://github.com/brianjmeier/get-shit-done-jj.git
cd get-shit-done-jj
node bin/install.js --local
```

Or install globally:

```bash
node bin/install.js --global
```

### For OpenCode

Generate the OpenCode package using the transformation script:

```bash
node scripts/gsd-to-opencode.cjs --output ./gsd-opencode
cd gsd-opencode
npm pack
npx ./gsd-opencode-*.tgz
```

---

## The Transformation Script

`scripts/gsd-to-opencode.cjs` transforms this repo into an OpenCode-compatible npm package.

**What it does:**
- Converts paths: `~/.claude/` -> `~/.config/opencode/`
- Converts commands: `/gsd:foo` -> `/gsd-foo`
- Converts directories: `commands/` -> `command/`
- Updates tool references: `AskUserQuestion` -> `question`
- Generates OpenCode-compatible `package.json` and `bin/install.js`

**Usage:**

```bash
# Basic - uses current repo as source
node scripts/gsd-to-opencode.cjs

# Specify output directory
node scripts/gsd-to-opencode.cjs --output ./my-gsd-opencode

# Preview without writing
node scripts/gsd-to-opencode.cjs --dry-run --verbose

# Show help
node scripts/gsd-to-opencode.cjs --help
```

---

## How It Works

> **Already have code?** Run `/gsd:map-codebase` first. It spawns parallel agents to analyze your stack, architecture, conventions, and concerns. Then `/gsd:new-project` knows your codebase -- questions focus on what you're adding, and planning automatically loads your patterns.

### 1. Initialize Project

```
/gsd:new-project
```

One command, one flow. The system:

1. **Questions** -- Asks until it understands your idea completely (goals, constraints, tech preferences, edge cases)
2. **Research** -- Spawns parallel agents to investigate the domain (optional but recommended)
3. **Requirements** -- Extracts what's v1, v2, and out of scope
4. **Roadmap** -- Creates phases mapped to requirements

You approve the roadmap. Now you're ready to build.

**Creates:** `PROJECT.md`, `REQUIREMENTS.md`, `ROADMAP.md`, `STATE.md`, `.planning/research/`

---

### 2. Discuss Phase

```
/gsd:discuss-phase 1
```

**This is where you shape the implementation.**

Your roadmap has a sentence or two per phase. That's not enough context to build something the way *you* imagine it. This step captures your preferences before anything gets researched or planned.

The system analyzes the phase and identifies gray areas based on what's being built:

- **Visual features** -> Layout, density, interactions, empty states
- **APIs/CLIs** -> Response format, flags, error handling, verbosity
- **Content systems** -> Structure, tone, depth, flow
- **Organization tasks** -> Grouping criteria, naming, duplicates, exceptions

For each area you select, it asks until you're satisfied. The output -- `CONTEXT.md` -- feeds directly into the next two steps:

1. **Researcher reads it** -- Knows what patterns to investigate ("user wants card layout" -> research card component libraries)
2. **Planner reads it** -- Knows what decisions are locked ("infinite scroll decided" -> plan includes scroll handling)

The deeper you go here, the more the system builds what you actually want. Skip it and you get reasonable defaults. Use it and you get *your* vision.

**Creates:** `{phase}-CONTEXT.md`

---

### 3. Plan Phase

```
/gsd:plan-phase 1
```

The system:

1. **Researches** -- Investigates how to implement this phase, guided by your CONTEXT.md decisions
2. **Plans** -- Creates 2-3 atomic task plans with XML structure
3. **Verifies** -- Checks plans against requirements, loops until they pass

Each plan is small enough to execute in a fresh context window. No degradation, no "I'll be more concise now."

**Creates:** `{phase}-RESEARCH.md`, `{phase}-{N}-PLAN.md`

---

### 4. Execute Phase

```
/gsd:execute-phase 1
```

The system:

1. **Runs plans in waves** -- Parallel where possible, sequential when dependent
2. **Fresh context per plan** -- 200k tokens purely for implementation, zero accumulated garbage
3. **Commits per task** -- Every task gets its own atomic commit
4. **Verifies against goals** -- Checks the codebase delivers what the phase promised

Walk away, come back to completed work with clean JJ history.

**Creates:** `{phase}-{N}-SUMMARY.md`, `{phase}-VERIFICATION.md`

---

### 5. Verify Work

```
/gsd:verify-work 1
```

**This is where you confirm it actually works.**

Automated verification checks that code exists and tests pass. But does the feature *work* the way you expected? This is your chance to use it.

The system:

1. **Extracts testable deliverables** -- What you should be able to do now
2. **Walks you through one at a time** -- "Can you log in with email?" Yes/no, or describe what's wrong
3. **Diagnoses failures automatically** -- Spawns debug agents to find root causes
4. **Creates verified fix plans** -- Ready for immediate re-execution

If everything passes, you move on. If something's broken, you don't manually debug -- you just run `/gsd:execute-phase` again with the fix plans it created.

**Creates:** `{phase}-UAT.md`, fix plans if issues found

---

### 6. Repeat -> Complete -> Next Milestone

```
/gsd:discuss-phase 2
/gsd:plan-phase 2
/gsd:execute-phase 2
/gsd:verify-work 2
...
/gsd:complete-milestone
/gsd:new-milestone
```

Loop **discuss -> plan -> execute -> verify** until milestone complete.

Each phase gets your input (discuss), proper research (plan), clean execution (execute), and human verification (verify). Context stays fresh. Quality stays high.

When all phases are done, `/gsd:complete-milestone` archives the milestone and tags the release.

Then `/gsd:new-milestone` starts the next version -- same flow as `new-project` but for your existing codebase. You describe what you want to build next, the system researches the domain, you scope requirements, and it creates a fresh roadmap. Each milestone is a clean cycle: define -> build -> ship.

---

### Quick Mode

```
/gsd:quick
```

**For ad-hoc tasks that don't need full planning.**

Quick mode gives you GSD guarantees (atomic commits, state tracking) with a faster path:

- **Same agents** -- Planner + executor, same quality
- **Skips optional steps** -- No research, no plan checker, no verifier
- **Separate tracking** -- Lives in `.planning/quick/`, not phases

Use for: bug fixes, small features, config changes, one-off tasks.

```
/gsd:quick
> What do you want to do? "Add dark mode toggle to settings"
```

**Creates:** `.planning/quick/001-add-dark-mode-toggle/PLAN.md`, `SUMMARY.md`

---

## Why It Works

### Context Engineering

Claude Code is incredibly powerful *if* you give it the context it needs. Most people don't.

GSD handles it for you:

| File | What it does |
|------|--------------|
| `PROJECT.md` | Project vision, always loaded |
| `research/` | Ecosystem knowledge (stack, features, architecture, pitfalls) |
| `REQUIREMENTS.md` | Scoped v1/v2 requirements with phase traceability |
| `ROADMAP.md` | Where you're going, what's done |
| `STATE.md` | Decisions, blockers, position -- memory across sessions |
| `PLAN.md` | Atomic task with XML structure, verification steps |
| `SUMMARY.md` | What happened, what changed, committed to history |
| `todos/` | Captured ideas and tasks for later work |

Size limits based on where Claude's quality degrades. Stay under, get consistent excellence.

### XML Prompt Formatting

Every plan is structured XML optimized for Claude:

```xml
<task type="auto">
  <name>Create login endpoint</name>
  <files>src/app/api/auth/login/route.ts</files>
  <action>
    Use jose for JWT (not jsonwebtoken - CommonJS issues).
    Validate credentials against users table.
    Return httpOnly cookie on success.
  </action>
  <verify>curl -X POST localhost:3000/api/auth/login returns 200 + Set-Cookie</verify>
  <done>Valid credentials return cookie, invalid return 401</done>
</task>
```

Precise instructions. No guessing. Verification built in.

### Multi-Agent Orchestration

Every stage uses the same pattern: a thin orchestrator spawns specialized agents, collects results, and routes to the next step.

| Stage | Orchestrator does | Agents do |
|-------|------------------|-----------|
| Research | Coordinates, presents findings | 4 parallel researchers investigate stack, features, architecture, pitfalls |
| Planning | Validates, manages iteration | Planner creates plans, checker verifies, loop until pass |
| Execution | Groups into waves, tracks progress | Executors implement in parallel, each with fresh 200k context |
| Verification | Presents results, routes next | Verifier checks codebase against goals, debuggers diagnose failures |

The orchestrator never does heavy lifting. It spawns agents, waits, integrates results.

**The result:** You can run an entire phase -- deep research, multiple plans created and verified, thousands of lines of code written across parallel executors, automated verification against goals -- and your main context window stays at 30-40%. The work happens in fresh subagent contexts. Your session stays fast and responsive.

### Atomic JJ Commits

Each task gets its own commit immediately after completion:

```
abc123f docs(08-02): complete user registration plan
def456g feat(08-02): add email confirmation flow  
hij789k feat(08-02): implement password hashing with bcrypt
lmn012o feat(08-02): create user registration endpoint
```

JJ change IDs persist through rebases, making history more stable than git commit hashes.

---

## Commands

### Core Workflow

| Command | What it does |
|---------|--------------|
| `/gsd:new-project` | Full initialization: questions -> research -> requirements -> roadmap |
| `/gsd:plan-phase [N]` | Research + plan + verify for a phase |
| `/gsd:execute-phase <N>` | Execute all plans in parallel waves, verify when complete |
| `/gsd:verify-work [N]` | Manual user acceptance testing |
| `/gsd:audit-milestone` | Verify milestone achieved its definition of done |
| `/gsd:complete-milestone` | Archive milestone, tag release |
| `/gsd:new-milestone [name]` | Start next version: questions -> research -> requirements -> roadmap |

### Navigation

| Command | What it does |
|---------|--------------|
| `/gsd:progress` | Where am I? What's next? |
| `/gsd:help` | Show all commands and usage guide |
| `/gsd:whats-new` | See what changed since your installed version |
| `/gsd:update` | Update GSD with changelog preview |

### Brownfield

| Command | What it does |
|---------|--------------|
| `/gsd:map-codebase` | Analyze existing codebase before new-project |

### Phase Management

| Command | What it does |
|---------|--------------|
| `/gsd:add-phase` | Append phase to roadmap |
| `/gsd:insert-phase [N]` | Insert urgent work between phases |
| `/gsd:remove-phase [N]` | Remove future phase, renumber |
| `/gsd:list-phase-assumptions [N]` | See Claude's intended approach before planning |
| `/gsd:plan-milestone-gaps` | Create phases to close gaps from audit |

### Session

| Command | What it does |
|---------|--------------|
| `/gsd:pause-work` | Create handoff when stopping mid-phase |
| `/gsd:resume-work` | Restore from last session |

### Utilities

| Command | What it does |
|---------|--------------|
| `/gsd:settings` | Configure model profile and workflow agents |
| `/gsd:set-profile <profile>` | Switch model profile (quality/balanced/budget) |
| `/gsd:add-todo [desc]` | Capture idea for later |
| `/gsd:check-todos` | List pending todos |
| `/gsd:debug [desc]` | Systematic debugging with persistent state |
| `/gsd:quick` | Execute ad-hoc task with GSD guarantees |

---

## Configuration

GSD stores project settings in `.planning/config.json`. Configure during `/gsd:new-project` or update later with `/gsd:settings`.

### Core Settings

| Setting | Options | Default | What it controls |
|---------|---------|---------|------------------|
| `mode` | `yolo`, `interactive` | `interactive` | Auto-approve vs confirm at each step |
| `depth` | `quick`, `standard`, `comprehensive` | `standard` | Planning thoroughness (phases x plans) |

### Model Profiles

Control which Claude model each agent uses. Balance quality vs token spend.

| Profile | Planning | Execution | Verification |
|---------|----------|-----------|--------------|
| `quality` | Opus | Opus | Sonnet |
| `balanced` (default) | Opus | Sonnet | Sonnet |
| `budget` | Sonnet | Sonnet | Haiku |

Switch profiles:
```
/gsd:set-profile budget
```

Or configure via `/gsd:settings`.

### Workflow Agents

These spawn additional agents during planning/execution. They improve quality but add tokens and time.

| Setting | Default | What it does |
|---------|---------|--------------|
| `workflow.research` | `true` | Researches domain before planning each phase |
| `workflow.plan_check` | `true` | Verifies plans achieve phase goals before execution |
| `workflow.verifier` | `true` | Confirms must-haves were delivered after execution |

Use `/gsd:settings` to toggle these, or override per-invocation:
- `/gsd:plan-phase --skip-research`
- `/gsd:plan-phase --skip-verify`

### Execution

| Setting | Default | What it controls |
|---------|---------|------------------|
| `parallelization.enabled` | `true` | Run independent plans simultaneously |
| `planning.commit_docs` | `true` | Track `.planning/` in version control |

---

## Staying in Sync with Upstream

This fork tracks `glittercowboy/get-shit-done`. To pull in upstream changes:

```bash
# Fetch latest upstream
jj git fetch --remote upstream

# Rebase your work onto upstream
jj rebase -d main@upstream

# Re-apply JJ transformations if needed (workflows may have new git commands)
# Then regenerate the OpenCode package
node scripts/gsd-to-opencode.cjs --output ./gsd-opencode
```

---

## JJ Command Reference

See `get-shit-done/references/jj-integration.md` for the full JJ workflow guide.

Quick reference:

| Git | JJ |
|-----|-----|
| `git status` | `jj status` |
| `git add . && git commit -m "msg"` | `jj commit -m "msg"` |
| `git log` | `jj log` |
| `git diff` | `jj diff` |
| `git push` | `jj git push --bookmark main` |

---

## Project Structure

```
get-shit-done-jj/
├── commands/gsd/              # Claude Code slash commands
├── adapters/opencode/         # OpenCode-specific commands
├── get-shit-done/
│   ├── workflows/             # JJ-first workflow definitions
│   ├── templates/             # Planning templates
│   └── references/
│       └── jj-integration.md  # JJ workflow guide
├── agents/                    # GSD subagent definitions
├── scripts/
│   └── gsd-to-opencode.cjs    # CC->OC transformation script
└── bin/
    └── install.js             # Installer
```

---

## License

MIT License. See [LICENSE](LICENSE) for details.

---

**Upstream:** [glittercowboy/get-shit-done](https://github.com/glittercowboy/get-shit-done)
