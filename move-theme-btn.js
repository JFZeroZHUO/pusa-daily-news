/**
 * move-theme-btn.js
 * 将主题切换按钮从右下角固定定位移入报头顶部，并改为文字标注
 */
const fs = require('fs');
const path = require('path');
const dir = __dirname;

// 旧 CSS → 新 CSS（去掉 fixed，改为 inline pill 样式）
const OLD_CSS = `    /* ── 主题切换按钮 ── */
    .theme-toggle {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: 2px solid var(--border);
      background: var(--bg-card);
      color: var(--text-primary);
      font-size: 20px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      transition: all 0.2s ease;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      padding: 0;
      line-height: 1;
    }
    .theme-toggle:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    }`;

const NEW_CSS = `    /* ── 主题切换按钮 ── */
    .theme-btn {
      padding: 5px 14px;
      border-radius: 20px;
      border: 1px solid var(--border);
      background: var(--bg-card);
      color: var(--text-secondary);
      font-size: 11px;
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;
    }
    .theme-btn:hover {
      color: var(--text-primary);
      background: var(--bg-card-hover);
    }`;

// 旧按钮 HTML（固定在 </header> 前）→ 新按钮嵌入 header-top
const OLD_BTN = `  <button class="theme-toggle" id="themeToggle" onclick="toggleTheme()" title="切换亮色/暗色主题">☀️</button>
  </header>`;

const NEW_BTN = `    <button class="theme-btn" id="themeToggle" onclick="toggleTheme()">☀️ 明亮</button>
      </div>
    </header>`;

// 对应的：旧 header-top 末尾
const OLD_HDR_END = `      </div>
    </header>`;

// 更新 JS 按钮文字
function fixJsText(html) {
  // IIFE 里的初始图标
  html = html.replace(
    /btn\.textContent = saved === 'dark' \? '☀️' : '🌙';/g,
    `btn.textContent = saved === 'dark' ? '☀️ 明亮' : '🌙 暗黑';`
  );
  // toggleTheme 里
  html = html.replace(
    /btn\.textContent = next === 'dark' \? '☀️' : '🌙';/g,
    `btn.textContent = next === 'dark' ? '☀️ 明亮' : '🌙 暗黑';`
  );
  // postMessage 监听器里
  html = html.replace(
    /btn\.textContent = theme === 'dark' \? '☀️' : '🌙';/g,
    `btn.textContent = theme === 'dark' ? '☀️ 明亮' : '🌙 暗黑';`
  );
  return html;
}

function processFile(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');

  if (!html.includes('.theme-toggle')) {
    console.log(`  [skip] ${path.basename(filePath)} — 无旧样式`);
    return;
  }

  // 1. 替换 CSS
  html = html.replace(OLD_CSS, NEW_CSS);

  // 2. 把固定按钮从 </header> 前移除，嵌入 header-top 末尾
  //    先移除旧按钮（它在 </header> 前面，和 </div>\n    </header> 之间）
  html = html.replace(OLD_BTN, `  </header>`);
  //    再在 </div>\n    </header>（header-top 闭合处）插入新按钮
  html = html.replace(OLD_HDR_END, NEW_BTN);

  // 3. 更新 JS 文字
  html = fixJsText(html);

  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`  [done] ${path.basename(filePath)}`);
}

const files = fs.readdirSync(dir)
  .filter(f => /^daily-\d{4}-\d{2}-\d{2}\.html$/.test(f))
  .sort();

console.log(`\n处理 ${files.length} 个日报文件...\n`);
files.forEach(f => processFile(path.join(dir, f)));
console.log('\n完成。');
