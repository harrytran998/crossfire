/**
 * SESSION-START HOOKS
 * Initialization and setup when session begins
 * - Displays welcome message
 * - Checks for version updates
 */

const fs = require('fs');
const path = require('path');

function loadConfig() {
  const configPath = path.join(__dirname, 'hooks.json');
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

/**
 * Welcome Message Handler
 * Displays session initialization message
 */
function displayWelcomeMessage(sessionContext) {
  const timestamp = new Date().toLocaleString();
  
  const welcomeMessage = `
╔════════════════════════════════════════════════════════════════╗
║                   🚀 SESSION STARTED                           ║
╚════════════════════════════════════════════════════════════════╝

📋 Session Information:
   • Time: ${timestamp}
   • Project: ${sessionContext.projectPath || 'crossfire'}
   • Hook Version: ${loadConfig().version}
   • Status: Ready ✓

🛡️  Security & Safety Features Active:
   ✓ Secret detection enabled
   ✓ Dangerous command warnings enabled
   ✓ Pre-tool validation active
   ✓ Post-tool logging active

💡 Useful Commands:
   • Use bash for terminal operations
   • Use edit for file modifications
   • Use read for file inspection
   • All operations are logged for audit trail

Type 'help' for command reference or press Ctrl+C to exit.
`;

  console.log(welcomeMessage);

  return {
    success: true,
    message: 'Welcome message displayed'
  };
}

/**
 * Version Check Handler
 * Checks for updates and version compatibility
 */
function checkVersions(sessionContext) {
  const config = loadConfig();
  const warnings = [];
  const info = [];

  // Check hook version
  const hookVersion = config.version;
  info.push(`Hook system version: ${hookVersion}`);

  // Check Node.js version (if applicable)
  if (process.version) {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
    
    if (majorVersion < 14) {
      warnings.push({
        severity: 'warning',
        message: `⚠️  Node.js ${nodeVersion} detected. Recommended: v14 or higher`
      });
    } else {
      info.push(`Node.js version: ${nodeVersion} ✓`);
    }
  }

  // Check git
  if (sessionContext.hasGit) {
    info.push('Git integration: Enabled ✓');
  } else {
    warnings.push({
      severity: 'info',
      message: 'ℹ️  Git not detected. Git-related hooks will be unavailable.'
    });
  }

  // Display warnings if any
  if (warnings.length > 0) {
    console.log('\n⚠️  Version Checks:');
    warnings.forEach(w => {
      console.log(`   ${w.message}`);
    });
  }

  // Display info
  if (info.length > 0 && process.env.VERBOSE_HOOKS) {
    console.log('\nℹ️  Environment Info:');
    info.forEach(i => {
      console.log(`   ${i}`);
    });
  }

  return {
    success: true,
    warnings: warnings,
    info: info
  };
}

/**
 * Main session-start handler
 */
function sessionStart(sessionContext) {
  console.log('\n🔧 [SESSION-START] Initializing hooks...\n');

  const welcome = displayWelcomeMessage(sessionContext);
  const versions = checkVersions(sessionContext);

  if (!welcome.success) {
    console.error('Failed to display welcome message');
  }

  return {
    success: welcome.success && versions.success,
    warnings: versions.warnings,
    initialized: true
  };
}

module.exports = {
  sessionStart,
  displayWelcomeMessage,
  checkVersions
};
