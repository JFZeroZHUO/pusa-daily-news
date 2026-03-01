/**
 * patch-postmessage.js
 * 为 12 个日报 HTML 文件：
 *  1. 在 <head> 注入 FOUC 防闪烁脚本
 *  2. 在 <body> 底部的主题JS里追加 postMessage 监听（接收父页面同步）
 *  3. 移除底部 IIFE 里重复设置 data-theme 的行（已在 head 做）
 */
const fs = require('fs');
const path = require('path');

const dir = __dirname;

// 注入到 <title>...</title> 后面（head 内）
const HEAD_SCRIPT = `
  <script>
    /* 防闪烁：阻塞执行，在样式渲染前设定主题 */
    (function () {
      const t = localStorage.getItem('pusa-theme') || 'dark';
      document.documentElement.setAttribute('data-theme', t);
    })();
  </script>`;

// 替换旧的 body IIFE（去掉重复设 data-theme）+ 追加 postMessage 监听
const OLD_BODY_JS = `  <script>
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

const NEW_BODY_JS = `  <script>
    /* ── 主题切换 ── */
    (function () {
      /* data-theme 已在 <head> 设置，这里只更新按钮图标 */
      const saved = localStorage.getItem('pusa-theme') || 'dark';
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
    /* 接收父页面（index.html）的主题同步消息 */
    window.addEventListener('message', function (e) {
      if (e.data && e.data.type === 'pusa-theme') {
        const theme = e.data.theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('pusa-theme', theme);
        const btn = document.getElementById('themeToggle');
        if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
      }
    });
  <\/script>`;

function processFile(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');

  if (html.includes('pusa-theme-patched-v2')) {
    console.log(`  [skip] ${path.basename(filePath)}`);
    return;
  }

  // 1. 在 </title> 后注入 head script
  if (!html.includes('防闪烁')) {
    html = html.replace('</title>', '</title>' + HEAD_SCRIPT);
  }

  // 2. 替换 body IIFE + 追加 postMessage listener
  if (html.includes('document.documentElement.setAttribute(\'data-theme\', saved)')) {
    html = html.replace(OLD_BODY_JS, NEW_BODY_JS);
  }

  // 标记已处理
  html = html.replace('<html ', '<html data-patched="v2" ');

  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`  [done] ${path.basename(filePath)}`);
}

const files = fs.readdirSync(dir)
  .filter(f => /^daily-\d{4}-\d{2}-\d{2}\.html$/.test(f))
  .sort();

console.log(`\n修补 ${files.length} 个日报文件...\n`);
files.forEach(f => processFile(path.join(dir, f)));
console.log('\n完成。');
