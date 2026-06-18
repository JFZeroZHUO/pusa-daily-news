const fs = require('fs');

const targetDate = '2026-05-08';
const inputFile = process.argv[2] || 'C:/Users/92860/.claude/projects/C--Users-92860-Desktop-AI------------ClaudeCode/a144fa73-c1f9-431c-955f-1a1c19998d25/tool-results/bnte2lzvo.txt';

// 读取JSON数据
const rawData = fs.readFileSync(inputFile, 'utf8');
const messages = JSON.parse(rawData);

// 过滤掉系统消息，只保留有效消息
const validMessages = messages.filter(m => m.type !== 10000);

// 统计
const messageCount = validMessages.length;
const speakers = new Set();
validMessages.forEach(m => speakers.add(m.senderName));
const speakerCount = speakers.size;

// 生成TXT内容
const now = new Date();
const timeStr = now.toISOString().replace('T', ' ').substring(0, 19);

let txt = `===== 风变野菩萨AI视频社团A班 · 2026年05月08日 聊天记录 =====
生成时间：${timeStr}
消息总数：${messageCount} 条
发言人数：${speakerCount} 人
========================================

`;

validMessages.forEach(msg => {
  const time = new Date(msg.time);
  const hh = String(time.getHours()).padStart(2, '0');
  const mm = String(time.getMinutes()).padStart(2, '0');
  const timestamp = `[${hh}:${mm}]`;

  let content = msg.content || '';

  // 处理不同类型消息
  if (msg.type === 47) content = '[表情包]';
  else if (msg.type === 43) content = '[视频]';
  else if (msg.type === 49 && msg.subType === 57) {
    // 引用消息
    const refer = msg.contents?.refer;
    if (refer) {
      const refTime = new Date(refer.time);
      const refHH = String(refTime.getHours()).padStart(2, '0');
      const refMM = String(refTime.getMinutes()).padStart(2, '0');
      const refMonth = String(refTime.getMonth() + 1).padStart(2, '0');
      const refDay = String(refTime.getDate()).padStart(2, '0');
      content = `> ${refer.senderName || '未知'} 05-${refDay} ${refHH}:${refMM}\n`;
      if (refer.contents?.url) {
        content += `> [${refer.contents.title || refer.contents.desc}](${refer.contents.url})`;
      }
      content += '\n' + (msg.content || '');
    }
  } else if (msg.type === 49 && msg.subType === 51) {
    // 视频/分享内容
    if (msg.contents?.title) {
      content = '[分享: ' + msg.contents.title + ']';
    }
  } else if (msg.type === 1 && content.includes('<?xml')) {
    content = '[其他消息]';
  }

  let senderName = msg.senderName || '未知';

  txt += `${timestamp} ${senderName}: ${content}\n\n`;
});

// 写入文件
const outputPath = `raw-${targetDate}.txt`;
fs.writeFileSync(outputPath, txt, 'utf8');

console.log('消息数:', messageCount, '发言人数:', speakerCount);