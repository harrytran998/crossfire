# Git Workflow Conventions

## Core Principles

- **Atomic Commits**: One logical change per commit; tests pass on each commit
- **Clear Messages**: Follow Conventional Commits; type + description
- **Branch Naming**: Feature branches follow pattern `feature/*`, `fix/*`, `docs/*`
- **PR Process**: Peer review; CI must pass; squash-merge or rebase
- **History Integrity**: Keep history clean; no force pushes to main
- **Traceability**: Every commit links to feature/issue; reversible

## DO ✅

### 1. Use Conventional Commits

```bash
# DO: Clear, categorized commit messages
git commit -m "feat(users): add user authentication service

- Implement JWT token generation and validation
- Add refresh token rotation mechanism
- Integrate with UserRepository for token storage

Closes #123"

git commit -m "fix(orders): resolve race condition in order processing

- Added mutex lock for concurrent updates
- Fixed test timeout in OrderService
- Verified no data corruption on high load

Closes #456"

git commit -m "refactor(database): improve connection pooling

- Migrate from 'pg' to 'pgboss' for better concurrency
- Reduce connection overhead by 40%
- Update all database tests

Closes #789"

git commit -m "docs(api): update authentication guide

- Add OAuth 2.0 flow diagram
- Document rate limiting behavior
- Include cURL examples for each endpoint"

git commit -m "test(users): add integration tests for sign-up flow

- Test valid/invalid email formats
- Verify welcome email sending
- Check duplicate email detection

Closes #321"

git commit -m "perf(search): optimize user search query

- Add database index on email column
- Reduce search time from 500ms to 50ms
- Update test expectations for speed"
```

### 2. Branch Naming Conventions

```bash
# DO: Descriptive branch names
git checkout -b feature/user-authentication
git checkout -b feature/order-payment-integration
git checkout -b feature/email-notification-service

git checkout -b fix/race-condition-order-processing
git checkout -b fix/database-connection-leak
git checkout -b fix/incorrect-tax-calculation

git checkout -b docs/api-authentication-guide
git checkout -b docs/deployment-instructions

git checkout -b test/user-signup-integration
git checkout -b refactor/clean-error-handling

# Connect to issues
git checkout -b feature/user-auth-#123
git checkout -b fix/order-race-#456
```

### 3. PR Process with git-master Skill

```bash
# Step 1: Create feature branch
git checkout -b feature/new-payment-service

# Step 2: Make atomic commits
git commit -m "feat(payment): add payment gateway interface

- Define PaymentProcessor interface
- Create CardProcessor implementation
- Add supporting types and errors"

git commit -m "feat(payment): integrate with Stripe API

- Implement Stripe CardProcessor
- Add webhook handling
- Create test doubles for testing

Closes #234"

# Step 3: Ensure tests pass locally
npm run test -- src/payment
npm run test:coverage

# Step 4: Push to remote
git push -u origin feature/new-payment-service

# Step 5: Create PR with gh command
gh pr create \
  --title "Add Stripe payment integration" \
  --body "
## Summary
- Implements PaymentProcessor interface for Stripe
- Handles card processing and webhooks
- Achieves 85% coverage

## Changes
- New: PaymentProcessor interface and Stripe implementation
- New: Webhook handling for payment events
- Updated: Order checkout to use new processor

Closes #234
" \
  --assignee @me \
  --reviewer colleague1,colleague2

# Step 6: Address review feedback
git commit -m "refactor(payment): simplify webhook error handling

- Consolidate error types
- Improve retry logic
- Add more descriptive logging"

git push

# Step 7: Merge via GitHub (creates merge commit)
gh pr merge --squash feature/new-payment-service
```

### 4. Commit Size Guidelines

```bash
# DO: Small, focused commits
# Good: 50-200 lines changed
git diff --stat
# src/payment/PaymentProcessor.ts      | 60 +-
# src/payment/StripeAdapter.ts         | 45 +-
# src/payment/errors.ts                | 15 +
# 3 files changed, 120 insertions(+), 0 deletions(-)

# DON'T: Giant commits
# Bad: 2000+ lines changed
git diff --stat
# src/payment/everything.ts            | 2000 +-
# 1 file changed, 2000 insertions(+), 0 deletions(-)

# Instead, split into logical commits:
git commit -m "feat(payment): add Payment interfaces and errors"
git commit -m "feat(payment): implement Stripe adapter"
git commit -m "feat(payment): integrate payment processor into orders"
```

### 5. Keep History Clean

```bash
# DO: Rebase before PR to clean up history
git fetch origin
git rebase origin/main

# If conflicts occur, resolve and continue
git add src/conflicted-file.ts
git rebase --continue

# DO: Squash local WIP commits before pushing
git log --oneline
# abc1234 WIP: debugging payment issue
# def5678 WIP: fix test
# ghi9012 feat: add payment service

# Squash last 2 commits
git rebase -i HEAD~2

# In editor, mark 'def5678' and 'abc1234' as 'squash'
# Result: single clean commit

# DO: Force push only to your own branch (not main)
git push --force origin feature/my-feature

# DON'T: Never force push to main
# git push --force origin main  # ❌ FORBIDDEN
```

### 6. Cherry-pick and Revert Properly

```bash
# DO: Cherry-pick commits to other branches
git checkout hotfix/urgent-bug
git cherry-pick abc1234  # Copy commit from main

# DO: Revert with explicit commit message
git revert abc1234 --no-edit

# Creates new commit: "Revert: feat(payment): add Stripe integration
#
# This reverts commit abc1234"

# DON'T: Hard reset shared history
# git reset --hard HEAD~5  # ❌ Breaks other developers' branches
```

## DON'T ❌

### 1. Don't Commit to main Directly

```bash
# DON'T: Committing directly to main
git checkout main
git commit -m "quick fix"  # ❌

# Instead, use feature branch
git checkout -b fix/urgent-bug
git commit -m "fix: resolve urgent issue"
git push -u origin fix/urgent-bug
# Create PR for review
```

### 2. Don't Make Unfocused Commits

```bash
# DON'T: Multiple concerns in one commit
git commit -m "refactor and add tests and update docs and fix bug"
# Changes: 45 files, 2000 lines

# Instead, split logically
git commit -m "feat(auth): add password reset endpoint"
git commit -m "test(auth): add password reset tests"
git commit -m "docs(auth): update auth guide"
git commit -m "fix(auth): resolve token expiry bug"
```

### 3. Don't Use Vague Commit Messages

```bash
# DON'T: Unclear messages
git commit -m "fix stuff"
git commit -m "update code"
git commit -m "add things"

# Instead, be specific
git commit -m "fix(payment): handle Stripe connection errors with retry logic"
git commit -m "refactor(auth): extract token validation into separate service"
git commit -m "feat(notifications): add email queue system"
```

### 4. Don't Mix Formatting and Logic Changes

```bash
# DON'T: Format entire file + add feature
git diff
# src/UserService.ts  | 500 +-  (huge diff, hard to review)
# Can't tell what actually changed

# Instead, separate concerns
git commit -m "refactor(style): format UserService.ts to match prettier config"
git commit -m "feat(users): add email validation to UserService"

# Now reviewers can easily see the feature change
```

### 5. Don't Rewrite Published History

```bash
# DON'T: Amend pushed commits
git commit --amend
git push --force origin main  # ❌ Breaks other developers' work

# DO: If you must revert, create new commit
git revert abc1234
git push origin main
```

### 6. Don't Leave Merge Commits in History

```bash
# DON'T: Merge conflicts with messy merge commits
git merge feature/old-feature
# (conflicts occur, manual merge)
git commit -m "Merge branch 'feature/old-feature' into main"

# Instead, rebase first
git fetch origin
git rebase origin/main  # Resolve conflicts here
git push origin feature/my-feature
# Then PR with clean history

# Or use squash merge
gh pr merge --squash feature/my-feature
```

## Commit Message Template

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code change (no feature, no bug fix)
- `perf`: Performance improvement
- `test`: Add/update tests
- `docs`: Documentation
- `style`: Formatting (doesn't change code)
- `chore`: Maintenance (deps, build)

### Scopes (Examples)

- `auth`, `users`, `orders`, `payment`
- `database`, `api`, `cache`
- `tests`, `docs`

### Subject

- Imperative mood ("add" not "added")
- No period at end
- Max 50 characters

### Body

- Explain WHY, not WHAT
- Wrap at 72 characters
- Separate from subject with blank line

### Footer

- Reference issues: `Closes #123`
- Reference PRs: `PR: #456`
- Breaking changes: `BREAKING CHANGE: description`

## Workflow Diagram

```
main branch
    ↓
Create feature branch: feature/payment-service
    ↓
Make atomic commits (tests pass on each)
    ↓
Push to remote
    ↓
Create PR with gh command
    ↓
Code review + CI checks
    ↓
Address feedback (more atomic commits)
    ↓
Rebase and squash if needed
    ↓
Squash-merge to main
    ↓
Delete feature branch
    ↓
back to main (updated)
```

## Common Commands with git-master

```bash
# Show recent commits with details
git log --oneline -20
git log --pretty=format:"%h %s %b" -10

# Search commits by message
git log --grep="payment" --oneline

# Find who wrote a line (blame)
git blame src/UserService.ts

# Find when feature was added (log -S)
git log -S "class PaymentProcessor" --oneline

# Rebase branch onto main
git fetch origin
git rebase origin/main
git push --force origin feature/my-branch

# Squash commits before PR
git rebase -i origin/main
# Mark commits as 'squash' (or 's')
# Save and edit commit message

# View diff before committing
git diff
git diff --staged

# Create fixup commit (auto-squashes)
git commit --fixup abc1234
git rebase -i origin/main
# (auto-marks as fixup)
```

## Integration with Skills

- **Use /git-master skill**: For complex rebase, squash, history search
- **Use with TDD**: Red → Green → Refactor → Commit
- **Use with clean-architecture**: Architecture changes get focused commits
- **Use with effect-patterns**: Error handling changes are reviewable

## Rationale

| Practice             | Why                                          |
| -------------------- | -------------------------------------------- |
| Conventional Commits | Automated tooling; clear history; searchable |
| Atomic commits       | Bisectable; easy to revert; clear changes    |
| Branch naming        | Clear intent; organizeable; reviewable       |
| Clean history        | Readable `git log`; easier debugging         |
| PR process           | Peer review; quality gate; CI verification   |

## References

- Conventional Commits: https://www.conventionalcommits.org/
- GitHub CLI: https://cli.github.com/
- Git Rebase Guide: https://git-scm.com/docs/git-rebase
- Atomic Commits: https://en.wikipedia.org/wiki/Atomic_commit
