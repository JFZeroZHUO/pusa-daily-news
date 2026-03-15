const fs = require('fs');

const sectionsPath = 'C:/Users/92860/Desktop/AI编程项目-个人合集/测试ClaudeCode/DailyNews/sections-2026-03-13.json';
const outputPath = 'C:/Users/92860/Desktop/AI编程项目-个人合集/测试ClaudeCode/DailyNews/daily-2026-03-13.html';

const sections = JSON.parse(fs.readFileSync(sectionsPath, 'utf-8'));

const html = `<!DOCTYPE html>
<html lang="zh-CN" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>风变野菩萨AI视频社团A班 · 日报 2026-03-13</title>
  <style>
    :root {
      --bg-primary: #1a1011;
      --bg-card: #251618;
      --bg-card-hover: #301c1f;
      --border: #5c3a3e;
      --text-primary: #fef2f2;
      --text-secondary: #c9a0a5;
      --accent-primary: #f56565;
      --accent-red: #fc8181;
      --accent-green: #68d391;
      --accent-purple: #d6bcfa;
      --accent-orange: #fbd38d;
      --accent-yellow: #f6e05e;
      --gradient-title: linear-gradient(90deg, #f56565, #e53e3e);
      --font-base: 16px;
      --font-xs: 14px;
      --font-sm: 15px;
      --font-md: 16px;
      --font-lg: 18px;
      --font-xl: 21px;
      --font-2xl: 27px;
      --font-3xl: 31px;
      --font-data: 23px;
    }
    [data-theme="light"] {
      --bg-primary: #f5f3ee;
      --bg-card: #ffffff;
      --bg-card-hover: #faf8f3;
      --border: #d4cfc4;
      --text-primary: #2c2416;
      --text-secondary: #6b6456;
      --accent-primary: #d84545;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif; font-size: var(--font-base); background: var(--bg-primary); color: var(--text-primary); line-height: 1.7; padding: 20px; }
    .newspaper-header { max-width: 1600px; margin: 0 auto 30px; padding: 20px 0; border-bottom: 3px solid var(--accent-primary); }
    .header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .newspaper-title { font-size: var(--font-3xl); font-weight: 900; background: var(--gradient-title); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; text-align: center; letter-spacing: 2px; }
    .issue-info, .stats-badge { font-size: var(--font-xs); color: var(--text-secondary); padding: 4px 12px; background: var(--bg-card); border-radius: 12px; border: 1px solid var(--border); }
    .header-divider { height: 2px; background: var(--gradient-title); margin-top: 15px; opacity: 0.6; }
    .newspaper-grid { max-width: 1600px; margin: 0 auto; display: grid; grid-template-columns: 25% 45% 28%; gap: 2%; }
    .block-title { font-size: var(--font-lg); font-weight: 700; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid var(--border); display: flex; align-items: center; gap: 8px; }
    .block-title .icon { font-size: var(--font-xl); }
    section { background: var(--bg-card); padding: 20px; border-radius: 8px; border: 1px solid var(--border); margin-bottom: 20px; transition: background 0.2s; }
    section:hover { background: var(--bg-card-hover); }
    blockquote { border-left: 4px solid var(--accent-purple); padding: 12px 16px; margin: 15px 0; background: rgba(210, 168, 255, 0.08); color: var(--text-primary); font-size: var(--font-sm); font-style: italic; border-radius: 4px; }
    footer { max-width: 1600px; margin: 30px auto 0; padding: 20px 0; text-align: center; font-size: var(--font-xs); color: var(--text-secondary); border-top: 1px solid var(--border); }
    .theme-toggle { position: fixed; bottom: 20px; right: 20px; width: 44px; height: 44px; border-radius: 50%; background: var(--bg-card); border: 2px solid var(--border); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 20px; transition: all 0.3s; z-index: 1000; }
    .theme-toggle:hover { background: var(--bg-card-hover); transform: scale(1.1); }
    @media (max-width: 1200px) { .newspaper-grid { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <header class="newspaper-header">
    <div class="header-top">
      <span class="issue-info">2026年03月13日 星期五</span>
      <h1 class="newspaper-title">野菩萨AI社团 · 每日资讯</h1>
      <span class="stats-badge">今日 112 条消息 · 77 人发言</span>
    </div>
    <div class="header-divider"></div>
  </header>
  <main class="newspaper-grid">
    <aside class="col-left">
      <section class="block-announcement">
        <h2 class="block-title"><span class="icon">📢</span>重要公告</h2>
        ${sections.announcement.replace(/\n/g, '<br>')}
      </section>
      <section class="block-honor">
        <h2 class="block-title"><span class="icon">🏆</span>荣誉时刻</h2>
        ${sections.honor.replace(/\n/g, '<br>')}
      </section>
    </aside>
    <article class="col-center">
      <section class="block-teacher">
        <h2 class="block-title"><span class="icon">👨‍🏫</span>师说</h2>
        ${sections.teacher.replace(/\n/g, '<br>')}
      </section>
      <section class="block-hot">
        <h2 class="block-title"><span class="icon">🔥</span>热议话题</h2>
        ${sections.hotTopic.replace(/\n/g, '<br>')}
      </section>
    </article>
    <aside class="col-right">
      <section class="block-ai">
        <h2 class="block-title"><span class="icon">🤖</span>AI资讯</h2>
        ${sections.aiNews.replace(/\n/g, '<br>')}
      </section>
      <section class="block-community">
        <h2 class="block-title"><span class="icon">💬</span>社群动态</h2>
        ${sections.community.replace(/\n/g, '<br>')}
      </section>
    </aside>
  </main>
  <footer>
    <p>风变野菩萨AI视频社团A班 · 每日资讯 · 生成时间：2026-03-15 00:00:00</p>
  </footer>
  <button class="theme-toggle" onclick="toggleTheme()" aria-label="切换主题">
    <span id="theme-icon">☀️</span>
  </button>
  <script>
    function toggleTheme() {
      const html = document.documentElement;
      const currentTheme = html.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', newTheme);
      document.getElementById('theme-icon').textContent = newTheme === 'dark' ? '☀️' : '🌙';
      localStorage.setItem('pusa-theme', newTheme);
    }
    const savedTheme = localStorage.getItem('pusa-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.getElementById('theme-icon').textContent = savedTheme === 'dark' ? '☀️' : '🌙';
  </script>
</body>
</html>`;

fs.writeFileSync(outputPath, html, 'utf-8');
console.log('HTML generated successfully');
