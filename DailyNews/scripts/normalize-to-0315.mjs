import fs from 'node:fs';
import path from 'node:path';

const SECTION_ORDER = {
  left: ['重要公告', '荣誉时刻'],
  center: ['师说', '热议话题'],
  right: ['AI资讯', '社群动态'],
};

const ICONS = {
  '重要公告': '📢',
  '荣誉时刻': '🏆',
  '师说': '👨‍🏫',
  '热议话题': '🔥',
  'AI资讯': '🤖',
  '社群动态': '💬',
};

function usage() {
  console.log('Usage: node DailyNews/scripts/normalize-to-0315.mjs <source.html> <output.html> [template.html]');
}

const [, , sourceArg, outputArg, templateArg] = process.argv;
if (!sourceArg || !outputArg) {
  usage();
  process.exit(1);
}

const cwd = process.cwd();
const sourcePath = path.resolve(cwd, sourceArg);
const outputPath = path.resolve(cwd, outputArg);
const templatePath = path.resolve(cwd, templateArg || 'DailyNews/daily-2026-03-15.html');

const source = fs.readFileSync(sourcePath, 'utf8');
const template = fs.readFileSync(templatePath, 'utf8');

function one(re, text, fallback = '') {
  const match = String(text || '').match(re);
  return match ? match[1].trim() : fallback;
}

function stripTags(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function extractBalancedBlocks(html, tag, className) {
  const safeClass = className ? className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';
  const classPart = className
    ? `[^>]*class="(?:${safeClass}(?=\\s|")[^"]*|[^"]*\\s${safeClass}(?=\\s|")[^"]*)"[^>]*`
    : '[^>]*';
  const openRe = new RegExp(`<${tag}\\b${classPart}>`, 'gi');
  const blocks = [];
  let match;
  while ((match = openRe.exec(html))) {
    let cursor = openRe.lastIndex;
    let depth = 1;
    const openTagRe = new RegExp(`<${tag}\\b`, 'gi');
    const closeTag = `</${tag}>`;
    while (depth > 0 && cursor < html.length) {
      openTagRe.lastIndex = cursor;
      const nextOpen = openTagRe.exec(html);
      const nextClose = html.indexOf(closeTag, cursor);
      if (nextClose < 0) break;
      if (nextOpen && nextOpen.index < nextClose) {
        depth += 1;
        cursor = nextOpen.index + nextOpen[0].length;
      } else {
        depth -= 1;
        cursor = nextClose + closeTag.length;
      }
    }
    blocks.push(html.slice(match.index, cursor));
    openRe.lastIndex = cursor;
  }
  return blocks;
}

function removeOuterElement(html, tag = 'div') {
  return String(html || '')
    .replace(new RegExp(`^\\s*<${tag}\\b[^>]*>`, 'i'), '')
    .replace(new RegExp(`</${tag}>\\s*$`, 'i'), '')
    .trim();
}

function extractSections(html) {
  return extractBalancedBlocks(html, 'section').map((sectionHtml) => {
    const titleHtml = one(/<div class="block-title">([\s\S]*?)<\/div>/i, sectionHtml);
    const titleText = stripTags(titleHtml);
    const canonical = Object.keys(ICONS).find((name) => titleText.includes(name)) || titleText;
    return { canonical, titleText, html: sectionHtml };
  });
}

function sourceSectionMap(html) {
  const map = new Map();
  for (const section of extractSections(html)) {
    map.set(section.canonical, section);
  }
  return map;
}

function replaceClass(html, from, to) {
  return String(html || '').replace(new RegExp(`\\b${from}\\b`, 'g'), to);
}

function removeBlockTitle(sectionHtml) {
  return String(sectionHtml || '').replace(/^\s*<section\b[^>]*>\s*<div class="block-title">[\s\S]*?<\/div>/i, '').replace(/<\/section>\s*$/i, '').trim();
}

function titleBlock(name, sourceTitleText = '') {
  const badgeMatch = sourceTitleText
    .replace(/[📢🏆👨‍🏫🔥🤖💬]/gu, '')
    .replace(name, '')
    .trim();
  const badge = badgeMatch ? `\n          <span class="badge">${escapeHtml(badgeMatch)}</span>` : '';
  return `        <div class="block-title">
          <span class="icon">${ICONS[name] || ''}</span>
          <span>${name}</span>${badge}
        </div>`;
}

function sectionWrap(name, body, sourceTitleText = '', extraClass = '') {
  return `      <section class="block-section${extraClass}">
${titleBlock(name, sourceTitleText)}

${body}
      </section>`;
}

function normalizeLinks(html) {
  return String(html || '').replace(/\sclass="link-pill"/g, '');
}

function normalizeAnnouncement(section) {
  const body = removeBlockTitle(section.html);
  const banner = one(/<div class="announcement-banner">([\s\S]*?)<\/div>/i, body);
  const items = extractBalancedBlocks(body, 'div', 'announcement-item').map((item, index) => {
    const time = stripTags(one(/<div class="announcement-time">([\s\S]*?)<\/div>/i, item)) || String(index + 1);
    const contentBlock = extractBalancedBlocks(item, 'div', 'announcement-content')[0] || '';
    let content = removeOuterElement(contentBlock);
    const strongTitle = stripTags(one(/<strong>([\s\S]*?)<\/strong>/i, content));
    if (strongTitle) {
      content = content.replace(/^\s*<strong>[\s\S]*?<\/strong>\s*<br\s*\/?>?/i, '').trim();
    }
    const linkBlock = extractBalancedBlocks(content, 'div', 'announcement-links')[0] || '';
    const bodyContent = linkBlock ? content.replace(linkBlock, '').trim() : content;
    const title = strongTitle ? `${time}：${strongTitle}` : time;
    return `          <div class="announcement-item">
            <div class="announcement-time">${index + 1}</div>
            <div class="announcement-title">${escapeHtml(title)}</div>
            <div class="announcement-content">
              ${bodyContent ? `<blockquote>${normalizeLinks(bodyContent)}</blockquote>` : ''}
              ${linkBlock ? normalizeLinks(linkBlock) : ''}
            </div>
          </div>`;
  });

  const looseAnnouncement = body.match(/<div style="margin-top: 16px; padding-top: 12px; border-top: 1px dashed var\(--border\);">([\s\S]*?)<\/div>\s*<div class="ai-insight"/i);
  if (looseAnnouncement) {
    const loose = looseAnnouncement[1];
    const title = stripTags(one(/<div class="announcement-time">([\s\S]*?)<\/div>/i, loose));
    const contentBlock = extractBalancedBlocks(loose, 'div', 'announcement-content')[0] || '';
    const content = removeOuterElement(contentBlock);
    items.push(`          <div class="announcement-item">
            <div class="announcement-time">${items.length + 1}</div>
            <div class="announcement-title">${escapeHtml(title)}</div>
            <div class="announcement-content">
              <blockquote>${normalizeLinks(content)}</blockquote>
            </div>
          </div>`);
  }

  const insight = one(/<div class="ai-insight"[^>]*>([\s\S]*?)<\/div>/i, body);
  const insightBox = insight
    ? `\n\n        <div class="analysis-box" style="margin-top: 16px;">${insight}</div>`
    : '';

  const alert = banner ? `        <div class="alert-bar">${banner}</div>\n\n` : '';
  return sectionWrap(
    '重要公告',
    `${alert}        <div class="announcement-timeline">
${items.join('\n\n')}
        </div>${insightBox}`,
    section.titleText,
  );
}

function normalizeHonor(section) {
  const body = removeBlockTitle(section.html);
  const honorItem = extractBalancedBlocks(body, 'div', 'honor-item')[0];
  if (!honorItem) return sectionWrap('荣誉时刻', body, section.titleText);

  const medal = one(/<div class="honor-icon">([\s\S]*?)<\/div>/i, honorItem, ICONS['荣誉时刻']);
  const name = one(/<div class="honor-name">([\s\S]*?)<\/div>/i, honorItem);
  const prize = one(/<div class="honor-prize">([\s\S]*?)<\/div>/i, honorItem);
  const quote = one(/<blockquote class="honor-quote">([\s\S]*?)<\/blockquote>/i, honorItem);
  const comment = one(/<div class="ai-comment">([\s\S]*?)<\/div>/i, honorItem);
  return sectionWrap(
    '荣誉时刻',
    `        <div class="honor-card">
          <div class="honor-header">
            <span class="honor-medal">${medal}</span>
            <span class="honor-name">${name}</span>
            <span class="honor-prize">${prize}</span>
          </div>
          <div class="honor-content">
            ${quote ? `<div class="honor-quote"><blockquote>${quote}</blockquote></div>` : ''}
            ${comment ? `<div class="analysis-box" style="margin-top: 12px;">${comment}</div>` : ''}
          </div>
        </div>`,
    section.titleText,
  );
}

function normalizeTeacher(section) {
  const body = removeBlockTitle(section.html);
  const teacherBlocks = extractBalancedBlocks(body, 'div', 'teacher-block');
  if (teacherBlocks.length) {
    return sectionWrap('师说', body, section.titleText, ' teacher-section');
  }

  const text = stripTags(body);
  return sectionWrap(
    '师说',
    `        <div class="teacher-block">
          <div class="teacher-name">
            <div class="teacher-avatar">—</div>
            <span>${escapeHtml(section.titleText.replace('👨‍🏫', '').replace('师说', '').trim() || '今日暂无')}</span>
          </div>
          <div class="teacher-quote">
            <blockquote>${escapeHtml(text)}</blockquote>
          </div>
        </div>`,
    section.titleText,
    ' teacher-section',
  );
}

function normalizeHot(section) {
  let body = removeBlockTitle(section.html);
  body = replaceClass(body, 'topic-analysis', 'ai-summary');
  body = body.replace(/<span class="heat-stats">([\s\S]*?)<\/span>/g, '<div class="heat-stats"><span class="heat-badge">$1</span></div>');
  return sectionWrap('热议话题', body, section.titleText);
}

function normalizeAi(section) {
  const body = removeBlockTitle(section.html);
  const items = extractBalancedBlocks(body, 'div', 'ai-item');
  if (!items.length) return sectionWrap('AI资讯', body, section.titleText);

  const normalized = items.map((item) => {
    const tag = one(/<span class="ai-tool-badge">([\s\S]*?)<\/span>/i, item);
    const quote = one(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/i, item);
    const dataNumber = one(/<div class="ai-data-number">([\s\S]*?)<\/div>/i, item);
    const plainMeta = one(/<div style="color: var\(--text-secondary\); font-size: var\(--font-xs\); margin-bottom: 8px;">([\s\S]*?)<\/div>/i, item);
    const trend = one(/<div class="ai-trend">([\s\S]*?)<\/div>/i, item);
    const titleTail = stripTags(dataNumber || plainMeta || one(/<strong>([\s\S]*?)<\/strong>/i, trend));
    return `        <div class="ai-item">
          <div class="ai-item-title">
            <span class="ai-tool-tag">${tag}</span>${titleTail ? `\n            ${escapeHtml(titleTail)}` : ''}
          </div>
          ${quote ? `<blockquote style="font-size: var(--font-xs); padding: 8px 12px;">${quote}</blockquote>` : ''}
          ${plainMeta && !dataNumber ? `<p style="color: var(--text-secondary); font-size: var(--font-xs); margin-bottom: 8px;">${plainMeta}</p>` : ''}
          ${trend ? `<div class="ai-summary" style="margin-top: 10px;">${trend}</div>` : ''}
        </div>`;
  });
  return sectionWrap('AI资讯', normalized.join('\n\n'), section.titleText);
}

function normalizeCommunity(section) {
  let body = removeBlockTitle(section.html);
  body = replaceClass(body, 'community-summary', 'vibe-summary');
  return sectionWrap('社群动态', body, section.titleText);
}

function normalizeSection(name, section) {
  if (!section) return '';
  if (name === '重要公告') return normalizeAnnouncement(section);
  if (name === '荣誉时刻') return normalizeHonor(section);
  if (name === '师说') return normalizeTeacher(section);
  if (name === '热议话题') return normalizeHot(section);
  if (name === 'AI资讯') return normalizeAi(section);
  if (name === '社群动态') return normalizeCommunity(section);
  return section.html;
}

function getTemplateCss() {
  return one(/<style>([\s\S]*?)<\/style>/i, template);
}

function getFoucScript() {
  const script = one(/<script>\s*\(function\(\) \{([\s\S]*?)\}\)\(\);\s*<\/script>/i, template);
  return script
    ? `<script>
    (function() {${script}
    })();
  </script>`
    : `<script>
    (function () {
      const t = localStorage.getItem('pusa-theme') || 'dark';
      document.documentElement.setAttribute('data-theme', t);
    })();
  </script>`;
}

function getHeader() {
  return one(/<header class="newspaper-header">([\s\S]*?)<\/header>/i, source);
}

function getFooter() {
  return source.match(/<footer>[\s\S]*?<\/footer>/i)?.[0] || '';
}

function themeScript() {
  return `<button class="theme-toggle" id="themeToggle" title="切换主题">☀️</button>

  <script>
    const themeToggle = document.getElementById('themeToggle');
    const html = document.documentElement;
    const savedTheme = localStorage.getItem('pusa-theme') || 'dark';
    html.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
    themeToggle.addEventListener('click', () => {
      const currentTheme = html.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', newTheme);
      localStorage.setItem('pusa-theme', newTheme);
      updateThemeIcon(newTheme);
    });
    function updateThemeIcon(theme) {
      themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  </script>`;
}

const sections = sourceSectionMap(source);
const header = getHeader();
const title = one(/<title>([\s\S]*?)<\/title>/i, source, 'AI Daily News');
const main = `  <main class="newspaper-grid">
    <aside class="col-left">
${SECTION_ORDER.left.map((name) => normalizeSection(name, sections.get(name))).filter(Boolean).join('\n\n')}
    </aside>

    <article class="col-center">
${SECTION_ORDER.center.map((name) => normalizeSection(name, sections.get(name))).filter(Boolean).join('\n\n')}
    </article>

    <aside class="col-right">
${SECTION_ORDER.right.map((name) => normalizeSection(name, sections.get(name))).filter(Boolean).join('\n\n')}
    </aside>
  </main>`;

const output = `<!DOCTYPE html>
<html lang="zh-CN" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  ${getFoucScript()}
  <style>${getTemplateCss()}</style>
</head>
<body>
  <header class="newspaper-header">${header}</header>

${main}

  ${getFooter()}

  ${themeScript()}
</body>
</html>`;

fs.writeFileSync(outputPath, output, 'utf8');

const outputText = stripTags(output);
const sourceText = stripTags(source);
const generatedMarkers = [
  '固定三栏结构',
  '统一格式',
  '此页为',
  '测试版',
  '重新整理',
  '格式测试',
];

console.log(JSON.stringify({
  source: path.relative(cwd, sourcePath),
  output: path.relative(cwd, outputPath),
  sections: [...sections.keys()],
  sourceTextLength: sourceText.length,
  outputTextLength: outputText.length,
  generatedMarkerHits: generatedMarkers.filter((marker) => outputText.includes(marker)),
}, null, 2));
