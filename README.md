# GET SHIT DONE (JJ Fork)

**A JJ-first fork of [glittercowboy/get-shit-done](https://github.com/glittercowboy/get-shit-done) — the meta-prompting, context engineering and spec-driven development system.**

This fork replaces all Git commands with [JJ (Jujutsu)](https://github.com/martinvonz/jj) equivalents and includes an adaptation script to generate OpenCode-compatible packages.

---

## What's Different

| Upstream GSD | This Fork |
|--------------|-----------|
| Git commands (`git add`, `git commit`) | JJ commands (`jj commit`, `jj status`) |
| `git-integration.md` reference | `jj-integration.md` reference |
| Claude Code only | Includes OpenCode adapter + transformation script |

### JJ Benefits for GSD

- **No staging area** — JJ auto-tracks all changes, eliminating `git add` steps
- **Change IDs persist through rebases** — More stable references than commit hashes
- **Working copy IS a commit** — Every save is tracked, safer workflow
- **Conflicts as first-class citizens** — Continue working while conflicts exist

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
- Converts paths: `~/.claude/` → `~/.config/opencode/`
- Converts commands: `/gsd:foo` → `/gsd-foo`
- Converts directories: `commands/` → `command/`
- Updates tool references: `AskUserQuestion` → `question`
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

## Commands

All the same GSD commands work — see upstream docs for full details:

| Command | What it does |
|---------|--------------|
| `/gsd:new-project` | Full initialization: questions → research → requirements → roadmap |
| `/gsd:plan-phase [N]` | Research + plan + verify for a phase |
| `/gsd:execute-phase <N>` | Execute all plans in parallel waves |
| `/gsd:verify-work [N]` | Manual user acceptance testing |
| `/gsd:progress` | Where am I? What's next? |
| `/gsd:help` | Show all commands |

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
│   └── gsd-to-opencode.cjs    # CC→OC transformation script
└── bin/
    └── install.js             # Installer
```

---

## License

MIT License. See [LICENSE](LICENSE) for details.

---

**Upstream:** [glittercowboy/get-shit-done](https://github.com/glittercowboy/get-shit-done)
