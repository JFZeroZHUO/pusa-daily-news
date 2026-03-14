const fs = require('fs');
const data = JSON.parse(fs.readFileSync('C:/Users/92860/Desktop/AI编程项目-个人合集/测试ClaudeCode/DailyNews/temp_chatlog.json', 'utf8'));

// 生成干净的TXT
let txt = '===== 风变野菩萨AI视频社团A班 · 2026年02月23日 聊天记录 =====\n';
txt += '生成时间：2026-02-24 22:58:00\n';
txt += '消息总数：' + data.length + ' 条\n';
const senders = new Set(data.map(m => m.senderName));
txt += '发言人数：' + senders.size + ' 人\n';
txt += '========================================\n\n';

data.forEach(msg => {
  if (msg.type === 10000) return; // 跳过系统消息

  const time = new Date(msg.time);
  const timeStr = time.toTimeString().slice(0,5);
  let content = msg.content || '';

  // 处理不同消息类型
  if (msg.type === 3) {
    content = '[图片]';
  } else if (msg.type === 43) {
    content = '[视频]';
  } else if (msg.type === 47) {
    content = '[表情包]';
  } else if (msg.type === 49) {
    if (msg.subType === 57 && msg.contents && msg.contents.refer) {
      // 引用消息
      const referContent = (msg.contents.refer.content || '').trim().replace(/\n/g, ' ').slice(0, 30);
      content = '「引用 ' + msg.contents.refer.senderName + '：' + referContent + '」→ ' + content;
    } else if (msg.subType === 5) {
      // 链接分享
      const titleMatch = content.match(/<title>(.*?)<\/title>/);
      content = '[分享: ' + (titleMatch ? titleMatch[1] : '链接') + ']';
    } else if (msg.subType === 6) {
      // 文件
      const titleMatch = content.match(/<title>(.*?)<\/title>/);
      content = '[文件: ' + (titleMatch ? titleMatch[1] : '文件') + ']';
    } else if (content.includes('finderFeed') || content.includes('<feedType>')) {
      // 视频号分享
      const nickMatch = content.match(/<nickname>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/nickname>/);
      content = '[视频号: ' + (nickMatch ? nickMatch[1] : '视频') + ']';
    } else if (content.includes('<?xml')) {
      // 其他XML消息简化
      const titleMatch = content.match(/<title>(.*?)<\/title>/);
      if (titleMatch && titleMatch[1] && !titleMatch[1].includes('不支持')) {
        content = '[分享: ' + titleMatch[1] + ']';
      } else {
        content = '[分享内容]';
      }
    }
  }

  // 清理内容中的换行
  content = content.replace(/\n/g, ' ').trim();
  if (content.length > 200) content = content.slice(0, 200) + '...';

  txt += '[' + timeStr + '] ' + msg.senderName + '：' + content + '\n';
});

fs.writeFileSync('C:/Users/92860/Desktop/AI编程项目-个人合集/测试ClaudeCode/DailyNews/raw-2026-02-23.txt', txt, 'utf8');
console.log('TXT已生成');
