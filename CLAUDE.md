# Claude Code Instructions
# From the Expertly.com vibecoding workshop


## Performing a Change

1. Plan the request comprehensively. Identify all components before starting.
2. Implement with minimal, well-scoped edits.
   - Write functional code first — not placeholders or TODOs.
   - Verify wiring: trace the full user path (UI entry point -> route -> component -> API call -> backend endpoint). If anything is disconnected, wire it up before proceeding.
3. Review code before testing:
   - Does the code actually do what was requested?
   - Are there logic errors, wrong field names, missing error handling, or type mismatches?
   - Are edge cases handled (empty inputs, missing data, unauthorized access)?
   - Does it match the project's existing patterns?
   - If you find bugs, fix them before writing tests.
4. Write tests (unit and end-to-end as appropriate).
5. Run the tests — fix any failures before committing.
6. Commit with a clear, descriptive message.

## When You Encounter a Bug

- Identify the root cause.
- Fix it immediately — do not ask for permission.
- Add a test to prevent it from recurring.
- Confirm the fix works.

## Fix What You Find

When you encounter a pre-existing bug, broken test, or defect — even if unrelated to your task — fix it on the spot. Broken things left broken accumulate.

## Git Commit Messages

```
type(scope): Brief summary (under 72 chars)

Problem: What issue or need prompted this change
Solution: How this commit addresses it
```

**Types:** feat, fix, refactor, docs, test, chore

## Constants and Magic Values

Every constant, threshold, timeout, or config value must have a comment explaining **why** that value was chosen — not just what it is.

## Non-Obvious Decisions

When code makes a non-obvious choice, add a comment explaining **why**. Prefix with `WHY:` so it's searchable.

## Learning

When you discover something worth remembering — a convention, a gotcha, a preference — capture it in `.claude/rules/` as a `.md` file so it persists across conversations.

## Browser/Machine Automation

When using local resources like a web browser, do it in a headless/hidden way to avoid disrupting the user.
