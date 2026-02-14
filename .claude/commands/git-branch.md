---
description: Git workflow helper for branch management and common git operations
argument-hint: "[command] [args]"
---

# Git Branch Command

## Usage

```
claude git-branch [command] [args]
claude git-branch create [feature-name]
claude git-branch sync
claude git-branch cleanup
```

Simplifies git workflow with intelligent branch management.

## Steps

1. **Parse Git Command** - Interpret workflow request
2. **Validate State** - Check:
   - Working directory clean
   - Remote tracking updated
   - No conflicting branches
3. **Execute Git Operations** - Perform requested operation
4. **Handle Conflicts** - Detect and suggest resolution
5. **Update Local State** - Sync branches and tracking
6. **Provide Feedback** - Show results and next steps

## Commands

### create [feature-name]
Creates feature branch with proper naming convention
- Branch from: main/develop (based on config)
- Naming: `feature/feature-name` or `feat/feature-name`
- Sets upstream tracking
- Shows branch creation confirmation

### sync
Synchronizes current branch with remote
- Fetch latest remote changes
- Rebase on upstream (if configured)
- Push local commits
- Handle merge conflicts
- Show commit summary

### cleanup [--dry-run]
Cleans up merged and stale branches
- Lists branches merged into main
- Removes local merged branches
- Removes tracking references
- Shows cleanup summary

### status
Shows branch and sync status
- Current branch and commit
- Commits ahead/behind
- Unpushed commits
- Stashed changes

### rebase [target-branch]
Interactive rebase for clean history
- Rebase on target branch
- Suggest squash/fixup opportunities
- Preserve formatting
- Handle conflicts

### publish
Pushes branch and creates tracking
- Set upstream to origin
- Create PR (if configured)
- Generate changelog entry
- Show publish result

## Options

- `--dry-run` - Show what would happen
- `--force` - Skip safety checks
- `--no-push` - Perform operation without pushing
- `--squash` - Squash commits during rebase
- `--verbose` - Show detailed output

## Examples

```bash
# Create feature branch
claude git-branch create user-authentication

# Sync with remote
claude git-branch sync

# Rebase on main
claude git-branch rebase main

# View status
claude git-branch status

# Clean merged branches
claude git-branch cleanup --dry-run

# Rebase with squash
claude git-branch rebase develop --squash

# Publish feature with tracking
claude git-branch publish
```

## Tech Stack Integration

- **Git** - Version control operations
- **GitHub** - PR creation and integration
- **Moonrepo** - Branch scope detection

## Workflow Conventions

1. Feature branches: `feature/*` or `feat/*`
2. Bug fixes: `fix/*`
3. Chores: `chore/*`
4. Main branch: `main`
5. Develop branch: `develop` (if used)

## Git Best Practices

- Keep commits atomic and focused
- Write clear commit messages
- Rebase before merging
- Clean history on PR
- Link issues in commits
