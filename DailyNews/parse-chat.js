const fs = require('fs');
const data = JSON.parse(fs.readFileSync('C:/Users/92860/.claude/projects/C--Users-92860-Desktop-AI------------ClaudeCode/5642dbea-4c73-4885-a472-9b2aa034c2ee/tool-results/bb90602.txt', 'utf8'));

const messages = data.filter(m => m.type !== 10000).map(m => {
  const time = new Date(m.time).toLocaleTimeString('zh-CN', {hour:'2-digit', minute:'2-digit'});
  let content = m.content || '';

  if (m.type === 47) content = '[表情包]';
  else if (m.type === 3) content = '[图片]';
  else if (m.type === 43) content = '[视频]';
  else if (m.type === 49) {
    const titleMatch = content.match(/<title>([^<]*)<\/title>/);
    if (titleMatch) content = '[分享: ' + titleMatch[1] + ']';
  }

  content = content.replace(/<[^>]+>/g, '').trim();
  if (content.length > 300) content = content.substring(0, 300) + '...';

  return {time, sender: m.senderName || '未知', content, type: m.type};
});

console.log('消息总数:', messages.length);
const speakers = [...new Set(messages.map(m => m.sender))];
console.log('发言人数:', speakers.length);
console.log('发言人:', speakers.join(', '));
console.log('========================================');
messages.forEach(m => console.log('[' + m.time + '] ' + m.sender + ': ' + m.content));
