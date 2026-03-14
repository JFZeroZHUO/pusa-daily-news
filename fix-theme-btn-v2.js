/**
 * fix-theme-btn-v2.js
 * 用正则找到 header-top 的第一个 </div>，在其前插入主题按钮
 */
const fs = require('fs');
const path = require('path');
const dir = __dirname;

function processFile(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');

  if (html.includes('id="themeToggle"')) {
    console.log(`  [skip] ${path.basename(filePath)} — 按钮已存在`);
    return;
  }

  // 找到 header-top 开始位置，然后找第一个 </div> 并在其前插入按钮
  const htStart = html.indexOf('<div class="header-top">');
  if (htStart === -1) {
    console.log(`  [warn] ${path.basename(filePath)} — 未找到 header-top`);
    return;
  }

  const closingDivIdx = html.indexOf('</div>', htStart);
  if (closingDivIdx === -1) {
    console.log(`  [warn] ${path.basename(filePath)} — 未找到 </div>`);
    return;
  }

  // 取出前面的缩进（从行首到 </div>）
  const lineStart = html.lastIndexOf('\n', closingDivIdx) + 1;
  const indent = html.slice(lineStart, closingDivIdx).match(/^(\s*)/)[1];

  const btn = `${indent}  <button class="theme-btn" id="themeToggle" onclick="toggleTheme()">☀️ 明亮</button>\n`;
  html = html.slice(0, closingDivIdx) + btn + html.slice(closingDivIdx);

  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`  [done] ${path.basename(filePath)}`);
}

const files = fs.readdirSync(dir)
  .filter(f => /^daily-\d{4}-\d{2}-\d{2}\.html$/.test(f))
  .sort();

console.log(`\n修复 ${files.length} 个日报文件...\n`);
files.forEach(f => processFile(path.join(dir, f)));
console.log('\n完成。');
