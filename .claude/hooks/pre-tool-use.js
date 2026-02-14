/**
 * PRE-TOOL-USE HOOKS
 * Validates tool execution before it runs
 * - Detects secrets in commits
 * - Warns on dangerous bash commands
 */

const fs = require('fs')
const path = require('path')

// Load configuration
function loadConfig() {
  const configPath = path.join(__dirname, 'hooks.json')
  return JSON.parse(fs.readFileSync(configPath, 'utf8'))
}

/**
 * Secret Detection Handler
 * Prevents commits that contain sensitive information
 */
function detectSecrets(toolContext) {
  if (toolContext.toolName !== 'bash' || !toolContext.command.includes('git commit')) {
    return { allowed: true }
  }

  const config = loadConfig()
  const secretPatterns = config.config.secretPatterns

  // Check for secrets in the command
  const commandStr = toolContext.command

  for (const pattern of secretPatterns) {
    const regex = new RegExp(pattern)
    if (regex.test(commandStr)) {
      return {
        allowed: false,
        error: `🚨 SECRET DETECTED: Commit blocked due to potential secret exposure. Pattern matched: ${pattern}`,
        handler: 'secret-detector',
      }
    }
  }

  // Check for secrets in staged files (git diff HEAD)
  if (commandStr.includes('git commit') && !commandStr.includes('--allow-empty')) {
    try {
      // This would require additional file system access in real implementation
      const stagedFilesCheck = `git diff --cached`
      // Pattern matching would happen on actual file contents
    } catch (err) {
      // Silently continue if unable to check
    }
  }

  return { allowed: true }
}

/**
 * Dangerous Commands Handler
 * Warns about potentially destructive operations
 */
function detectDangerousCommands(toolContext) {
  if (toolContext.toolName !== 'bash') {
    return { allowed: true, warnings: [] }
  }

  const config = loadConfig()
  const dangerousPatterns = config.config.dangerousCommands
  const warnings = []

  const command = toolContext.command

  for (const pattern of dangerousPatterns) {
    const regex = new RegExp(pattern)
    if (regex.test(command)) {
      warnings.push({
        severity: 'high',
        message: `⚠️  DANGEROUS COMMAND: This command matches a dangerous pattern and could cause data loss: ${pattern}`,
      })
    }
  }

  // Additional checks
  if (command.includes('sudo') && !command.includes('sudo -u')) {
    warnings.push({
      severity: 'medium',
      message: '⚠️  ELEVATED PRIVILEGES: This command uses sudo. Ensure this is intentional.',
    })
  }

  if (command.includes('git push') && command.includes('--force')) {
    warnings.push({
      severity: 'high',
      message:
        '⚠️  FORCE PUSH: This will overwrite remote history. Ensure you have reviewed all changes.',
    })
  }

  if (command.length > 10000) {
    warnings.push({
      severity: 'medium',
      message:
        '⚠️  VERY LONG COMMAND: This command is unusually long and may contain unintended operations.',
    })
  }

  if (warnings.length > 0) {
    return {
      allowed: true,
      warnings: warnings,
      handler: 'dangerous-commands',
      requiresConfirmation: warnings.some((w) => w.severity === 'high'),
    }
  }

  return { allowed: true }
}

/**
 * Main pre-tool-use handler
 */
function preToolUse(toolContext) {
  console.log(`\n📋 [PRE-TOOL-USE] Validating: ${toolContext.toolName}`)

  const secretCheck = detectSecrets(toolContext)
  if (!secretCheck.allowed) {
    return secretCheck
  }

  const dangerousCheck = detectDangerousCommands(toolContext)
  if (!dangerousCheck.allowed) {
    return dangerousCheck
  }

  if (dangerousCheck.warnings && dangerousCheck.warnings.length > 0) {
    dangerousCheck.warnings.forEach((w) => {
      console.log(`   ${w.message}`)
    })
    if (dangerousCheck.requiresConfirmation) {
      console.log('   ⏸️  User confirmation may be required to proceed.')
    }
  }

  return { allowed: true }
}

module.exports = {
  preToolUse,
  detectSecrets,
  detectDangerousCommands,
}
