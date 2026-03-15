const fs = require('fs');

const inputPath = 'C:/Users/92860/Desktop/AI编程项目-个人合集/测试ClaudeCode/DailyNews/sections-2026-03-13.json';
const outputPath = 'C:/Users/92860/Desktop/AI编程项目-个人合集/测试ClaudeCode/DailyNews/sections-2026-03-13-fixed.json';

let content = fs.readFileSync(inputPath, 'utf-8');

// Replace curly quotes with escaped straight quotes
content = content.replace(/\u201C/g, '\\"').replace(/\u201D/g, '\\"');

fs.writeFileSync(outputPath, content, 'utf-8');

// Test if valid
try {
  const data = JSON.parse(content);
  console.log('JSON is now valid!');
  console.log('Keys:', Object.keys(data));
} catch(e) {
  console.log('Still invalid:', e.message);
}
