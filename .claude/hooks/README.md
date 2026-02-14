# Crossfire Hooks System

Complete hook configuration for development workflow automation and security.

## 📋 Files Created

### 1. **hooks.json** (Main Configuration)
- Central hook event configuration
- Defines all handlers and events
- Security pattern definitions (secrets, dangerous commands)
- Lint trigger patterns

**Events:**
- `PreToolUse` - Validates before tool execution
- `PostToolUse` - Post-execution analysis and logging
- `SessionStart` - Session initialization
- `SessionEnd` - Session cleanup and summary

### 2. **pre-tool-use.js** (Pre-Execution Validation)

**Handlers:**
- `secret-detector`: Blocks commits containing secrets
  - Pattern matching for API keys, passwords, private keys
  - Prevents accidental credential exposure
  
- `dangerous-commands`: Warns on destructive operations
  - Detects: rm -rf /, dd, fork bombs, chmod 000
  - Flags: sudo usage, force pushes, long commands

**Exports:**
- `preToolUse()` - Main handler
- `detectSecrets()` - Secret pattern matching
- `detectDangerousCommands()` - Command validation

### 3. **post-tool-use.js** (Post-Execution Actions)

**Handlers:**
- `lint-suggester`: Recommends linting after modifications
  - Triggers on .ts, .tsx, .js, .jsx, .json, .css files
  - Suggests: `npm run lint`
  
- `operation-logger`: Creates audit trail
  - Logs: timestamp, tool, command (truncated), exit code
  - Security-focused logging

**Exports:**
- `postToolUse()` - Main handler
- `suggestLinting()` - Lint recommendations
- `logOperation()` - Audit logging

### 4. **session-start.js** (Session Initialization)

**Handlers:**
- `welcome-message`: Displays session info
  - Shows: timestamp, project, hook version
  - Lists active security features
  
- `version-check`: Environment validation
  - Checks: Node.js version, git availability
  - Warns: outdated versions

**Exports:**
- `sessionStart()` - Main handler
- `displayWelcomeMessage()` - Welcome display
- `checkVersions()` - Environment verification

### 5. **session-end.js** (Session Cleanup)

**Handlers:**
- `session-summary`: Statistics and duration
  - Shows: operation count, files modified, commits made
  - Displays: security stats, audit trail info
  
- `cleanup-reminders`: Actionable next steps
  - Detects: uncommitted changes, untracked files, staged changes
  - Reminds: security practices, testing on large changes

**Exports:**
- `sessionEnd()` - Main handler
- `displaySessionSummary()` - Session stats
- `displayCleanupReminders()` - Cleanup recommendations

---

## 🛡️ Security Features

### Secret Detection
Patterns matched:
- `password`, `passwd`, `pwd`
- `api_key`, `apikey`
- `secret`, `token`
- `aws_key`, `gcp_secret`, `azure_key`
- `private_key`, `BEGIN PRIVATE KEY`

### Dangerous Command Detection
Patterns flagged:
- `rm -rf /` - Full filesystem deletion
- `dd if=` - Disk operations
- `:(){ *:|:|&` - Fork bomb
- `fork()` - Process bombing
- `mkfs` - Filesystem formatting
- `chmod 000` - Permission lockout
- `git push --force` - Force push

---

## 📊 Hook Event Flow

```
Session Start
    ↓
[SESSION-START] → Welcome + Version Check
    ↓
User Issues Tool Command
    ↓
[PRE-TOOL-USE] → Secret Detection + Dangerous Commands Check
    ↓
Tool Executes
    ↓
[POST-TOOL-USE] → Lint Suggestions + Operation Logging
    ↓
(Repeat for each tool)
    ↓
Session End
    ↓
[SESSION-END] → Summary + Cleanup Reminders
```

---

## 🔧 Configuration

**Enabled by default:**
- All hooks active
- All handlers enabled
- Pattern matching configured

**To customize:**
1. Edit `hooks.json` config section
2. Modify patterns, triggers, or disable handlers
3. Add/remove event types as needed

**Environment Variables:**
- `DEBUG_HOOKS` - Enable detailed logging
- `VERBOSE_HOOKS` - Show environment info on session start

---

## 📝 Usage Examples

### Secret Detection
```
$ git commit -m "Add AWS_SECRET_KEY=xxx"
🚨 SECRET DETECTED: Commit blocked due to potential secret exposure
```

### Dangerous Command Warning
```
$ rm -rf /important/data
⚠️  DANGEROUS COMMAND: This command matches dangerous pattern...
⏸️  User confirmation may be required to proceed.
```

### Lint Suggestion
```
$ edit src/component.ts
💡 LINT SUGGESTION: Consider running linter on modified file: src/component.ts
→ Try: npm run lint
```

### Welcome Message
On session start:
```
╔════════════════════════════════════════════════════════════════╗
║                   🚀 SESSION STARTED                           ║
╚════════════════════════════════════════════════════════════════╝

📋 Session Information: [details]
🛡️  Security & Safety Features Active: [features]
💡 Useful Commands: [commands]
```

### Session Summary
On session end:
```
╔════════════════════════════════════════════════════════════════╗
║                   ✅ SESSION SUMMARY                          ║
╚════════════════════════════════════════════════════════════════╝

⏱️  Session Duration: 15m 32s
📊 Operations Summary: [stats]
🛡️  Security Summary: [security]
💡 Reminders & Next Steps: [reminders]
```

---

## 📌 Integration Points

**Pre-Tool-Use Hooks:**
- Runs before bash, git, edit operations
- Blocks execution on secret detection
- Warns on dangerous commands (non-blocking)

**Post-Tool-Use Hooks:**
- Runs after any tool execution
- Analyzes output for file modifications
- Suggests linting on relevant files

**Session Hooks:**
- Start: Initialize environment and display welcome
- End: Show summary and cleanup reminders

---

## ⚙️ Handler Response Format

All handlers return objects:

```javascript
{
  allowed: true/false,           // PreToolUse only
  error: "message",              // If blocked
  warnings: [{ severity, message, command?, action? }],
  suggestions: [{ severity, message, command? }],
  reminders: [{ priority, message, action? }],
  success: true/false,           // Overall success
  logged: true/false             // PostToolUse only
}
```

---

## 🚀 Quick Reference

| File | Purpose | Main Export |
|------|---------|-------------|
| `hooks.json` | Configuration | N/A (JSON) |
| `pre-tool-use.js` | Validation | `preToolUse()` |
| `post-tool-use.js` | Post-actions | `postToolUse()` |
| `session-start.js` | Initialization | `sessionStart()` |
| `session-end.js` | Cleanup | `sessionEnd()` |

Location: `.claude/hooks/`
