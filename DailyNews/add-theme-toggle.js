/**
 * add-theme-toggle.js
 * 批量为日报 HTML 文件注入亮色/暗色主题切换功能
 * 运行: node add-theme-toggle.js
 */
const fs = require('fs');
const path = require('path');

const dir = __dirname;

// ── 注入到 </style> 前的 CSS ──────────────────────────────────────────────
const LIGHT_THEME_CSS = `
    /* ── 主题切换按钮 ── */
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
    }
    /* ── 亮色主题变量覆盖 ── */
    [data-theme="light"] {
      --bg-primary:    #f5f3ee;
      --bg-card:       #ffffff;
      --bg-card-hover: #edeae0;
      --border:        #d4cfc0;
      --text-primary:  #1e1b14;
      --text-secondary:#6b6555;
    }
    [data-theme="light"] blockquote {
      background: rgba(0,0,0,0.04);
      color: #3a3525;
    }
    [data-theme="light"] .analysis-box {
      background: rgba(0,0,0,0.04);
      color: #3a3525;
    }
    [data-theme="light"] .newspaper-header {
      background: linear-gradient(135deg, #f0ede2, #f7f5ee);
    }
    [data-theme="light"] .block-teacher {
      background: linear-gradient(135deg, #f0ede2, #edeae0);
    }`;

// ── 注入到 </header> 前的按钮 HTML ────────────────────────────────────────
const THEME_BUTTON_HTML = `
  <button class="theme-toggle" id="themeToggle" onclick="toggleTheme()" title="切换亮色/暗色主题">☀️</button>`;

// ── 注入到 </body> 前的 JS（日报页面用）───────────────────────────────────
const THEME_JS_DAILY = `
  <script>
    /* ── 主题切换 ── */
    (function () {
      const saved = localStorage.getItem('pusa-theme') || 'dark';
      document.documentElement.setAttribute('data-theme', saved);
      document.addEventListener('DOMContentLoaded', function () {
        const btn = document.getElementById('themeToggle');
        if (btn) btn.textContent = saved === 'dark' ? '☀️' : '🌙';
      });
    })();
    function toggleTheme() {
      const html = document.documentElement;
      const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      localStorage.setItem('pusa-theme', next);
      const btn = document.getElementById('themeToggle');
      if (btn) btn.textContent = next === 'dark' ? '☀️' : '🌙';
    }
  <\/script>`;

// ── 处理日报文件 ─────────────────────────────────────────────────────────
function processDaily(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');

  // 跳过已处理的文件
  if (html.includes('pusa-theme')) {
    console.log(`  [skip] ${path.basename(filePath)} — 已包含主题切换`);
    return;
  }

  // 1. 给 <html> 添加 data-theme="dark"
  html = html.replace(/(<html\b[^>]*?)>/, '$1 data-theme="dark">');

  // 2. 在 </style> 前注入 CSS
  html = html.replace('</style>', LIGHT_THEME_CSS + '\n  </style>');

  // 3. 在 </header> 前注入按钮（第一个匹配）
  html = html.replace('</header>', THEME_BUTTON_HTML + '\n  </header>');

  // 4. 在 </body> 前注入 JS
  html = html.replace('</body>', THEME_JS_DAILY + '\n</body>');

  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`  [done] ${path.basename(filePath)}`);
}

// ── 执行 ─────────────────────────────────────────────────────────────────
const files = fs.readdirSync(dir)
  .filter(f => /^daily-\d{4}-\d{2}-\d{2}\.html$/.test(f))
  .sort();

console.log(`\n找到 ${files.length} 个日报文件，开始处理...\n`);
files.forEach(f => processDaily(path.join(dir, f)));
console.log('\n日报文件处理完毕。');
