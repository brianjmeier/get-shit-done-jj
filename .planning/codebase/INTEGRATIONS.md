# External Integrations

**Analysis Date:** 2026-01-16

## APIs & External Services

**External APIs:**
- Not applicable - This is a meta-prompting framework, not an application with API calls

## Data Storage

**Databases:**
- Not applicable

**File Storage:**
- Local file system only
- Installation targets:
  - Claude Code: `~/.claude/` directory
  - OpenCode: `~/.config/opencode/` directory
- Project artifacts: `.planning/` directory in user's project

**Caching:**
- None

## Authentication & Identity

**Auth Provider:**
- Not applicable

**OAuth Integrations:**
- Not applicable

## Monitoring & Observability

**Error Tracking:**
- None

**Analytics:**
- None

**Logs:**
- Console output only (stdout/stderr)
- ANSI-colored terminal output via custom `log()` function in `bin/install.js`

## CI/CD & Deployment

**Hosting:**
- npm registry - Distributed as npm package `gsd-jj`

**CI Pipeline:**
- Not detected - No `.github/workflows/` found

## Environment Configuration

**Development:**
- Required env vars: None
- Secrets location: Not applicable
- Mock/stub services: Not applicable

**Staging:**
- Not applicable

**Production:**
- No secrets management needed
- Configuration via CLI flags only (`--claude-code`, `--opencode`, `--local`)

## Webhooks & Callbacks

**Incoming:**
- Not applicable

**Outgoing:**
- Not applicable

## Version Control Integration

**Jujutsu (JJ) VCS:**
- Core integration for atomic commits
- Documentation: `get-shit-done/references/jj-integration.md`
- Uses colocated Git repositories (`.git` + `.jj`)
- Commands reference JJ throughout workflows

**Git:**
- Colocated with JJ for GitHub compatibility
- Documentation: `get-shit-done/references/git-integration.md`

## AI Coding Assistant Integrations

**Claude Code (Primary):**
- Slash commands: `commands/gsd/*.md` (30 commands)
- Installation path: `~/.claude/`
- Reference pattern: `@~/.claude/get-shit-done/...`

**OpenCode (Adapter):**
- Slash commands: `adapters/opencode/command/gsd/*.md` (31 commands)
- Installation path: `~/.config/opencode/`
- Reference pattern: `@~/.config/opencode/get-shit-done/...`
- Documentation: `adapters/opencode/README.md`

---

*Integration audit: 2026-01-16*
*Update when adding/removing external services*
