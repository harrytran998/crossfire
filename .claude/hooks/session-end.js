/**
 * SESSION-END HOOKS
 * Cleanup and summary when session ends
 * - Displays session summary
 * - Provides cleanup reminders
 */

const fs = require('fs');
const path = require('path');

function loadConfig() {
  const configPath = path.join(__dirname, 'hooks.json');
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

/**
 * Session Summary Handler
 * Displays statistics and summary of session
 */
function displaySessionSummary(sessionContext, stats) {
  const config = loadConfig();
  const duration = stats.duration || 0;
  const durationMinutes = Math.floor(duration / 60000);
  const durationSeconds = ((duration % 60000) / 1000).toFixed(0);

  const summaryMessage = `
╔════════════════════════════════════════════════════════════════╗
║                   ✅ SESSION SUMMARY                          ║
╚════════════════════════════════════════════════════════════════╝

⏱️  Session Duration:
   • Total: ${durationMinutes}m ${durationSeconds}s

📊 Operations Summary:
   • Tools executed: ${stats.toolsExecuted || 0}
   • Files modified: ${stats.filesModified || 0}
   • Git commits: ${stats.commits || 0}
   • Warnings issued: ${stats.warnings || 0}
   • Secrets blocked: ${stats.secretsBlocked || 0}

🛡️  Security Summary:
   • Pre-tool validations: ${stats.preToolChecks || 0}
   • Dangerous commands detected: ${stats.dangerousCommands || 0}
   • Operations logged: ${stats.operationsLogged || 0}

📝 Audit Trail:
   • Hook version: ${config.version}
   • All operations logged for security review
   • Session ID: ${sessionContext.sessionId || 'N/A'}
`;

  console.log(summaryMessage);

  return {
    success: true,
    message: 'Summary displayed',
    stats: stats
  };
}

/**
 * Cleanup Reminders Handler
 * Provides helpful reminders for common cleanup tasks
 */
function displayCleanupReminders(sessionContext, stats) {
  const reminders = [];

  // Check for uncommitted changes
  if (stats.filesModified && stats.filesModified > 0 && stats.commits === 0) {
    reminders.push({
      priority: 'high',
      message: '📝 You have modified files but no commits were made. Consider committing your changes.',
      action: 'git status'
    });
  }

  // Check for untracked files
  if (stats.untrackedFiles && stats.untrackedFiles > 0) {
    reminders.push({
      priority: 'medium',
      message: `📁 There are ${stats.untrackedFiles} untracked files in the working directory.`,
      action: 'git status'
    });
  }

  // Check for staged but uncommitted changes
  if (stats.stagedChanges && stats.stagedChanges > 0) {
    reminders.push({
      priority: 'medium',
      message: `✏️  There are staged changes waiting to be committed.`,
      action: 'git diff --cached'
    });
  }

  // Remind about security practices
  reminders.push({
    priority: 'info',
    message: '🔒 Remember: Never commit secrets or sensitive information.',
    action: 'Review .gitignore'
  });

  // Remind about testing
  if (stats.filesModified && stats.filesModified > 5) {
    reminders.push({
      priority: 'medium',
      message: '🧪 With many files modified, consider running tests to ensure stability.',
      action: 'npm test'
    });
  }

  // Display reminders
  if (reminders.length > 0) {
    console.log('\n💡 Reminders & Next Steps:\n');
    
    const highPriority = reminders.filter(r => r.priority === 'high');
    const mediumPriority = reminders.filter(r => r.priority === 'medium');
    const infoPriority = reminders.filter(r => r.priority === 'info');

    if (highPriority.length > 0) {
      console.log('🔴 HIGH PRIORITY:');
      highPriority.forEach(r => {
        console.log(`   • ${r.message}`);
        console.log(`     → ${r.action}\n`);
      });
    }

    if (mediumPriority.length > 0) {
      console.log('🟡 MEDIUM PRIORITY:');
      mediumPriority.forEach(r => {
        console.log(`   • ${r.message}`);
        console.log(`     → ${r.action}\n`);
      });
    }

    if (infoPriority.length > 0) {
      console.log('🔵 REMINDERS:');
      infoPriority.forEach(r => {
        console.log(`   • ${r.message}`);
        console.log(`     → ${r.action}\n`);
      });
    }
  }

  return {
    success: true,
    remindersCount: reminders.length,
    reminders: reminders
  };
}

/**
 * Main session-end handler
 */
function sessionEnd(sessionContext, stats) {
  console.log('\n🔧 [SESSION-END] Finalizing hooks...\n');

  const summary = displaySessionSummary(sessionContext, stats);
  const cleanupReminders = displayCleanupReminders(sessionContext, stats);

  const exitMessage = `
📌 Session Details:
   • Review above reminders and take appropriate action
   • All operations have been logged for security audit
   • Thank you for using the hook system!

👋 Goodbye!\n`;

  console.log(exitMessage);

  return {
    success: summary.success && cleanupReminders.success,
    finalized: true,
    summaryStats: summary.stats,
    reminders: cleanupReminders.reminders
  };
}

module.exports = {
  sessionEnd,
  displaySessionSummary,
  displayCleanupReminders
};
