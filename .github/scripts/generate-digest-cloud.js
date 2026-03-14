#!/usr/bin/env node
/**
 * GitHub Actions 云端日报生成脚本
 * 读取本地上传的 raw JSON 数据，调用 Claude API 生成日报
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// ============ 配置 ============
const CONFIG = {
  outputDir: path.join(__dirname, '../../DailyNews'),
  dataDir: path.join(__dirname, '../../data'),
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  anthropicBaseUrl: process.env.ANTHROPIC_BASE_URL || 'https://api.uucode.org',
  modelId: process.env.ANTHROPIC_MODEL_ID || 'claude-opus-4-5-20251101',
  targetDate: process.env.TARGET_DATE,
};

if (!CONFIG.anthropicApiKey) {
  console.error('❌ 错误: 未找到 ANTHROPIC_API_KEY 环境变量');
  process.exit(1);
}

if (!CONFIG.targetDate) {
  console.error('❌ 错误: 未找到 TARGET_DATE 环境变量');
  process.exit(1);
}

if (!CONFIG.targetDate) {
  console.error('❌ 错误: 未找到 TARGET_DATE 环境变量');
  process.exit(1);
}

// ============ 工具函数 ============
function formatDateTime(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
}

function getDayOfWeek(dateStr) {
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  const date = new Date(dateStr);
  return days[date.getDay()];
}

// ============ 读取数据 ============
function loadMessages(targetDate) {
  console.log(`📡 [进度] 步骤1/5: 正在读取数据文件 (日期: ${targetDate})...`);

  const dataFile = path.join(CONFIG.dataDir, `raw-${targetDate}.json`);

  if (!fs.existsSync(dataFile)) {
    console.error(`❌ 错误: 数据文件不存在: ${dataFile}`);
    console.error('请先在本地运行采集脚本上传数据');
    process.exit(1);
  }

  const messages = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
  console.log(`   读取到 ${messages.length} 条消息`);

  return messages;
}

// ============ 生成 TXT ============
function generateTXT(messages, targetDate) {
  console.log(`📝 [进度] 步骤2/5: 正在写入原始TXT文件...`);

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

  fs.writeFileSync(txtFile, content, 'utf-8');
  console.log(`   已写入：${txtFile}`);

  return {
    messageCount: messages.length,
    speakerCount: uniqueSenders.size,
  };
}

// ============ 原生 HTTPS 调用 API ============
function callClaudeAPI(prompt) {
  return new Promise((resolve, reject) => {
    const baseUrl = new URL(CONFIG.anthropicBaseUrl);
    const postData = JSON.stringify({
      model: CONFIG.modelId,
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }]
    });

    const options = {
      hostname: baseUrl.hostname,
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

    console.log(`   请求地址: ${baseUrl.hostname}/v1/messages`);
    console.log(`   模型: ${CONFIG.modelId}`);

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`   HTTP 状态码: ${res.statusCode}`);
        if (res.statusCode !== 200) {
          reject(new Error(`${res.statusCode} ${data}`));
          return;
        }
        try {
          const response = JSON.parse(data);
          resolve(response.content[0].text);
        } catch (e) {
          reject(new Error('解析响应失败: ' + e.message));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// ============ AI 分析 ============
async function analyzeWithClaude(messages, targetDate) {
  console.log(`🤖 [进度] 步骤3/5: 正在分析6个板块内容...`);

  const chatText = messages
    .map(m => `[${m.time}] ${m.senderName}：${m.content}`)
    .join('\n');

  const prompt = `你是一位资深的社群内容分析师。请基于以下微信群聊天记录，生成一份专业的日报分析。

# 聊天记录
${chatText}

# 输出要求
请按以下6个板块分析，每个板块400-1200字，必须深度分析，不要简单罗列：

1. **今日热议** — 讨论最热烈的3-5个话题，分析讨论深度和观点碰撞
2. **技术前沿** — AI工具、技术方法、实践经验的分享与讨论
3. **创作灵感** — 视频创意、脚本思路、表达技巧等创作相关内容
4. **资源共享** — 工具推荐、教程链接、素材资源等实用信息
5. **问答互助** — 成员提问与解答，知识传递与经验分享
6. **社群动态** — 活动通知、成员互动、氛围观察等

# 输出格式
严格按照以下JSON格式输出，不要添加任何其他内容：

\`\`\`json
{
  "今日热议": "内容...",
  "技术前沿": "内容...",
  "创作灵感": "内容...",
  "资源共享": "内容...",
  "问答互助": "内容...",
  "社群动态": "内容..."
}
\`\`\`

如果某个板块确实没有相关内容，填写「今日暂无相关讨论」。`;

  const text = await callClaudeAPI(prompt);
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);

  if (!jsonMatch) {
    throw new Error('AI 返回格式错误，未找到 JSON 块');
  }

  const analysis = JSON.parse(jsonMatch[1]);
  console.log(`   分析完成，共6个板块`);

  return analysis;
}

// ============ 生成 HTML ============
function generateHTML(messages, targetDate, stats, analysis) {
  console.log(`🎨 [进度] 步骤4/5: 正在生成HTML日报...`);

  const htmlFile = path.join(CONFIG.outputDir, `daily-${targetDate}.html`);
  const dayOfWeek = getDayOfWeek(targetDate);

  const sections = [
    { title: '今日热议', icon: '🔥', content: analysis['今日热议'] },
    { title: '技术前沿', icon: '🚀', content: analysis['技术前沿'] },
    { title: '创作灵感', icon: '💡', content: analysis['创作灵感'] },
    { title: '资源共享', icon: '📦', content: analysis['资源共享'] },
    { title: '问答互助', icon: '💬', content: analysis['问答互助'] },
    { title: '社群动态', icon: '📊', content: analysis['社群动态'] },
  ];

  const sectionsHTML = sections
    .map(
      (s, i) => `
    <article class="section">
      <div class="section-header">
        <span class="section-icon">${s.icon}</span>
        <h2 class="section-title">${s.title}</h2>
      </div>
      <div class="section-content">
        ${s.content.split('\n\n').map(p => `<p>${p}</p>`).join('\n        ')}
      </div>
    </article>`
    )
    .join('\n');

  const html = `<!DOCTYPE html>
<html lang="zh-CN" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>风变野菩萨AI视频社团A班 · ${targetDate} 日报</title>
  <style>
    :root {
      --bg-primary: #0a0a0a;
      --bg-card: #1a1a1a;
      --bg-card-hover: #252525;
      --border: #2a2a2a;
      --text-primary: #e8e8e8;
      --text-secondary: #a0a0a0;
      --accent-blue: #3b82f6;
      --accent-purple: #8b5cf6;
      --accent-green: #10b981;
      --accent-orange: #f59e0b;
    }

    [data-theme="light"] {
      --bg-primary: #f5f3ee;
      --bg-card: #ffffff;
      --bg-card-hover: #f8f6f1;
      --border: #e0ddd5;
      --text-primary: #2c2c2c;
      --text-secondary: #666666;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      line-height: 1.8;
      padding: 2rem;
      transition: background 0.3s, color 0.3s;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
    }

    header {
      text-align: center;
      margin-bottom: 3rem;
      padding-bottom: 2rem;
      border-bottom: 2px solid var(--border);
    }

    .masthead {
      font-size: 2.5rem;
      font-weight: 900;
      letter-spacing: 0.5rem;
      margin-bottom: 0.5rem;
      background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .date-line {
      font-size: 1.1rem;
      color: var(--text-secondary);
      margin-bottom: 1rem;
    }

    .stats {
      display: flex;
      justify-content: center;
      gap: 2rem;
      font-size: 0.9rem;
      color: var(--text-secondary);
    }

    .columns {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2rem;
      margin-bottom: 3rem;
    }

    .section {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1.5rem;
      transition: all 0.3s;
    }

    .section:hover {
      background: var(--bg-card-hover);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid var(--border);
    }

    .section-icon {
      font-size: 1.5rem;
    }

    .section-title {
      font-size: 1.3rem;
      font-weight: 700;
    }

    .section-content {
      font-size: 0.95rem;
      color: var(--text-secondary);
    }

    .section-content p {
      margin-bottom: 1rem;
      text-align: justify;
    }

    .section-content p:last-child {
      margin-bottom: 0;
    }

    footer {
      text-align: center;
      padding-top: 2rem;
      border-top: 2px solid var(--border);
      color: var(--text-secondary);
      font-size: 0.9rem;
    }

    .theme-toggle {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: var(--bg-card);
      border: 1px solid var(--border);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      transition: all 0.3s;
      z-index: 1000;
    }

    .theme-toggle:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    @media (max-width: 1200px) {
      .columns {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .columns {
        grid-template-columns: 1fr;
      }

      .masthead {
        font-size: 1.8rem;
        letter-spacing: 0.3rem;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1 class="masthead">风变野菩萨AI视频社团A班</h1>
      <div class="date-line">${targetDate} 星期${dayOfWeek}</div>
      <div class="stats">
        <span>📊 消息总数：${stats.messageCount} 条</span>
        <span>👥 发言人数：${stats.speakerCount} 人</span>
      </div>
    </header>

    <div class="columns">
${sectionsHTML}
    </div>

    <footer>
      <p>本日报由 AI 自动生成 · 数据来源：微信群聊天记录</p>
      <p>生成时间：${formatDateTime(new Date())}</p>
    </footer>
  </div>

  <button class="theme-toggle" onclick="toggleTheme()" aria-label="切换主题">
    <span id="theme-icon">🌙</span>
  </button>

  <script>
    const STORAGE_KEY = 'pusa-theme';

    function toggleTheme() {
      const html = document.documentElement;
      const currentTheme = html.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

      html.setAttribute('data-theme', newTheme);
      localStorage.setItem(STORAGE_KEY, newTheme);

      document.getElementById('theme-icon').textContent = newTheme === 'dark' ? '🌙' : '☀️';
    }

    // 初始化主题
    (function() {
      const savedTheme = localStorage.getItem(STORAGE_KEY);
      if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        document.getElementById('theme-icon').textContent = savedTheme === 'dark' ? '🌙' : '☀️';
      }
    })();
  </script>
</body>
</html>`;

  fs.writeFileSync(htmlFile, html, 'utf-8');
  console.log(`   已生成：${htmlFile}`);
}

// ============ 主流程 ============
async function main() {
  try {
    console.log('🚀 开始生成日报...');
    console.log(`📅 目标日期：${CONFIG.targetDate}`);
    console.log('');

    // 确保输出目录存在
    if (!fs.existsSync(CONFIG.outputDir)) {
      fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    }

    // Step 1: 读取数据
    const messages = loadMessages(CONFIG.targetDate);

    if (messages.length === 0) {
      console.log('⚠️  未获取到任何消息，将生成空日报');
    }

    // Step 2: 生成 TXT
    const stats = generateTXT(messages, CONFIG.targetDate);

    // Step 3: AI 分析
    const analysis = await analyzeWithClaude(messages, CONFIG.targetDate);

    // Step 4: 生成 HTML
    generateHTML(messages, CONFIG.targetDate, stats, analysis);

    console.log('');
    console.log('✅ [完成] 日报生成完成！');
    console.log('');
    console.log(`📁 文件位置：`);
    console.log(`   - 原始记录：${CONFIG.outputDir}/raw-${CONFIG.targetDate}.txt`);
    console.log(`   - 日报HTML：${CONFIG.outputDir}/daily-${CONFIG.targetDate}.html`);
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

main();
