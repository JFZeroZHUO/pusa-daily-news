const fs = require('fs');
const data = fs.readFileSync('temp_chatlog.json', 'utf8');
const messages = JSON.parse(data);

// 统计信息
const messageCount = messages.length;
const speakers = new Set();
messages.forEach(m => speakers.add(m.senderName));

// 生成 TXT 内容
let txt = `===== 风变野菩萨AI视频社团A班 · 2026年04月01日 聊天记录 =====
生成时间：${new Date().toISOString().replace('T', ' ').substring(0, 19)}
消息总数：${messageCount} 条
发言人数：${speakers.size} 人
========================================

`;

messages.forEach(msg => {
  const time = new Date(msg.time);
  const hh = String(time.getHours()).padStart(2, '0');
  const mm = String(time.getMinutes()).padStart(2, '0');
  const timestamp = `[${hh}:${mm}]`;

  let content = msg.content || '';

  // 处理不同类型消息
  if (msg.type === 47) content = '[表情包]';
  else if (msg.type === 43) content = '[视频]';
  else if (msg.type === 49 && msg.subType === 57) {
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
  }

  txt += `${timestamp} ${msg.senderName}: ${content}\n\n`;
});

fs.writeFileSync('raw-2026-04-01.txt', txt, 'utf8');
console.log('✅ TXT文件已生成，消息数:', messageCount, '发言人数:', speakers.size);
