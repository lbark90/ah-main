const fs = require('fs');
const path = require('path');

function searchForFramerMotion(directory) {
  const files = fs.readdirSync(directory);
  
  files.forEach(file => {
    const filePath = path.join(directory, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory() && !filePath.includes('node_modules')) {
      searchForFramerMotion(filePath);
    } else if (stats.isFile() && (filePath.endsWith('.tsx') || filePath.endsWith('.ts'))) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('framer-motion')) {
        console.log(`Found framer-motion in: ${filePath}`);
      }
    }
  });
}

searchForFramerMotion('./');
console.log('Search complete');
