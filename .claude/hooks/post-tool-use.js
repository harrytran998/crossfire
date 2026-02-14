/**
 * POST-TOOL-USE HOOKS
 * Handles post-execution actions
 * - Suggests linting on file modifications
 * - Logs operations for audit trail
 */

const fs = require('fs');
const path = require('path');

function loadConfig() {
  const configPath = path.join(__dirname, 'hooks.json');
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

/**
 * Lint Suggester Handler
 * Recommends linting after file modifications
 */
function suggestLinting(toolContext, result) {
  if (toolContext.toolName !== 'bash' || result.exitCode !== 0) {
    return { suggestions: [] };
  }

  const config = loadConfig();
  const lintTriggers = config.config.lintTriggers;
  const suggestions = [];

  // Check output for modified files
  const output = result.stdout || '';
  let filesModified = [];

  // Detect file modifications from common commands
  if (toolContext.command.includes('git add') || 
      toolContext.command.includes('npm install') ||
      toolContext.command.includes('edit') ||
      output.includes('Wrote file')) {
    
    // Extract file patterns from output
    const filePattern = /(\S+\.(ts|tsx|js|jsx|json|css))\b/gi;
    let match;
    while ((match = filePattern.exec(output)) !== null) {
      filesModified.push(match[1]);
    }

    // Check if any modified files match lint triggers
    filesModified.forEach(file => {
      lintTriggers.forEach(trigger => {
        const regex = new RegExp(trigger);
        if (regex.test(file)) {
          suggestions.push({
            severity: 'info',
            message: `💡 LINT SUGGESTION: Consider running linter on modified file: ${file}`,
            command: 'npm run lint'
          });
        }
      });
    });
  }

  return { suggestions };
}

/**
 * Operation Logger Handler
 * Creates audit trail of operations
 */
function logOperation(toolContext, result) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    tool: toolContext.toolName,
    command: toolContext.command.substring(0, 200), // Truncate for security
    exitCode: result.exitCode,
    duration: result.duration || 0,
    hasErrors: result.exitCode !== 0
  };

  // Log to file if needed (in real implementation)
  if (process.env.DEBUG_HOOKS) {
    console.log(`📝 [AUDIT LOG] ${JSON.stringify(logEntry)}`);
  }

  return { logged: true, entry: logEntry };
}

/**
 * Main post-tool-use handler
 */
function postToolUse(toolContext, result) {
  console.log(`\n✅ [POST-TOOL-USE] Completed: ${toolContext.toolName} (exit code: ${result.exitCode})`);

  const lintSuggestions = suggestLinting(toolContext, result);
  if (lintSuggestions.suggestions.length > 0) {
    lintSuggestions.suggestions.forEach(s => {
      console.log(`   ${s.message}`);
      if (s.command) {
        console.log(`   → Try: ${s.command}`);
      }
    });
  }

  const logResult = logOperation(toolContext, result);
  
  return {
    success: true,
    suggestions: lintSuggestions.suggestions,
    logged: logResult.logged
  };
}

module.exports = {
  postToolUse,
  suggestLinting,
  logOperation
};
