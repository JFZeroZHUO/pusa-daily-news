const fs = require('fs');
const data = JSON.parse(fs.readFileSync('C:/Users/92860/Desktop/AI编程项目-个人合集/测试ClaudeCode/DailyNews/temp_2026-02-28.json', 'utf8'));

// Filter & format messages
const messages = data.filter(m => m.type !== 10000);
const senders = new Set(messages.map(m => m.senderName));

// Generate TXT
let txt = '===== 风变野菩萨AI视频社团A班 · 2026年02月28日 聊天记录 =====\n';
txt += '生成时间：2026-03-01 00:00:00\n';
txt += '消息总数：' + messages.length + ' 条\n';
txt += '发言人数：' + senders.size + ' 人\n';
txt += '========================================\n\n';

for (const m of messages) {
  const d = new Date(m.time);
  const hh = String(d.getHours()).padStart(2,'0');
  const mm = String(d.getMinutes()).padStart(2,'0');
  const time = hh + ':' + mm;
  let content = '';
  if (m.type === 3) {
    content = '[图片]';
  } else if (m.type === 43) {
    content = '[视频]';
  } else if (m.type === 47) {
    content = '[表情包]';
  } else if (m.type === 49 && m.subType === 57) {
    // Quote message
    const refer = m.contents && m.contents.refer;
    const refName = refer ? (refer.senderName || '') : '';
    let refContent = '';
    if (refer) {
      if (refer.type === 3) refContent = '[图片]';
      else if (refer.type === 43) refContent = '[视频]';
      else if (refer.type === 47) refContent = '[表情包]';
      else if (refer.contents && refer.contents.title) refContent = '[分享: ' + refer.contents.title + ']';
      else refContent = refer.content || '';
    }
    const short = refContent.substring(0, 30) + (refContent.length > 30 ? '...' : '');
    const prefix = refName ? '「引用 ' + refName + '：' + short + '」 ' : '';
    content = prefix + (m.content || '');
  } else if (m.type === 49 && m.subType === 5) {
    content = '[分享: ' + (m.contents && m.contents.title ? m.contents.title : '链接') + ']';
  } else if (m.type === 49 && m.subType === 51) {
    content = '[分享: ' + (m.contents && m.contents.title ? m.contents.title : '视频号') + ']';
  } else {
    content = m.content || '';
    if (content.startsWith('<?xml')) content = '[富媒体消息]';
  }
  txt += '[' + time + '] ' + m.senderName + '：' + content + '\n';
}

fs.writeFileSync('C:/Users/92860/Desktop/AI编程项目-个人合集/测试ClaudeCode/DailyNews/raw-2026-02-28.txt', txt, 'utf8');
console.log('TXT written. Messages:', messages.length, 'Senders:', senders.size);

// Also generate simplified JSON for analysis
const simplified = messages.map(m => {
  const d = new Date(m.time);
  const hh = String(d.getHours()).padStart(2,'0');
  const mm = String(d.getMinutes()).padStart(2,'0');
  let content = '';
  if (m.type === 3) content = '[图片]';
  else if (m.type === 43) content = '[视频]';
  else if (m.type === 47) content = '[表情包]';
  else if (m.type === 49 && m.subType === 57) {
    const refer = m.contents && m.contents.refer;
    const refName = refer ? (refer.senderName || '') : '';
    let refContent = '';
    if (refer) {
      if (refer.type === 3) refContent = '[图片]';
      else if (refer.type === 43) refContent = '[视频]';
      else if (refer.type === 47) refContent = '[表情包]';
      else if (refer.contents && refer.contents.title) refContent = '[分享: ' + refer.contents.title + ']';
      else refContent = refer.content || '';
    }
    const short = refContent.substring(0, 30) + (refContent.length > 30 ? '...' : '');
    const prefix = refName ? '「引用 ' + refName + '：' + short + '」 ' : '';
    content = prefix + (m.content || '');
  } else if (m.type === 49 && m.subType === 5) {
    content = '[分享: ' + (m.contents && m.contents.title ? m.contents.title : '链接') + ']';
  } else if (m.type === 49 && m.subType === 51) {
    content = '[分享: ' + (m.contents && m.contents.title ? m.contents.title : '视频号') + ']';
  } else {
    content = m.content || '';
    if (content.startsWith('<?xml')) content = '[富媒体消息]';
  }
  return { time: hh+':'+mm, sender: m.senderName, content };
});

fs.writeFileSync('C:/Users/92860/Desktop/AI编程项目-个人合集/测试ClaudeCode/DailyNews/analysis_2026-02-28.json', JSON.stringify(simplified, null, 2), 'utf8');
console.log('Analysis JSON written:', simplified.length, 'entries');
console.log('Senders:', [...senders].join(', '));
