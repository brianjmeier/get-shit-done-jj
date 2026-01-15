<div align="center">

# GSD-JJ: Get Shit Done with Jujutsu

**A powerful meta-prompting, context engineering and spec-driven development system for AI coding assistants — powered by Jujutsu VCS.**

**Solves context rot with atomic commits and change-based workflows.**

[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)
[![JJ Integration](https://img.shields.io/badge/VCS-Jujutsu-orange?style=for-the-badge)](https://github.com/martinvonz/jj)

<br>

```bash
npx github:brianjmeier/get-shit-done-jj
```

**Interactive installer for Claude Code and OpenCode.**

<br>

*"If you know clearly what you want, this WILL build it for you. No bs."*

*"By far the most powerful addition to my Claude Code. Nothing over-engineered. Literally just gets shit done."*

<br>

[Why JJ](#why-jj) · [Installation](#installation) · [Quick Start](#quick-start) · [Commands](#commands) · [Architecture](#architecture)

</div>

---

## Overview

GSD-JJ is a spec-driven development framework that enables AI coding assistants (like Claude Code) to build complex software reliably. It provides:

- **Context Engineering** - Structured prompts that prevent quality degradation as context fills
- **Atomic Commits** - Every task gets its own commit with JJ's change-based workflow
- **Subagent Orchestration** - Fresh 200k token contexts for each task plan, zero degradation
- **State Management** - Living memory across sessions via STATE.md and structured plans

This is a Jujutsu-native fork of the original [Get Shit Done](https://github.com/glittercowboy/get-shit-done) framework, replacing Git with JJ for superior atomic commits and modern VCS workflows.

---

## Why JJ?

Jujutsu (JJ) is a next-generation version control system that fundamentally improves AI-automated workflows:

### Benefits Over Git

| Feature | Git | JJ |
|---------|-----|-----|
| **Atomic commits** | Manual staging with `git add` | Automatic tracking, instant commits |
| **Commit identity** | SHA hashes change on rebase | Change IDs persist through rebases |
| **Task isolation** | Complex branch management | Simple `jj new` for each task |
| **Revert precision** | Revert by hash (breaks after rebase) | Revert by change ID (stable) |
| **Workflow clarity** | `git add`, `git commit`, `git push` | `jj commit`, `jj git push` |

### Why This Matters for AI Coding

1. **No staging complexity** - JJ auto-tracks changes, eliminating `git add` steps
2. **Stable references** - Change IDs survive rebases, making task commits truly atomic
3. **Better observability** - `jj log` shows clean change history without merge noise
4. **Surgical reverts** - Revert specific tasks by change ID, not by fragile hashes

### GitHub Compatibility

GSD-JJ uses **colocated repositories** (`.git` + `.jj`), which means:
- Full GitHub/GitLab compatibility via `jj git push`/`jj git fetch`
- Modern JJ workflow for local development
- Standard Git remotes for collaboration
- No migration required for existing projects

---

## Supported Clients

GSD uses a **shared core + client adapters** architecture:

- **Claude Code** (Primary) - Full feature support, actively maintained
- **OpenCode** (Planned) - Adapter layer documented, implementation pending

The shared core (workflows, references, templates) is client-agnostic. Client-specific logic lives in thin adapter layers.

### Why This Architecture?

- Same workflows and features across all clients
- Bug fixes and improvements benefit everyone
- Easy to add support for new AI coding assistants
- No code duplication between clients

See [Architecture](#architecture) section for details.

---

## Installation

### Interactive Install (Recommended)

```bash
npx github:brianjmeier/get-shit-done-jj
```

Choose your client (Claude Code or OpenCode) and installation location (global or local).

**Global:** Installs to `~/.claude/` for all projects
**Local:** Installs to `./.claude/` for current project only

### Non-Interactive Install

For Docker, CI, or scripted installations:

```bash
# Claude Code - Global
npx github:brianjmeier/get-shit-done-jj --claude-code --global

# Claude Code - Local
npx github:brianjmeier/get-shit-done-jj --claude-code --local

# OpenCode - Global
npx github:brianjmeier/get-shit-done-jj --opencode --global

# OpenCode - Local
npx github:brianjmeier/get-shit-done-jj --opencode --local
```

**Verify installation:**

```
/gsd:help
```

Inside Claude Code or OpenCode interface.

### Development Installation

To test modifications before contributing:

```bash
git clone https://github.com/glittercowboy/get-shit-done-jj.git
cd get-shit-done-jj
node bin/install.js --claude-code --local
```

Installs to `./.claude/` in the repo for testing.

---

## Quick Start

### 1. Initialize Project

```
/gsd:new-project
```

System asks questions until your idea is fully captured. Creates **PROJECT.md**.

### 2. Define Requirements

```
/gsd:define-requirements
```

Scope v1, v2, and out-of-scope features. Creates **REQUIREMENTS.md**.

### 3. Create Roadmap

```
/gsd:create-roadmap
```

Generates **ROADMAP.md** with phases mapped to requirements, plus **STATE.md** for session memory.

### 4. Execute Phases

```
/gsd:plan-phase 1      # Generate task plans
/gsd:execute-phase 1   # Run all plans in parallel
```

Each phase breaks into 2-3 autonomous task plans. Plans run in fresh subagent contexts (200k tokens each) with zero degradation.

### 5. Verify and Ship

```
/gsd:verify-work 1            # Test the phase
/gsd:complete-milestone v1.0  # Ship it
```

---

## Commands

### Setup

| Command | What it does |
|---------|--------------|
| `/gsd:new-project` | Extract your idea through questions, create PROJECT.md |
| `/gsd:research-project` | Research domain ecosystem (optional but recommended) |
| `/gsd:define-requirements` | Scope v1/v2/out-of-scope requirements |
| `/gsd:create-roadmap` | Create roadmap with phases |
| `/gsd:map-codebase` | Map existing codebase for brownfield projects |

### Execution

| Command | What it does |
|---------|--------------|
| `/gsd:plan-phase [N]` | Generate task plans for phase |
| `/gsd:execute-phase <N>` | Execute all plans in phase (parallel) |
| `/gsd:execute-plan` | Run single plan (interactive) |
| `/gsd:progress` | Check current position and next steps |

### Verification

| Command | What it does |
|---------|--------------|
| `/gsd:verify-work [N]` | User acceptance test of phase |
| `/gsd:plan-fix [plan]` | Plan fixes for UAT issues |

### Phase Management

| Command | What it does |
|---------|--------------|
| `/gsd:add-phase` | Append phase to current roadmap |
| `/gsd:insert-phase [N]` | Insert urgent work between phases |
| `/gsd:remove-phase [N]` | Remove future phase, renumber rest |
| `/gsd:discuss-phase [N]` | Gather context before planning |
| `/gsd:research-phase [N]` | Deep research for unfamiliar domains |

### Milestones

| Command | What it does |
|---------|--------------|
| `/gsd:complete-milestone` | Archive current milestone, prep next |
| `/gsd:discuss-milestone` | Gather context for next milestone |
| `/gsd:new-milestone [name]` | Create new milestone with phases |

### Session Management

| Command | What it does |
|---------|--------------|
| `/gsd:pause-work` | Create handoff when stopping mid-phase |
| `/gsd:resume-work` | Restore from last session |

### Utilities

| Command | What it does |
|---------|--------------|
| `/gsd:add-todo [desc]` | Capture idea for later |
| `/gsd:check-todos [area]` | List pending todos, select one |
| `/gsd:debug [desc]` | Systematic debugging with state |
| `/gsd:help` | Show all commands |
| `/gsd:whats-new` | See latest updates |

---

## How It Works

### Context Engineering

Claude Code is powerful when given proper context. GSD provides it:

| File | Purpose |
|------|---------|
| `PROJECT.md` | Project vision, always loaded |
| `research/` | Ecosystem knowledge (optional) |
| `REQUIREMENTS.md` | Scoped requirements with traceability |
| `ROADMAP.md` | Phase structure and progress |
| `STATE.md` | Decisions, blockers, session memory |
| `PLAN.md` | Atomic task with XML structure |
| `SUMMARY.md` | Execution results, committed to history |

Size limits based on where Claude's quality degrades. Stay under, get consistent excellence.

### XML Prompt Formatting

Every plan uses structured XML optimized for Claude:

```xml
<task type="auto">
  <name>Create login endpoint</name>
  <files>src/app/api/auth/login/route.ts</files>
  <action>
    Use jose for JWT. Validate against users table.
    Return httpOnly cookie on success.
  </action>
  <verify>curl -X POST localhost:3000/api/auth/login returns 200</verify>
  <done>Valid credentials return cookie, invalid return 401</done>
</task>
```

Precise instructions. No guessing. Verification built in.

### Subagent Execution

As Claude fills context, quality degrades. GSD prevents this:

- Each phase: 2-3 task plans maximum
- Each plan: Fresh subagent with 200k tokens
- Each task: Atomic commit immediately after completion

**Result:** Zero degradation. Walk away, come back to completed work.

### Atomic Commits with JJ

Every task gets its own commit:

```bash
jj log
○  yqvq docs(03-04): complete adapter documentation
│
○  rtxv feat(03-03): add installer improvements
│
○  mnop feat(03-02): update opencode adapter
│
○  klmn feat(03-01): verify shared core
```

Benefits:
- Change IDs persist through rebases (more stable than Git hashes)
- Each task independently revertable with `jj revert`
- Clear history with `jj log`
- Surgical precision in AI-automated workflow

---

## Architecture

GSD uses a **shared core + client adapters** pattern:

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
└──────────────┘    └───────────────┘
```

### Design Principles

1. **Thin adapters, rich core** - Adapters parse arguments and resolve paths, core handles workflows
2. **Client-agnostic core** - No hardcoded paths, no client-specific logic
3. **Runtime path resolution** - `@~/.claude/` pattern resolved by each client
4. **Single source of truth** - Bug fixes and features benefit all clients

For detailed architecture documentation, see [get-shit-done/references/adapter-architecture.md](get-shit-done/references/adapter-architecture.md).

---

## Recommended: Skip Permissions Mode

GSD is designed for frictionless automation. Run Claude Code with:

```bash
claude --dangerously-skip-permissions
```

Stopping to approve `date` and `jj commit` 50 times defeats the purpose.

<details>
<summary><strong>Alternative: Granular Permissions</strong></summary>

Add to `.claude/settings.json`:

```json
{
  "permissions": {
    "allow": [
      "Bash(date:*)",
      "Bash(jj:*)",
      "Bash(ls:*)",
      "Bash(wc:*)",
      "Bash(grep:*)"
    ]
  }
}
```

</details>

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

Key points:
- Shared core must remain client-agnostic
- Changes to workflows affect both Claude Code and OpenCode
- Test both clients before submitting PRs
- Use JJ for commits (`jj commit` instead of `git commit`)

---

## Troubleshooting

**Commands not found after install?**
- Restart Claude Code to reload slash commands
- Verify files in `~/.claude/commands/gsd/` (global) or `./.claude/commands/gsd/` (local)

**Want to update?**
```bash
npx github:brianjmeier/get-shit-done-jj
```

**Using Docker or containers?**
```bash
CLAUDE_CONFIG_DIR=/home/user/.claude npx github:brianjmeier/get-shit-done-jj --claude-code --global
```

---

## License

MIT License. See [LICENSE](LICENSE) for details.

---

<div align="center">

**AI coding is powerful. GSD-JJ makes it reliable.**

Built with ❤️ by the Get Shit Done community

</div>
