/**
 * fix-fonts.js v2
 * 统一所有日报字体大小，符合 skill.md 字体规范
 *
 * 规范对照表：
 *   28px  → 主标题
 *   15px  → 板块标题、hot-topic-title、teacher-avatar内字
 *   18px  → 板块标题icon
 *   24px  → 荣誉icon
 *   20px  → AI数字强调
 *   13px  → 正文、气泡内容
 *   12px  → blockquote、analysis-box、ai-item
 *   11px  → 所有辅助信息（xs层）: badge、sender、tagline、footer、热度等
 *           含 10px / 10.5px / 11px / 11.5px 均归并到 11px 或 12px
 */

const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const files = fs.readdirSync(DIR).filter(f => /^daily-\d{4}-\d{2}-\d{2}\.html$/.test(f));

// 每条规则：[正则, 替换函数 or 替换字符串]
// 规则作用于整个 HTML 文本（含 style 块和 inline style）
const rules = [
  // ① 主标题 -> 28px  (防止 32/36px 残留)
  [/\.newspaper-title(\s*\{[^}]*)font-size:\s*[\d.]+px/g,
   (_, ctx) => `.newspaper-title${ctx}font-size: 28px`],

  // ② 板块标题 (.block-title / .section-title) -> 15px
  [/(\.block-title|\.section-title)(\s*\{[^}]*)font-size:\s*[\d.]+px/g,
   (_, cls, ctx) => `${cls}${ctx}font-size: 15px`],

  // ③ 板块标题 icon / emoji -> 18px
  [/(\.block-title\s+\.icon|\.section-title\s+\.emoji)(\s*\{[^}]*)font-size:\s*[\d.]+px/g,
   (_, cls, ctx) => `${cls}${ctx}font-size: 18px`],
  // 单行写法：.block-title .icon { font-size: Xpx; }
  [/(\.block-title\s+\.icon\s*\{[^}]*)font-size:\s*[\d.]+px/g,
   (_, ctx) => `${ctx}font-size: 18px`],

  // ④ 气泡内容 -> 13px
  [/(\.chat-bubble\s*\{[^}]*)font-size:\s*[\d.]+px/g,
   (_, ctx) => `${ctx}font-size: 13px`],

  // ⑤ hot-topic-title -> 15px
  [/(\.hot-topic-title\s*\{[^}]*)font-size:\s*[\d.]+px/g,
   (_, ctx) => `${ctx}font-size: 15px`],

  // ⑥ 荣誉icon/medal -> 24px
  [/(\.honor-icon|\.honor-medal)(\s*\{[^}]*)font-size:\s*[\d.]+px/g,
   (_, cls, ctx) => `${cls}${ctx}font-size: 24px`],

  // ⑦ teacher-avatar（圆形头像内字）-> 15px  （原 16px）
  [/(\.teacher-avatar\s*\{[^}]*)font-size:\s*[\d.]+px/g,
   (_, ctx) => `${ctx}font-size: 15px`],

  // ⑧ ai-item -> 12px  (含 11.5px)
  [/(\.ai-item\s*\{[^}]*)font-size:\s*[\d.]+px/g,
   (_, ctx) => `${ctx}font-size: 12px`],

  // ⑨ xs 层（badge / sender / tagline / heat / timeline-time / element-item / link-pill / community-speaker / footer）
  //    10px / 10.5px / 11px → 11px
  [/(\.heat-badge|\.bubble-sender|\.chat-sender|\.timeline-time|\.element-item|\.link-pill|\.badge|\.community-speaker|\.ai-tool-tag|\.ai-tool-badge|\.issue-info|\.stats-badge|\.header-tagline|\.heat-stats)(\s*\{[^}]*)font-size:\s*[\d.]+px/g,
   (_, cls, ctx) => `${cls}${ctx}font-size: 11px`],
  // footer（顶级选择器）-> 11px
  [/^(footer\s*\{[^}]*)font-size:\s*[\d.]+px/gm,
   (_, ctx) => `${ctx}font-size: 11px`],

  // ⑩ inline style 中的 h4/sub-heading 14px/16px -> 13px
  [/(<h[1-6][^>]*style="[^"]*font-size:\s*)(?:14|16)px/g,
   (_, prefix) => `${prefix}13px`],
];

let totalChanged = 0;

for (const file of files) {
  const fullPath = path.join(DIR, file);
  let html = fs.readFileSync(fullPath, 'utf8');
  const original = html;

  for (const [pattern, replacer] of rules) {
    html = html.replace(pattern, replacer);
  }

  if (html !== original) {
    fs.writeFileSync(fullPath, html, 'utf8');
    console.log(`✅ 已修复: ${file}`);
    totalChanged++;
  } else {
    console.log(`⏭  无需修改: ${file}`);
  }
}

console.log(`\n共修复 ${totalChanged} 个文件。`);
