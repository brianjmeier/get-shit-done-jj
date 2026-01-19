---
name: gsd:remove-phase
description: Remove a future phase from roadmap and renumber subsequent phases
argument-hint: <phase-number>
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
---

<objective>
Remove an unstarted future phase from the roadmap and renumber all subsequent phases to maintain a clean, linear sequence.

Purpose: Clean removal of work you've decided not to do, without polluting context with cancelled/deferred markers.
Output: Phase deleted, all subsequent phases renumbered, JJ commit as historical record.
</objective>

<execution_context>
@.planning/ROADMAP.md
@.planning/STATE.md
</execution_context>

<process>

<step name="parse_arguments">
Parse the command arguments:
- Argument is the phase number to remove (integer or decimal)
- Example: `/gsd:remove-phase 17` → phase = 17
- Example: `/gsd:remove-phase 16.1` → phase = 16.1

If no argument provided:

```
ERROR: Phase number required
Usage: /gsd:remove-phase <phase-number>
Example: /gsd:remove-phase 17
```

Exit.
</step>

<step name="load_state">
Load project state:

```bash
cat .planning/STATE.md 2>/dev/null
cat .planning/ROADMAP.md 2>/dev/null
```

Parse current phase number from STATE.md "Current Position" section.
</step>

<step name="validate_phase_exists">
Verify the target phase exists in ROADMAP.md:

1. Search for `### Phase {target}:` heading
2. If not found:

   ```
   ERROR: Phase {target} not found in roadmap
   Available phases: [list phase numbers]
   ```

   Exit.
</step>

<step name="validate_future_phase">
Verify the phase is a future phase (not started):

1. Compare target phase to current phase from STATE.md
2. Target must be > current phase number

If target <= current phase:

```
ERROR: Cannot remove Phase {target}

Only future phases can be removed:
- Current phase: {current}
- Phase {target} is current or completed

To abandon current work, use /gsd:pause-work instead.
```

Exit.

3. Check for SUMMARY.md files in phase directory:

```bash
ls .planning/phases/{target}-*/*-SUMMARY.md 2>/dev/null
```

If any SUMMARY.md files exist:

```
ERROR: Phase {target} has completed work

Found executed plans:
- {list of SUMMARY.md files}

Cannot remove phases with completed work.
```

Exit.
</step>

<step name="gather_phase_info">
Collect information about the phase being removed:

1. Extract phase name from ROADMAP.md heading: `### Phase {target}: {Name}`
2. Find phase directory: `.planning/phases/{target}-{slug}/`
3. Find all subsequent phases (integer and decimal) that need renumbering
</step>

<step name="confirm_removal">
Present removal summary and confirm:

```
Removing Phase {target}: {Name}

This will:
- Delete: .planning/phases/{target}-{slug}/
- Renumber {N} subsequent phases:
  - Phase 18 → Phase 17
  - Phase 18.1 → Phase 17.1
  - Phase 19 → Phase 18
  [etc.]

Proceed? (y/n)
```

Wait for confirmation.
</step>

<step name="delete_phase_directory">
Delete the target phase directory if it exists:

```bash
if [ -d ".planning/phases/{target}-{slug}" ]; then
  rm -rf ".planning/phases/{target}-{slug}"
  echo "Deleted: .planning/phases/{target}-{slug}/"
fi
```

If directory doesn't exist, note: "No directory to delete (phase not yet created)"
</step>

<step name="renumber_directories">
Rename all subsequent phase directories in descending order to avoid conflicts.
</step>

<step name="update_roadmap">
Update ROADMAP.md:

1. Remove the phase section entirely
2. Remove from phase list
3. Remove from Progress table
4. Renumber all subsequent phases
5. Update dependency references

Write updated ROADMAP.md.
</step>

<step name="update_state">
Update STATE.md:

1. Update total phase count
2. Recalculate progress percentage

Write updated STATE.md.
</step>

<step name="commit">
Commit the removal:

```bash
jj commit -m "chore: remove phase {target} ({original-phase-name})"
```

The commit message preserves the historical record of what was removed.
</step>

<step name="completion">
Present completion summary:

```
Phase {target} ({original-name}) removed.

Changes:
- Deleted: .planning/phases/{target}-{slug}/
- Renumbered: Phases {first-renumbered}-{last-old} → {first-renumbered-1}-{last-new}
- Updated: ROADMAP.md, STATE.md
- Committed: chore: remove phase {target} ({original-name})

Current roadmap: {total-remaining} phases
Current position: Phase {current} of {new-total}

---

## What's Next

Would you like to:
- `/gsd:progress` — see updated roadmap status
- Continue with current phase
- Review roadmap

---
```
</step>

</process>

<anti_patterns>

- Don't remove completed phases (have SUMMARY.md files)
- Don't remove current or past phases
- Don't leave gaps in numbering - always renumber
- Don't add "removed phase" notes to STATE.md - JJ commit is the record
- Don't ask about each decimal phase - just renumber them
- Don't modify completed phase directories
</anti_patterns>

<success_criteria>
Phase removal is complete when:

- [ ] Target phase validated as future/unstarted
- [ ] Phase directory deleted (if existed)
- [ ] All subsequent phase directories renumbered
- [ ] ROADMAP.md updated (section removed, all references renumbered)
- [ ] STATE.md updated (phase count, progress percentage)
- [ ] Changes committed with descriptive message
- [ ] No gaps in phase numbering
- [ ] User informed of changes
</success_criteria>
