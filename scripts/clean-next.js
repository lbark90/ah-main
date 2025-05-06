const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Path to .next directory
const nextDir = path.join(process.cwd(), '.next');

// Check if .next directory exists
if (fs.existsSync(nextDir)) {
  console.log('Cleaning .next directory before build...');
  
  try {
    // Remove the directory recursively
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log('.next directory successfully removed');
  } catch (err) {
    console.error('Error removing .next directory:', err);
    
    // Try using shell commands as a fallback
    try {
      console.log('Trying with shell command...');
      if (process.platform === 'win32') {
        execSync('rmdir /s /q .next', { stdio: 'inherit' });
      } else {
        execSync('rm -rf .next', { stdio: 'inherit' });
      }
      console.log('.next directory successfully removed with shell command');
    } catch (shellErr) {
      console.error('Failed to remove .next directory with shell command:', shellErr);
    }
  }
} else {
  console.log('.next directory does not exist, no cleaning needed');
}

console.log('Ready to build!');
