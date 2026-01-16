# Codebase Concerns

**Analysis Date:** 2026-01-16

## Tech Debt

**Hardcoded `@~/.claude/` paths in shared core:**
- Issue: The shared core (`get-shit-done/`) contains 58 instances of `@~/.claude/` paths
- Files affected:
  - `get-shit-done/workflows/verify-work.md`
  - `get-shit-done/workflows/execute-plan.md`
  - `get-shit-done/workflows/plan-phase.md`
  - `get-shit-done/workflows/execute-phase.md`
  - `get-shit-done/workflows/debug.md`
  - `get-shit-done/templates/phase-prompt.md`
  - `get-shit-done/templates/debug-subagent-prompt.md`
  - `get-shit-done/templates/subagent-task-prompt.md`
  - `get-shit-done/templates/continuation-prompt.md`
  - `get-shit-done/references/plan-format.md`
  - `get-shit-done/references/adapter-architecture.md`
- Why: Rapid development, paths added before adapter architecture was finalized
- Impact: Violates stated architecture in `CONTRIBUTING.md` ("Must remain client-agnostic"). OpenCode adapter cannot use shared core as-is.
- Fix approach: Create path resolution mechanism or move all path references to adapter layer

**Massive command duplication between adapters:**
- Issue: Nearly identical files in `commands/gsd/*.md` (30 files) and `adapters/opencode/command/gsd/*.md` (31 files)
- Why: Each adapter needs different path references
- Impact: Every bug fix must be applied twice, violates DRY
- Fix approach: Extract common content to shared core, keep only path-specific overrides in adapters

## Known Bugs

**Inconsistent dates in CHANGELOG.md:**
- Symptoms: Many entries dated "2026" which is clearly incorrect
- Trigger: View changelog
- Files: `CHANGELOG.md` (lines 42, 57, 63, 75, 95, 100, 107, etc.)
- Workaround: None
- Root cause: Typo during documentation
- Fix: Replace "2026" with "2025" throughout

**Repository URL mismatch:**
- Symptoms: Three different repository URLs referenced
- Files:
  - `package.json` line 29: `"url": "https://github.com/OWNER/gsd-jj.git"` (placeholder)
  - `CONTRIBUTING.md` line 55: `https://github.com/glittercowboy/get-shit-done-jj.git`
  - `CHANGELOG.md`: `https://github.com/glittercowboy/get-shit-done/`
- Workaround: None
- Root cause: Incomplete updates during repository setup
- Fix: Pick canonical URL and update all files

**OpenCode marked as "Planned" but fully implemented:**
- Symptoms: README says OpenCode is planned, but adapter exists
- File: `README.md` line 83
- Workaround: None
- Root cause: Documentation not updated after implementation
- Fix: Update README to mark OpenCode as implemented

## Security Considerations

**No input validation in installer:**
- Risk: Invalid user input defaults to 'claude-code' without warning
- File: `bin/install.js` lines 107-113
- Current mitigation: Low risk (local CLI tool, no network operations)
- Recommendations: Add warning when defaulting to fallback

## Performance Bottlenecks

**Large workflow files consuming tokens:**
- Problem: Very large workflow files when loaded as context
- Files:
  - `get-shit-done/workflows/execute-plan.md` - 1,803 lines
  - `get-shit-done/references/checkpoints.md` - 793 lines
  - `get-shit-done/workflows/plan-phase.md` - 748 lines
  - `get-shit-done/workflows/debug.md` - 663 lines
  - `get-shit-done/workflows/create-roadmap.md` - 645 lines
- Measurement: Context consumption in AI assistants
- Cause: Comprehensive documentation in single files
- Improvement path: Consider splitting into smaller, focused modules

## Fragile Areas

**Duplicate verification patterns reference:**
- Files:
  - `get-shit-done/references/verification-patterns.md` (595 lines)
  - `get-shit-done/references/debugging/verification-patterns.md` (425 lines)
- Why fragile: Two files with overlapping content, easy to update one and forget the other
- Common failures: Inconsistent guidance between files
- Safe modification: Consolidate into single file
- Test coverage: None

## Scaling Limits

- Not applicable (documentation framework, no runtime scaling concerns)

## Dependencies at Risk

**Zero external dependencies:**
- This is a strength, not a risk
- No npm dependencies to become outdated or vulnerable

## Missing Critical Features

**No CI/CD pipeline:**
- Problem: No automated testing or deployment
- Current workaround: Manual testing
- Blocks: Automated quality checks on PRs
- Implementation complexity: Low (add GitHub Actions workflow)

## Test Coverage Gaps

**Only installation tested:**
- What's not tested: Command/workflow correctness, template parsing
- Risk: Broken commands not detected until manual testing
- Priority: Medium
- Difficulty to test: Medium (would need to mock AI assistant context)

**No unit tests for JavaScript:**
- What's not tested: `parseArgs()`, `copyDirectory()`, path resolution
- Risk: Installer bugs not caught
- Priority: Medium
- Difficulty to test: Low (standard unit testing)

**Agents directory undocumented:**
- What's not tested: Agent behavior
- Risk: Unclear how agents should be used or modified
- Files:
  - `agents/gsd-executor.md` (756 lines)
  - `agents/gsd-verifier.md` (778 lines)
  - `agents/gsd-milestone-auditor.md` (448 lines)
  - `agents/gsd-integration-checker.md` (423 lines)
- Priority: Low
- Difficulty: Low (add README.md to agents/)

## Recommended Actions (Priority Order)

1. **Fix hardcoded paths in shared core** - Create path resolution mechanism
2. **Consolidate duplicate adapter commands** - Extract common content
3. **Update repository URLs** - Pick canonical URL
4. **Fix changelog dates** - Replace "2026" with "2025"
5. **Update README** - Mark OpenCode as implemented
6. **Add agents documentation** - Create README in `agents/`
7. **Add `test-output/` to `.gitignore`** - Remove test artifacts

---

*Concerns audit: 2026-01-16*
*Update as issues are fixed or new ones discovered*
