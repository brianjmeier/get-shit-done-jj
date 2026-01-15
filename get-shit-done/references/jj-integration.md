<overview>
JJ (Jujutsu) integration for GSD framework.
</overview>

<core_principle>

**Commit outcomes, not process.**

The jj log should read like a changelog of what shipped, not a diary of planning activity.
</core_principle>

<commit_points>

| Event                   | Commit? | Why                                              |
| ----------------------- | ------- | ------------------------------------------------ |
| BRIEF + ROADMAP created | YES     | Project initialization                           |
| PLAN.md created         | NO      | Intermediate - commit with plan completion       |
| RESEARCH.md created     | NO      | Intermediate                                     |
| DISCOVERY.md created    | NO      | Intermediate                                     |
| **Task completed**      | YES     | Atomic unit of work (1 commit per task)         |
| **Plan completed**      | YES     | Metadata commit (SUMMARY + STATE + ROADMAP)     |
| Handoff created         | YES     | WIP state preserved                              |

</commit_points>

<jj_check>

```bash
# Check for JJ repo (colocated or native)
[ -d .jj ] && echo "JJ_EXISTS" || echo "NO_JJ"

# Check if colocated (has both .jj and .git)
[ -d .jj ] && [ -d .git ] && echo "COLOCATED" || echo "NATIVE"
```

**If NO_JJ:** Run `jj git init --colocate` for new GSD projects (maintains GitHub compatibility).

**Repository types:**
- **Colocated:** Has both `.jj/` and `.git/` directories. JJ uses Git as backend. Compatible with Git remotes and GitHub workflows.
- **Native:** Has only `.jj/` directory. Pure JJ repo. Requires `jj git push/fetch` for remote operations.

</jj_check>

<commit_formats>

<format name="initialization">
## Project Initialization (brief + roadmap together)

```
docs: initialize [project-name] ([N] phases)

[One-liner from PROJECT.md]

Phases:
1. [phase-name]: [goal]
2. [phase-name]: [goal]
3. [phase-name]: [goal]
```

**JJ workflow:**

```bash
# JJ uses describe to set message on working copy, then new to finalize
jj describe -m "docs: initialize [project-name] ([N] phases)

[One-liner from PROJECT.md]

Phases:
1. [phase-name]: [goal]
..."

# Stage and finalize the commit
jj new

# Push to remote (if configured)
jj git push --bookmark main --allow-new
```

**Alternative (shorthand):**

```bash
# jj commit is shorthand for describe + new
jj commit -m "docs: initialize [project-name] ([N] phases)

[One-liner from PROJECT.md]

Phases:
1. [phase-name]: [goal]
..."
```

**What to commit:** `.planning/` directory automatically tracked by JJ (no staging needed).

</format>

<format name="task-completion">
## Task Completion (During Plan Execution)

Each task gets its own commit immediately after completion.

```
{type}({phase}-{plan}): {task-name}

- [Key change 1]
- [Key change 2]
- [Key change 3]
```

**Commit types:**
- `feat` - New feature/functionality
- `fix` - Bug fix
- `test` - Test-only (TDD RED phase)
- `refactor` - Code cleanup (TDD REFACTOR phase)
- `perf` - Performance improvement
- `chore` - Dependencies, config, tooling

**JJ workflow:**

```bash
# Describe current working copy with task completion message
jj describe -m "{type}({phase}-{plan}): {task-name}

- [Key change 1]
- [Key change 2]
"

# Finalize and move to fresh working copy
jj new
```

**Examples:**

```bash
# Standard task
jj commit -m "feat(08-02): create user registration endpoint

- POST /auth/register validates email and password
- Checks for duplicate users
- Returns JWT token on success
"

# TDD task - RED phase
jj commit -m "test(07-02): add failing test for JWT generation

- Tests token contains user ID claim
- Tests token expires in 1 hour
- Tests signature verification
"

# TDD task - GREEN phase
jj commit -m "feat(07-02): implement JWT generation

- Uses jose library for signing
- Includes user ID and expiry claims
- Signs with HS256 algorithm
"
```

**Key insight:** JJ automatically tracks all file changes - no `jj add` step needed. Use `jj commit -m "msg"` as shorthand for `jj describe -m "msg" && jj new`.

</format>

<format name="plan-completion">
## Plan Completion (After All Tasks Done)

After all tasks committed, one final metadata commit captures plan completion.

```
docs({phase}-{plan}): complete [plan-name] plan

Tasks completed: [N]/[N]
- [Task 1 name]
- [Task 2 name]
- [Task 3 name]

SUMMARY: .planning/phases/XX-name/{phase}-{plan}-SUMMARY.md
```

**JJ workflow:**

```bash
# Same pattern - describe then new
jj describe -m "docs({phase}-{plan}): complete [plan-name] plan

Tasks completed: [N]/[N]
- [Task 1]
- [Task 2]
"

jj new
```

**Or using shorthand:**

```bash
jj commit -m "docs({phase}-{plan}): complete [plan-name] plan

Tasks completed: [N]/[N]
- [Task 1]
- [Task 2]
"
```

**Note:** Code files NOT included - already committed per-task. This commit captures planning artifacts only (PLAN.md, SUMMARY.md, STATE.md, ROADMAP.md).

</format>

<format name="handoff">
## Handoff (WIP)

```
wip: [phase-name] paused at task [X]/[Y]

Current: [task name]
[If blocked:] Blocked: [reason]
```

**JJ workflow:**

```bash
jj commit -m "wip: [phase-name] paused at task [X]/[Y]

Current: [task name]
"
```

</format>

</commit_formats>

<command_mapping>

## Git to JJ Command Translation

| Git Command | JJ Equivalent | Notes |
|-------------|---------------|-------|
| `git init` | `jj git init --colocate` | Creates both .jj and .git for GitHub compatibility |
| `git add .` | (automatic) | JJ auto-tracks all changes in working copy |
| `git add <file>` | (automatic) | No staging area - all changes tracked |
| `git commit -m "msg"` | `jj commit -m "msg"` | Shorthand for `jj describe -m "msg" && jj new` |
| `git commit --amend` | `jj describe -m "msg"` | Updates current working copy message |
| `git status` | `jj status` | Shows working copy changes |
| `git log` | `jj log` | Shows change IDs + commit IDs |
| `git log --oneline` | `jj log --no-graph -T 'commit_id.short() " " description.first_line()'` | Compact log format |
| `git push` | `jj git push --bookmark <name>` | Bookmarks replace branches |
| `git push --set-upstream` | `jj git push --bookmark <name> --allow-new` | First push of a bookmark |
| `git fetch` | `jj git fetch` | Fetches from all remotes |
| `git pull` | `jj git fetch && jj rebase -d main@origin` | No direct pull equivalent |
| `git branch` | `jj bookmark list` | List bookmarks (JJ's branch equivalent) |
| `git checkout -b <name>` | `jj bookmark create <name>` | Create and track new bookmark |
| `git checkout <name>` | `jj new <name>` | Create working copy at bookmark |
| `git diff` | `jj diff` | Show uncommitted changes |
| `git show <hash>` | `jj show <hash>` | Show specific commit |
| `[ -d .git ]` | `[ -d .jj ]` | Repo detection for scripts |

**Key JJ concepts:**
- **Working copy IS a commit** - No staging area, every save is a change
- **Change IDs persist through rebases** - More stable than git commit hashes
- **Bookmarks replace branches** - Automatically follow during rebase
- **No detached HEAD** - Working copy always has a commit

</command_mapping>

<example_log>

**Old approach (per-plan commits with git):**
```
a7f2d1 feat(checkout): Stripe payments with webhook verification
3e9c4b feat(products): catalog with search, filters, and pagination
8a1b2c feat(auth): JWT with refresh rotation using jose
5c3d7e feat(foundation): Next.js 15 + Prisma + Tailwind scaffold
2f4a8d docs: initialize ecommerce-app (5 phases)
```

**New approach (per-task commits with JJ):**
```
# Phase 04 - Checkout
1a2b3c docs(04-01): complete checkout flow plan
4d5e6f feat(04-01): add webhook signature verification
7g8h9i feat(04-01): implement payment session creation
0j1k2l feat(04-01): create checkout page component

# Phase 03 - Products
3m4n5o docs(03-02): complete product listing plan
6p7q8r feat(03-02): add pagination controls
9s0t1u feat(03-02): implement search and filters
2v3w4x feat(03-01): create product catalog schema

# Phase 02 - Auth
5y6z7a docs(02-02): complete token refresh plan
8b9c0d feat(02-02): implement refresh token rotation
1e2f3g test(02-02): add failing test for token refresh
4h5i6j docs(02-01): complete JWT setup plan
7k8l9m feat(02-01): add JWT generation and validation
0n1o2p chore(02-01): install jose library

# Phase 01 - Foundation
3q4r5s docs(01-01): complete scaffold plan
6t7u8v feat(01-01): configure Tailwind and globals
9w0x1y feat(01-01): set up Prisma with database
2z3a4b feat(01-01): create Next.js 15 project

# Initialization
5c6d7e docs: initialize ecommerce-app (5 phases)
```

Each plan produces 2-4 commits (tasks + metadata). Clear, granular, bisectable.

**View with JJ:**
```bash
# Standard log (shows change IDs and commit hashes)
jj log

# Compact format (similar to git log --oneline)
jj log --no-graph -T 'commit_id.short() " " description.first_line()'

# Filter by phase-plan prefix
jj log -r 'description(glob:"*04-01*")'
```

</example_log>

<anti_patterns>

**Still don't commit (intermediate artifacts):**
- PLAN.md creation (commit with plan completion)
- RESEARCH.md (intermediate)
- DISCOVERY.md (intermediate)
- Minor planning tweaks
- "Fixed typo in roadmap"

**Do commit (outcomes):**
- Each task completion (feat/fix/test/refactor)
- Plan completion metadata (docs)
- Project initialization (docs)

**Key principle:** Commit working code and shipped outcomes, not planning process.

</anti_patterns>

<commit_strategy_rationale>

## Why Per-Task Commits?

**Context engineering for AI:**
- JJ history becomes primary context source for future Claude sessions
- `jj log -r 'description(glob:"*{phase}-{plan}*")'` shows all work for a plan
- `jj diff -r <change-id>` shows exact changes per task
- Less reliance on parsing SUMMARY.md = more context for actual work

**Failure recovery:**
- Task 1 committed, Task 2 failed
- Claude in next session: sees task 1 complete via jj log, can retry task 2
- Can `jj new <change-id>` to create working copy at last successful task

**Debugging:**
- Each commit independently revertable with `jj revert -r <change-id>`
- `jj log` shows change evolution through change IDs (persist through rebases)
- Atomic commits aid troubleshooting

**Observability:**
- Solo developer + Claude workflow benefits from granular attribution
- Atomic commits are best practice
- Change IDs provide stable references even after history editing

</commit_strategy_rationale>

<jj_specific_notes>

## JJ-Specific Behavior

**Working copy is always a commit:**
- Every file change automatically updates the current working copy commit
- No staging area concept - `jj status` shows what changed since parent
- Use `jj new` to finalize current work and create fresh working copy

**Change IDs vs Commit IDs:**
- Change ID: Stable identifier that persists through rebases (e.g., `qpvuntsm`)
- Commit ID: Git-compatible SHA hash (e.g., `7181a59`)
- Both shown in `jj log` output
- Use change IDs for operations that survive rebases

**Conflicts as first-class citizens:**
- JJ allows committing conflicts (they become part of history)
- Resolve conflicts at any time with `jj resolve`
- Continue working in other areas while conflicts exist

**Bookmarks follow commits:**
- Bookmarks (JJ's branches) automatically update during rebase
- Unlike git branches which stay pointing at old commits
- Use `jj bookmark list` to see all bookmarks

**Remote operations:**
- `jj git push --bookmark <name>` pushes bookmark to remote
- `jj git fetch` imports changes from all remotes
- Use `--allow-new` flag for first push of a new bookmark
- Colocated repos stay compatible with `git push/pull` from git clients

**Colocated repo benefits:**
- `.git/` directory maintained for GitHub compatibility
- Can use `git` commands if needed (though not recommended)
- `jj git export` syncs JJ state to git (happens automatically on push)
- `jj git import` syncs git state to JJ (happens automatically on fetch)

</jj_specific_notes>
