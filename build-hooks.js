const fs = require('fs');
const path = require('path');

exports.default = async function(context) {
  console.log('Running afterPack hook...');

  const appOutDir = context.appOutDir;

  // Step 1: Remove chrome-sandbox
  const chromeSandboxPath = path.join(appOutDir, 'chrome-sandbox');
  if (fs.existsSync(chromeSandboxPath)) {
    console.log('✓ Removing chrome-sandbox');
    fs.unlinkSync(chromeSandboxPath);
  }

  // Step 2: Create wrapper script for --no-sandbox
  // The executable name comes from package.json "name" field
  const packageInfo = require('./package.json');
  const executableName = packageInfo.name;
  const originalBinary = path.join(appOutDir, executableName);
  const renamedBinary = path.join(appOutDir, `${executableName}.bin`);

  if (fs.existsSync(originalBinary)) {
    console.log(`✓ Renaming ${executableName} → ${executableName}.bin`);
    fs.renameSync(originalBinary, renamedBinary);

    // Create wrapper script that passes --no-sandbox
    const wrapperScript = `#!/bin/bash
# Auto-generated wrapper to pass --no-sandbox flag
SCRIPT_DIR="\$(dirname "\$0")"
exec "\$SCRIPT_DIR/${executableName}.bin" --no-sandbox "\$@"
`;

    console.log(`✓ Creating wrapper script: ${executableName}`);
    fs.writeFileSync(originalBinary, wrapperScript, { mode: 0o755 });

    console.log('✓ AppImage will now run with --no-sandbox automatically!');
  } else {
    console.log(`⚠ Warning: Executable ${executableName} not found`);
  }
};
