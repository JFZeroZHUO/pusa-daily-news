#!/usr/bin/env node
const https = require('https');
const fs = require('fs');

const apiKey = 'gr_f6b84b5fb31e521d6b28313363a4a6a99d5c9b788a8283a67aeb721566d1fc93';
const apiBaseUrl = 'https://api.uucode.org';
const modelId = 'claude-opus-4-5-20251101';

const txtFile = process.argv[2];
if (!txtFile) {
  console.error('Usage: node analyze-chat.js <txt-file>');
  process.exit(1);
}

const chatContent = fs.readFileSync(txtFile, 'utf-8');

const messages = [
  {
    role: 'user',
    content: `请分析以下微信群聊天记录，提取6个板块的内容。

聊天记录：
${chatContent}

请按以下格式输出JSON：
{
  "announcement": "📢 重要公告板块内容（400-600字，包含blockquote引用和AI分析）",
  "teacher": "👨‍🏫 师说板块内容（600-1200字，包含老师观点引用和AI延伸解读）",
  "hotTopic": "🔥 热议话题板块内容（600-1000字，包含多方观点和AI分析结论）",
  "honor": "🏆 荣誉时刻板块内容（400-600字，包含获奖信息和AI点评）",
  "aiNews": "🤖 AI资讯板块内容（500-800字，包含AI工具讨论和趋势判断）",
  "community": "💬 社群动态板块内容（400-600字，包含精选对话和氛围总结）"
}

板块识别规则：
1. 📢 重要公告：Andy老师或团团老师@全员的消息，或含"通知"、"公告"关键词
2. 👨‍🏫 师说：菩萨、Aria清的发言，重点关注超过50字的深度内容
3. 🔥 热议话题：回复数≥3的讨论串且具有学习/行业价值
4. 🏆 荣誉时刻：含"恭喜"、"获奖"、"优秀"、"表扬"等关键词
5. 🤖 AI资讯：涉及AI工具名称、技术讨论、工具对比、使用技巧
6. 💬 社群动态：不属于以上板块的有价值消息

要求：
1. 每个板块必须达到字数要求，不足时AI主动补充分析
2. 如果某板块无内容，填写"今日暂无"
3. 使用HTML blockquote标签引用原文
4. AI需要提供深度分析和实践建议
5. 只输出JSON，不要其他文字
6. 重要：JSON中的所有双引号必须转义，特别是中文引号"和"必须替换为普通引号并转义为\\"
7. 输出的JSON必须是严格有效的JSON格式，可以被JSON.parse()解析`
  }
];

const postData = JSON.stringify({
  model: modelId,
  max_tokens: 8192,
  messages: messages
});

const options = {
  hostname: 'api.uucode.org',
  path: '/v1/messages',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      if (result.content && result.content[0] && result.content[0].text) {
        console.log(result.content[0].text);
      } else {
        console.error('Unexpected API response:', data);
        process.exit(1);
      }
    } catch (e) {
      console.error('Failed to parse API response:', e.message);
      console.error('Raw response:', data);
      process.exit(1);
    }
  });
});

req.on('error', (e) => {
  console.error('API request failed:', e.message);
  process.exit(1);
});

req.write(postData);
req.end();
