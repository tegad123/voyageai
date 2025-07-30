#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Props that should be numeric, not string
const NUMERIC_PROPS = [
  'size', 'width', 'height', 'radius', 'borderRadius', 
  'shadowRadius', 'elevation', 'padding', 'margin', 'top', 
  'bottom', 'left', 'right', 'flex', 'zIndex'
];

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    NUMERIC_PROPS.forEach(prop => {
      const regex = new RegExp(`${prop}\\s*=\\s*["']large["']`, 'g');
      if (regex.test(line)) {
        console.log(`⚠️  ${filePath}:${index + 1} - Found "${prop}='large'" or "${prop}="large""`);
      }
    });
  });
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      walkDir(filePath);
    } else if (file.match(/\.(js|jsx|ts|tsx)$/)) {
      checkFile(filePath);
    }
  });
}

console.log('🔍 Checking for "large" string props...');
walkDir('.');
console.log('✅ Check complete!'); 