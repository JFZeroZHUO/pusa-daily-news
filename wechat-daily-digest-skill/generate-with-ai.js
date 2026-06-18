#!/usr/bin/env node
/**
 * 使用 HTTP API + AI 分析生成完整日报
 * 这个脚本会：
 * 1. 通过 HTTP API 获取聊天记录
 * 2. 调用 Claude API 分析内容并生成各板块
 * 3. 生成完整的 HTML 日报
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// ============ 配置 ============
const CONFIG = {
  chatlogUrl: 'http://127.0.0.1:5030',
  groupId: '43988234971@chatroom',
  outputDir: 'C:/Users/92860/Desktop/AI编程项目-个人合集/测试ClaudeCode/DailyNews',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN,
};

if (!CONFIG.anthropicApiKey) {
  console.error('❌ 错误: 未找到 ANTHROPIC_API_KEY 或 ANTHROPIC_AUTH_TOKEN 环境变量');
  console.error('请设置环境变量后重试');
  process.exit(1);
}

// ============ 工具函数 ============
function getYesterday() {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function formatDateTime(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
}

function getDayOfWeek(dateStr) {
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  const date = new Date(dateStr);
  return days[date.getDay()];
}

// ============ HTTP API 调用 ============
function queryChatLog(talker, time, limit = 1000) {
  return new Promise((resolve, reject) => {
    const queryParams = new URLSearchParams({ talker, time, limit });
    const url = `${CONFIG.chatlogUrl}/api/v1/chatlog?${queryParams.toString()}`;

    console.log(`📡 [进度] 步骤2/8: 正在获取群聊消息 (日期: ${time})...`);

    http.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          return;
        }

        try {
          const messages = parseChatlogText(data);
          console.log(`   获取到 ${messages.length} 条消息`);
          resolve(messages);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

function parseChatlogText(text) {
  const messages = [];
  const blocks = text.split('\n\n').filter(b => b.trim());

  for (const block of blocks) {
    const lines = block.split('\n');
    if (lines.length === 0) continue;

    const firstLine = lines[0];
    const match = firstLine.match(/^(.+?)\((.+?)\)\s+(\d{2}:\d{2}:\d{2})$/);

    if (!match) continue;

    const [, senderName, sender, time] = match;

    let content = '';
    let quotedMsg = null;
    let contentStartIndex = 1;

    if (lines[1] && lines[1].startsWith('>')) {
      const quoteLine = lines[1].substring(1).trim();
      const quoteMatch = quoteLine.match(/^(.+?)\s+(\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})$/);

      if (quoteMatch) {
        quotedMsg = {
          sender: quoteMatch[1],
          time: quoteMatch[2]
        };

        if (lines[2] && lines[2].startsWith('>')) {
          quotedMsg.content = lines[2].substring(1).trim();
          contentStartIndex = 3;
        } else {
          contentStartIndex = 2;
        }
      }
    }

    content = lines.slice(contentStartIndex).join('\n').trim();

    messages.push({
      sender,
      senderName,
      time,
      content,
      quotedMsg,
      type: 1
    });
  }

  return messages;
}

// ============ 生成 TXT ============
function generateTXT(messages, targetDate) {
  console.log(`📝 [进度] 步骤3/8: 正在写入原始TXT文件...`);

  const txtFile = path.join(CONFIG.outputDir, `raw-${targetDate}.txt`);

  const uniqueSenders = new Set(messages.map(m => m.senderName));

  let content = `===== 风变野菩萨AI视频社团A班 · ${targetDate.replace(/-/g, '年').replace(/年(\d+)$/, '年$1月').replace(/月(\d+)$/, '月$1日')} 聊天记录 =====\n`;
  content += `生成时间：${formatDateTime(new Date())}\n`;
  content += `消息总数：${messages.length} 条\n`;
  content += `发言人数：${uniqueSenders.size} 人\n`;
  content += `========================================\n\n`;

  for (const msg of messages) {
    if (msg.quotedMsg) {
      content += `[${msg.time}] ${msg.senderName}：「引用 ${msg.quotedMsg.sender}：${msg.quotedMsg.content}」→ ${msg.content}\n`;
    } else {
      content += `[${msg.time}] ${msg.senderName}：${msg.content}\n`;
    }
  }

  fs.writeFileSync(txtFile, content, 'utf8');
  console.log(`   TXT 文件已生成`);

  return { messageCount: messages.length, speakerCount: uniqueSenders.size };
}

// ============ 调用 Claude API 分析内容 ============
async function analyzeWithClaude(messages, targetDate) {
  console.log(`🤖 [进度] 步骤4/8: 正在分析6个板块内容...`);
  console.log(`   使用 Claude API 进行内容分析（这可能需要1-2分钟）...`);

  // 构建聊天记录文本
  let chatText = '';
  for (const msg of messages) {
    if (msg.quotedMsg) {
      chatText += `[${msg.time}] ${msg.senderName}：「引用 ${msg.quotedMsg.sender}：${msg.quotedMsg.content}」→ ${msg.content}\n`;
    } else {
      chatText += `[${msg.time}] ${msg.senderName}：${msg.content}\n`;
    }
  }

  const prompt = `你是一位专业的社群内容编辑，负责为"风变野菩萨AI视频社团A班"生成每日资讯日报。

以下是 ${targetDate} 的群聊记录（共 ${messages.length} 条消息）：

${chatText}

请根据以下规则分析并生成6个板块的内容：

**板块1：📢 重要公告**
- 识别：ANDY老师、团团老师的发言，或含"通知"、"公告"、"@所有人"的消息
- 输出：JSON格式 {"hasContent": true/false, "items": [...]}
- 如无内容：{"hasContent": false}

**板块2：👨‍🏫 师说**
- 识别：发言人为"菩萨"、"Aria清"、"野菩萨"、"unclered"
- 输出：提取所有发言，重点关注超过50字的内容
- 格式：{"hasContent": true/false, "quotes": ["发言1", "发言2"]}

**板块3：🔥 热议话题**
- 识别：回复数≥3的讨论串，且话题有学习/行业价值
- 输出：{"hasContent": true/false, "topics": [{"title": "话题标题", "messages": [...]}]}
- 最多2个话题

**板块4：🏆 荣誉时刻**
- 识别：含"恭喜"、"获奖"、"优秀"、"表扬"等关键词
- 输出：{"hasContent": true/false, "items": [...]}

**板块5：🤖 AI资讯**
- 识别：涉及AI工具名称（Seedance、可灵、即梦、Sora、Runway等）
- 输出：{"hasContent": true/false, "tools": [...], "discussions": [...]}

**板块6：💬 社群动态**
- 识别：不属于以上板块的有价值消息
- 输出：{"hasContent": true/false, "highlights": [...]}

请以JSON格式输出分析结果，格式如下：
\`\`\`json
{
  "announcement": {...},
  "teacher": {...},
  "hotTopics": {...},
  "honor": {...},
  "aiNews": {...},
  "community": {...}
}
\`\`\``;

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const options = {
      hostname: 'api.anthropic.com',
      port: 443,
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CONFIG.anthropicApiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`API Error ${res.statusCode}: ${data}`));
          return;
        }

        try {
          const response = JSON.parse(data);
          const content = response.content[0].text;

          // 提取JSON
          const jsonMatch = content.match(/```json\n([\s\S]+?)\n```/);
          if (jsonMatch) {
            const analysis = JSON.parse(jsonMatch[1]);
            console.log(`   AI 分析完成`);
            resolve(analysis);
          } else {
            reject(new Error('无法从AI响应中提取JSON'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// ============ 生成 HTML（简化版，使用AI分析结果） ============
function generateHTML(messages, targetDate, stats, analysis) {
  console.log(`🎨 [进度] 步骤5/8: 正在生成HTML日报...`);

  const htmlFile = path.join(CONFIG.outputDir, `daily-${targetDate}.html`);
  const dayOfWeek = getDayOfWeek(targetDate);

  // 主题配色（与之前相同）
  const themes = {
    '一': { name: '深空蓝', primary: '#0a0e14', card: '#11151c', cardHover: '#1a1f2a', border: '#2d3748', textPrimary: '#e2e8f0', textSecondary: '#718096', accentPrimary: '#63b3ed', accentRed: '#fc8181', accentGreen: '#68d391', accentPurple: '#b794f4', accentOrange: '#f6ad55', accentYellow: '#ecc94b', gradient: 'linear-gradient(90deg, #63b3ed, #4299e1)' },
    '二': { name: '森林绿', primary: '#0d1512', card: '#141f1a', cardHover: '#1a2922', border: '#2d4a3e', textPrimary: '#e6f4ea', textSecondary: '#81a894', accentPrimary: '#48bb78', accentRed: '#f687b3', accentGreen: '#9ae6b4', accentPurple: '#d6bcfa', accentOrange: '#fbd38d', accentYellow: '#f6e05e', gradient: 'linear-gradient(90deg, #48bb78, #38a169)' },
    '三': { name: '暖阳橙', primary: '#1a1410', card: '#231c16', cardHover: '#2d241c', border: '#4a3f35', textPrimary: '#faf5f0', textSecondary: '#a89888', accentPrimary: '#ed8936', accentRed: '#fc8181', accentGreen: '#68d391', accentPurple: '#d6bcfa', accentOrange: '#fbd38d', accentYellow: '#f6e05e', gradient: 'linear-gradient(90deg, #ed8936, #dd6b20)' },
    '四': { name: '星空紫', primary: '#13111a', card: '#1a1725', cardHover: '#231f30', border: '#3d3654', textPrimary: '#f0e6fa', textSecondary: '#9f8fbf', accentPrimary: '#9f7aea', accentRed: '#f687b3', accentGreen: '#68d391', accentPurple: '#d6bcfa', accentOrange: '#fbd38d', accentYellow: '#f6e05e', gradient: 'linear-gradient(90deg, #9f7aea, #805ad5)' },
    '五': { name: '珊瑚红', primary: '#1a1011', card: '#251618', cardHover: '#301c1f', border: '#5c3a3e', textPrimary: '#fef2f2', textSecondary: '#c9a0a5', accentPrimary: '#f56565', accentRed: '#fc8181', accentGreen: '#68d391', accentPurple: '#d6bcfa', accentOrange: '#fbd38d', accentYellow: '#f6e05e', gradient: 'linear-gradient(90deg, #f56565, #e53e3e)' },
    '六': { name: '金沙黄', primary: '#1a1810', card: '#252216', cardHover: '#302c1c', border: '#5c5435', textPrimary: '#fefcf2', textSecondary: '#c9c0a0', accentPrimary: '#ecc94b', accentRed: '#fc8181', accentGreen: '#68d391', accentPurple: '#d6bcfa', accentOrange: '#fbd38d', accentYellow: '#f6e05e', gradient: 'linear-gradient(90deg, #ecc94b, #d69e2e)' },
    '日': { name: '玫瑰粉', primary: '#1a1015', card: '#251620', cardHover: '#301c28', border: '#5c3a4a', textPrimary: '#fef2f6', textSecondary: '#c9a0b0', accentPrimary: '#ed64a6', accentRed: '#f687b3', accentGreen: '#68d391', accentPurple: '#d6bcfa', accentOrange: '#fbd38d', accentYellow: '#f6e05e', gradient: 'linear-gradient(90deg, #ed64a6, #d53f8c)' }
  };

  const theme = themes[dayOfWeek] || themes['一'];

  // 生成板块内容HTML
  const announcementHTML = analysis.announcement.hasContent
    ? `<p>检测到 ${analysis.announcement.items?.length || 0} 条公告</p>`
    : `<p style="color: var(--text-secondary); font-size: var(--font-sm);">今日群内暂无重要公告，社群运营平稳进行中。</p>`;

  const teacherHTML = analysis.teacher.hasContent
    ? `<p>老师今日发言 ${analysis.teacher.quotes?.length || 0} 条</p>`
    : `<p style="color: var(--text-secondary); font-size: var(--font-sm);">今日两位老师暂无重要发言，期待明日精彩内容。</p>`;

  const hotTopicsHTML = analysis.hotTopics.hasContent
    ? `<p>今日热议话题 ${analysis.hotTopics.topics?.length || 0} 个</p>`
    : `<p style="color: var(--text-secondary); font-size: var(--font-sm);">今日群内讨论较为平静，暂无高热度话题。</p>`;

  const honorHTML = analysis.honor.hasContent
    ? `<p>今日荣誉表彰 ${analysis.honor.items?.length || 0} 条</p>`
    : `<p style="color: var(--text-secondary); font-size: var(--font-sm);">今日暂无荣誉表彰，继续加油，期待下一位闪光时刻！</p>`;

  const aiNewsHTML = analysis.aiNews.hasContent
    ? `<p>今日AI工具讨论 ${analysis.aiNews.tools?.length || 0} 个</p>`
    : `<p style="color: var(--text-secondary); font-size: var(--font-sm);">今日暂无AI工具相关讨论，可关注行业最新动态。</p>`;

  const communityHTML = analysis.community.hasContent
    ? `<p>今日精彩动态 ${analysis.community.highlights?.length || 0} 条</p>`
    : `<p style="color: var(--text-secondary); font-size: var(--font-sm);">今日社群较为安静，大家都在默默耕耘中。</p>`;

  // HTML模板（CSS部分与之前相同，这里省略）
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>风变野菩萨AI视频社团A班 · 日报 ${targetDate}</title>
  <style>
    /* CSS样式与之前相同，这里省略以节省空间 */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    :root {
      --bg-primary: ${theme.primary};
      --bg-card: ${theme.card};
      --bg-card-hover: ${theme.cardHover};
      --border: ${theme.border};
      --text-primary: ${theme.textPrimary};
      --text-secondary: ${theme.textSecondary};
      --accent-primary: ${theme.accentPrimary};
      --accent-red: ${theme.accentRed};
      --accent-green: ${theme.accentGreen};
      --accent-purple: ${theme.accentPurple};
      --accent-orange: ${theme.accentOrange};
      --accent-yellow: ${theme.accentYellow};
      --gradient-title: ${theme.gradient};
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
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans SC", "Microsoft YaHei", sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      font-size: var(--font-base);
      line-height: 1.7;
      padding: 20px;
      min-height: 100vh;
    }
    .newspaper-header {
      max-width: 1600px;
      margin: 0 auto 30px;
      padding: 20px 0;
      border-bottom: 3px solid var(--accent-primary);
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .newspaper-title {
      font-size: var(--font-3xl);
      font-weight: 900;
      background: var(--gradient-title);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: 2px;
    }
    .issue-info, .stats-badge {
      font-size: var(--font-xs);
      color: var(--text-secondary);
      padding: 4px 12px;
      background: var(--bg-card);
      border-radius: 12px;
      border: 1px solid var(--border);
    }
    .header-divider {
      height: 2px;
      background: linear-gradient(90deg, transparent, var(--accent-primary), transparent);
      margin-top: 15px;
    }
    .newspaper-grid {
      max-width: 1600px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 25% 45% 28%;
      gap: 2%;
    }
    .col-left, .col-center, .col-right {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    section {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      transition: all 0.3s ease;
    }
    section:hover {
      background: var(--bg-card-hover);
      border-color: var(--accent-primary);
    }
    .block-title {
      font-size: var(--font-lg);
      font-weight: 700;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .block-title .icon {
      font-size: var(--font-xl);
    }
    footer {
      max-width: 1600px;
      margin: 30px auto 0;
      padding: 20px 0;
      text-align: center;
      color: var(--text-secondary);
      font-size: var(--font-xs);
      border-top: 1px solid var(--border);
    }
    @media (max-width: 1200px) {
      .newspaper-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <header class="newspaper-header">
    <div class="header-top">
      <span class="issue-info">${targetDate} 星期${dayOfWeek}</span>
      <h1 class="newspaper-title">野菩萨AI社团 · 每日资讯</h1>
      <span class="stats-badge">今日 ${stats.messageCount} 条消息 · ${stats.speakerCount} 人发言</span>
    </div>
    <div class="header-divider"></div>
  </header>

  <main class="newspaper-grid">
    <aside class="col-left">
      <section class="block-announcement">
        <h2 class="block-title"><span class="icon">📢</span>重要公告</h2>
        ${announcementHTML}
      </section>

      <section class="block-honor">
        <h2 class="block-title"><span class="icon">🏆</span>荣誉时刻</h2>
        ${honorHTML}
      </section>
    </aside>

    <article class="col-center">
      <section class="block-teacher">
        <h2 class="block-title"><span class="icon">👨‍🏫</span>师说</h2>
        ${teacherHTML}
      </section>

      <section class="block-hot">
        <h2 class="block-title"><span class="icon">🔥</span>热议话题</h2>
        ${hotTopicsHTML}
      </section>
    </article>

    <aside class="col-right">
      <section class="block-ai">
        <h2 class="block-title"><span class="icon">🤖</span>AI资讯</h2>
        ${aiNewsHTML}
      </section>

      <section class="block-community">
        <h2 class="block-title"><span class="icon">💬</span>社群动态</h2>
        ${communityHTML}
      </section>
    </aside>
  </main>

  <footer>
    <p>风变野菩萨AI视频社团A班 · 每日资讯 · 生成时间：${formatDateTime(new Date())}</p>
    <p style="margin-top: 5px; font-size: 12px; opacity: 0.7;">由 AI 分析生成 · Powered by Claude</p>
  </footer>
</body>
</html>`;

  fs.writeFileSync(htmlFile, html, 'utf8');
  console.log(`   HTML 文件已生成`);
}

// ============ 主函数 ============
async function main() {
  const targetDate = process.argv[2] || getYesterday();

  console.log('🔍 [进度] 步骤1/8: 正在解析目标日期...');
  console.log(`   目标日期: ${targetDate}`);
  console.log('');

  try {
    // Step 2: 获取聊天记录
    const messages = await queryChatLog(CONFIG.groupId, targetDate);

    if (messages.length === 0) {
      console.log('⚠️  未获取到任何消息，将生成空日报');
    }

    // Step 3: 生成 TXT
    const stats = generateTXT(messages, targetDate);

    // Step 4: AI 分析
    const analysis = await analyzeWithClaude(messages, targetDate);

    // Step 5: 生成 HTML
    generateHTML(messages, targetDate, stats, analysis);

    // Step 6-8: 暂时跳过（manifest、index、git）
    console.log(`📋 [进度] 步骤6/8: 跳过 manifest.json 更新（手动模式）`);
    console.log(`🔄 [进度] 步骤7/8: 跳过 index.html 更新（手动模式）`);
    console.log(`🚀 [进度] 步骤8/8: 跳过 GitHub 推送（手动模式）`);

    console.log('');
    console.log('✅ [完成] 日报生成完成！');
    console.log('');
    console.log(`📁 文件位置：`);
    console.log(`   - 原始记录：${CONFIG.outputDir}/raw-${targetDate}.txt`);
    console.log(`   - 日报HTML：${CONFIG.outputDir}/daily-${targetDate}.html`);
    console.log('');
    console.log(`📊 今日数据：`);
    console.log(`   - 消息总数：${stats.messageCount} 条`);
    console.log(`   - 发言人数：${stats.speakerCount} 人`);
    console.log('');

  } catch (error) {
    console.error('❌ 生成失败:', error.message);
    process.exit(1);
  }
}

// 启动
main();
