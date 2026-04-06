const fs = require('fs');

const data = fs.readFileSync('temp_chatlog.json', 'utf8');
const messages = JSON.parse(data);

// 统计信息
const messageCount = messages.length;
const speakers = new Set();
messages.forEach(m => {
  if (m.senderName && m.senderName.trim()) {
    speakers.add(m.senderName);
  }
});

// 生成 TXT 内容
let txt = `===== 风变野菩萨AI视频社团A班 · 2026年04月06日 聊天记录 =====
生成时间：${new Date().toISOString().replace('T', ' ').substring(0, 19)}
消息总数：${messageCount} 条
发言人数：${speakers.size} 人
========================================

`;

messages.forEach(msg => {
  // 跳过系统消息
  if (msg.type === 10000) return;

  const time = new Date(msg.time);
  const hh = String(time.getHours()).padStart(2, '0');
  const mm = String(time.getMinutes()).padStart(2, '0');
  const timestamp = `[${hh}:${mm}]`;

  // 使用 senderName 作为发言人名称
  const senderName = msg.senderName || msg.sender || '未知';
  let content = msg.content || '';

  // 处理不同类型消息
  if (msg.type === 47) {
    content = '[表情包]';
  } else if (msg.type === 43) {
    content = '[视频]';
  } else if (msg.type === 49 && msg.subType === 57) {
    const refer = msg.contents?.refer;
    if (refer) {
      const refTime = new Date(refer.time);
      const refHH = String(refTime.getHours()).padStart(2, '0');
      const refMM = String(refTime.getMinutes()).padStart(2, '0');
      const refMonth = String(refTime.getMonth() + 1).padStart(2, '0');
      const refDay = String(refTime.getDate()).padStart(2, '0');
      content = `> ${refer.senderName || '未知'} ${refMonth}-${refDay} ${refHH}:${refMM}\n`;
      if (refer.contents?.url) {
        content += `> [链接|${refer.contents.title || refer.contents.desc}](${refer.contents.url})`;
      }
      content += '\n' + (msg.content || '');
    }
  } else if (msg.type === 1 && content.includes('<?xml')) {
    content = '[其他消息]';
  } else if (msg.type === 3) {
    content = '[图片]';
  } else if (msg.type === 34) {
    content = '[语音]';
  } else if (msg.type === 49) {
    // 检查是否有 finderFeed (视频号分享)
    if (content.includes('<finderFeed>')) {
      const nicknameMatch = content.match(/<nickname><!\[CDATA\[(.+?)\]\]><\/nickname>/);
      const descMatch = content.match(/<desc><!\[CDATA\[(.+?)\]\]><\/desc>/);
      if (nicknameMatch && descMatch) {
        content = `[视频号分享] ${nicknameMatch[1]}: ${descMatch[1]}`;
      } else {
        content = '[视频号分享]';
      }
    } else {
      content = '[链接/文件]';
    }
  }

  // 过滤掉空内容和纯XML内容
  if (content && !content.startsWith('<?xml') && content.trim() !== '[其他消息]') {
    txt += `${timestamp} ${senderName}: ${content}\n\n`;
  }
});

fs.writeFileSync('raw-2026-04-06.txt', txt, 'utf8');
console.log('✅ TXT文件已生成，消息数:', messageCount, '发言人数:', speakers.size);
