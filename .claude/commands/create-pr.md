---
description: Create a PR with informative description and small semantic commit messages following the project's commit convention.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty). The user input may contain:

- A summary of changes made
- Specific commit message preferences
- Target branch (defaults to `main`)
- Additional context for PR description

## Commit Convention Reference

This project follows the Angular commit convention. Commit messages must match:

```regex
/^(revert: )?(feat|fix|docs|dx|style|refactor|perf|test|workflow|build|ci|chore|types|wip)(\(.+\))?: .{1,50}/
```

### Commit Types

| Type       | Description                         | Appears in Changelog |
| ---------- | ----------------------------------- | -------------------- |
| `feat`     | New feature                         | Yes                  |
| `fix`      | Bug fix                             | Yes                  |
| `perf`     | Performance improvement             | Yes                  |
| `docs`     | Documentation only                  | No                   |
| `style`    | Code style (formatting, semicolons) | No                   |
| `refactor` | Code refactoring (no feature/fix)   | No                   |
| `test`     | Adding/updating tests               | No                   |
| `build`    | Build system or dependencies        | No                   |
| `ci`       | CI configuration                    | No                   |
| `chore`    | Maintenance tasks                   | No                   |
| `types`    | TypeScript type definitions         | No                   |
| `wip`      | Work in progress                    | No                   |
| `dx`       | Developer experience improvements   | No                   |
| `workflow` | Workflow changes                    | No                   |

### Commit Message Rules

1. **Subject line**: Max 50 characters, imperative mood ("add" not "added")
2. **No capitalization** of first letter
3. **No period** at the end
4. **Scope** (optional): Module/area affected (e.g., `auth`, `api`, `db`)

### Examples

```
feat(auth): add JWT refresh token support
fix(api): handle null response in user endpoint
refactor(db): optimize query for appointments
test(client): add unit tests for client service
docs(readme): update installation instructions
chore(deps): bump mikro-orm to v6.5
```

## Execution Steps

### Step 1: Analyze Current State

Run these commands in parallel to understand the current state:

```bash
# Check git status
git status

# View staged and unstaged changes
git diff --cached --stat
git diff --stat

# Get recent commit history for style reference
git log --oneline -10

# Check current branch and remote tracking
git branch -vv
```

### Step 2: Review Changes

1. **Identify all changed files** from git status
2. **Categorize changes** by type:
   - New features → `feat`
   - Bug fixes → `fix`
   - Refactoring → `refactor`
   - Tests → `test`
   - Documentation → `docs`
   - Dependencies → `chore(deps)` or `build`
   - CI/CD → `ci`

3. **Determine scope** from the primary module/area affected:
   - Use module name from `apps/api/modules/*` (e.g., `auth`, `payment`, `user`, `order`, `product`)
   - Use `shared` for shared utilities
   - Use `db` for database/migration changes
   - Use `api` for general API changes
   - Use `web` for general web changes

### Step 3: Create small semantic commits

If changes span multiple logical units, create separate commits:

```bash
# Stage related files together
git add <files-for-first-commit>
git commit -m "<type>(<scope>): <description>"

# Repeat for other logical groups
git add <files-for-second-commit>
git commit -m "<type>(<scope>): <description>"
```

**Guidelines for splitting commits:**

- One commit per logical change
- Keep commits atomic and reviewable
- Each commit should leave the codebase in a working state

**If all changes are related**, create a single commit:

```bash
git add .
git commit -m "<type>(<scope>): <description>"
```

### Step 4: Push to Remote

```bash
# Push to remote with upstream tracking
git push -u origin HEAD
```

### Step 5: Create Pull Request

Use `gh pr create` with a structured description:

```bash
gh pr create --title "<type>(<scope>): <concise title>" --body "$(cat <<'EOF'
## Summary

<1-3 bullet points describing what this PR does>

## Changes

<List of key changes, grouped by category if needed>

## Testing

<How the changes were tested>
- [ ] Unit tests pass
- [ ] Manual testing performed
- [ ] No regressions identified

## Related Issues

<Link to related issues if any, e.g., "Closes #123">
EOF
)"
```

### PR Title Guidelines

- Use the same format as commit messages: `<type>(<scope>): <description>`
- Keep under 72 characters
- Be specific but concise

### PR Description Template

```markdown
## Summary

Brief description of what this PR accomplishes. Focus on the "why" not just the "what".

## Changes

- Change 1
- Change 2
- Change 3

## Testing

Describe how changes were verified:

- Unit tests added/updated
- Manual testing steps
- Edge cases considered

## Screenshots (if applicable)

<Add screenshots for UI changes>

## Checklist

- [ ] Code follows project conventions
- [ ] Tests pass locally
- [ ] Self-review completed
- [ ] Documentation updated (if needed)

## Related Issues

Closes #<issue_number>
```

## Examples

### Example 1: Single Bug Fix

```bash
# User input: "Fixed the sanitize middleware test that was failing"
git add apps/api/shared/security/sanitize-input.middleware.test.ts
git commit -m "fix(test): add missing path property to mock context"
git push -u origin HEAD
gh pr create --title "fix(test): add missing path property to sanitize middleware test" --body "$(cat <<'EOF'
## Summary

Fixes failing unit tests in sanitize-input.middleware.test.ts by adding the missing `path` property to the mock context.

## Changes

- Added `path: "/test"` to mockContext.req in test setup

## Testing

- [x] All 22 tests in sanitize-input.middleware.test.ts now pass
- [x] Full test suite passes
EOF
)"
```

### Example 2: New Feature

```bash
git add apps/api/modules/auth/*
git commit -m "feat(auth): add password reset functionality"
git push -u origin HEAD
gh pr create --title "feat(auth): add password reset functionality" --body "$(cat <<'EOF'
## Summary

Implements password reset flow with email verification token.

## Changes

- Add password reset request endpoint
- Add password reset confirmation endpoint
- Add email service integration for reset emails
- Add unit tests for new functionality

## Testing

- [x] Unit tests added for all new services
- [x] Manual testing with test email service
- [x] Error cases handled
EOF
)"
```

### Example 3: Multiple Related Changes

```bash
# First commit - the fix
git add apps/api/modules/client/
git commit -m "fix(client): handle null client category gracefully"

# Second commit - related test
git add apps/api/modules/client/test/
git commit -m "test(client): add edge case tests for null category"

git push -u origin HEAD
gh pr create --title "fix(client): handle null client category gracefully" --body "$(cat <<'EOF'
## Summary

Fixes edge case where null client category caused runtime errors.

## Changes

- Add null check in client service before accessing category properties
- Add unit tests covering null category scenarios

## Testing

- [x] New unit tests pass
- [x] Existing tests still pass
- [x] Manual testing confirms fix
EOF
)"
```

## Output

After successful PR creation, report:

1. **PR URL** - Link to the created PR
2. **Commits created** - List of commit messages
3. **Branch name** - Current branch pushed
4. **Target branch** - Base branch for PR (usually `main`)

## Error Handling

- If no changes to commit: Inform user and ask what they want to do
- If push fails: Check for upstream conflicts, suggest `git pull --rebase`
- If PR creation fails: Check if PR already exists, suggest using `gh pr view`
- If on protected branch: Create new branch first with `git checkout -b <branch-name>`
