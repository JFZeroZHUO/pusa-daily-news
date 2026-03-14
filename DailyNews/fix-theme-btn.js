/**
 * fix-theme-btn.js
 * 修复：按钮被误删，重新插入 header-top 末尾
 */
const fs = require('fs');
const path = require('path');
const dir = __dirname;

// 目标：header-top 的 </div> 紧接着 header-divider
// 在 header-top 的 </div> 前插入按钮
const ANCHOR = `  </div>\n  <div class="header-divider">`;
const WITH_BTN = `    <button class="theme-btn" id="themeToggle" onclick="toggleTheme()">☀️ 明亮</button>\n  </div>\n  <div class="header-divider">`;

function processFile(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');

  // 检查是否已有按钮
  if (html.includes('id="themeToggle"')) {
    console.log(`  [skip] ${path.basename(filePath)} — 按钮已存在`);
    return;
  }

  if (!html.includes(ANCHOR)) {
    console.log(`  [warn] ${path.basename(filePath)} — 未找到锚点`);
    return;
  }

  html = html.replace(ANCHOR, WITH_BTN);
  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`  [done] ${path.basename(filePath)}`);
}

const files = fs.readdirSync(dir)
  .filter(f => /^daily-\d{4}-\d{2}-\d{2}\.html$/.test(f))
  .sort();

console.log(`\n修复 ${files.length} 个日报文件...\n`);
files.forEach(f => processFile(path.join(dir, f)));
console.log('\n完成。');
