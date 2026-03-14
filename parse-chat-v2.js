const fs = require('fs');

const inputFile = process.argv[2] || '/tmp/chat_2026-02-23.json';
const outputFile = process.argv[3] || 'C:/Users/92860/Desktop/AI编程项目-个人合集/测试ClaudeCode/DailyNews/raw-2026-02-23.txt';
const dateStr = process.argv[4] || '2026年02月23日';

const msgs = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

let txt = `===== 风变野菩萨AI视频社团A班 · ${dateStr} 聊天记录 =====\n`;
txt += `生成时间：${new Date().toLocaleString('zh-CN', {timeZone:'Asia/Shanghai'})}\n`;
txt += `消息总数：${msgs.length} 条\n`;

const validMsgs = msgs.filter(m => m.type !== 10000);
const senders = new Set(validMsgs.map(m => m.senderName));
txt += `发言人数：${senders.size} 人\n`;
txt += '========================================\n\n';

validMsgs.forEach(m => {
  const time = new Date(m.time);
  const hh = String(time.getHours()).padStart(2, '0');
  const mm = String(time.getMinutes()).padStart(2, '0');
  const name = m.senderName || 'Unknown';
  let content = m.content || '';

  if (m.type === 3) {
    content = '[图片]';
  } else if (m.type === 43) {
    content = '[视频]';
  } else if (m.type === 47) {
    content = '[表情包]';
  } else if (m.type === 49) {
    if (m.subType === 57 && m.contents && m.contents.refer) {
      const ref = m.contents.refer;
      const refContent = (ref.content || '').trim().replace(/\n/g, ' ').substring(0, 30);
      content = `「引用 ${ref.senderName}：${refContent}」→ ${content}`;
    } else if (m.subType === 5 || m.subType === 8) {
      const titleMatch = content.match(/<title>([^<]+)<\/title>/);
      const title = titleMatch ? titleMatch[1] : '链接';
      content = `[分享: ${title.substring(0, 30)}]`;
    } else if (m.subType === 6) {
      const titleMatch = content.match(/<title>([^<]+)<\/title>/);
      const title = titleMatch ? titleMatch[1] : '文件';
      content = `[文件: ${title}]`;
    } else if (m.subType === 51) {
      const nickMatch = content.match(/<nickname>([^<]+)<\/nickname>/);
      const descMatch = content.match(/<desc[^>]*>([^<]+)<\/desc>/);
      const nick = nickMatch ? nickMatch[1] : '';
      const desc = descMatch ? descMatch[1].substring(0, 30) : '';
      content = `[视频号: ${nick} - ${desc}]`;
    } else if (content.includes('<?xml')) {
      const titleMatch = content.match(/<title>([^<]+)<\/title>/);
      if (titleMatch && !titleMatch[1].includes('不支持')) {
        content = `[分享: ${titleMatch[1].substring(0, 30)}]`;
      } else {
        content = '[特殊消息]';
      }
    }
  }

  content = content.replace(/\n+/g, ' ').trim();
  txt += `[${hh}:${mm}] ${name}：${content}\n`;
});

fs.writeFileSync(outputFile, txt, 'utf8');
console.log(`TXT已生成: ${outputFile}`);
console.log(`消息数: ${msgs.length}, 有效消息: ${validMsgs.length}, 发言人: ${senders.size}`);
