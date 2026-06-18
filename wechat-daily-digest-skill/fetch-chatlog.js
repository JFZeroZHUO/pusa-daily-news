#!/usr/bin/env node
/**
 * Chatlog HTTP API 封装
 * 用于替代 MCP 工具，直接通过 HTTP API 获取聊天记录
 */

const http = require('http');

const CHATLOG_URL = 'http://127.0.0.1:5030';

/**
 * 查询聊天记录
 * @param {Object} params
 * @param {string} params.talker - 群ID或联系人ID
 * @param {string} params.time - 时间范围，格式：YYYY-MM-DD 或 YYYY-MM-DD~YYYY-MM-DD
 * @param {number} params.limit - 返回条数限制
 * @param {string} params.sender - 可选，发送者筛选
 * @returns {Promise<Array>} 消息列表
 */
function queryChatLog(params) {
  return new Promise((resolve, reject) => {
    const queryParams = new URLSearchParams();

    if (params.talker) queryParams.append('talker', params.talker);
    if (params.time) queryParams.append('time', params.time);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.sender) queryParams.append('sender', params.sender);

    const url = `${CHATLOG_URL}/api/v1/chatlog?${queryParams.toString()}`;

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
          // chatlog API 返回的是纯文本格式，需要解析
          const messages = parseChatlogText(data);
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

/**
 * 解析 chatlog API 返回的文本格式
 * 格式：发送者(wxid) 时间\n> 引用内容\n消息内容\n\n
 */
function parseChatlogText(text) {
  const messages = [];
  const blocks = text.split('\n\n').filter(b => b.trim());

  for (const block of blocks) {
    const lines = block.split('\n');
    if (lines.length === 0) continue;

    // 第一行：发送者(wxid) 时间
    const firstLine = lines[0];
    const match = firstLine.match(/^(.+?)\((.+?)\)\s+(\d{2}:\d{2}:\d{2})$/);

    if (!match) continue;

    const [, senderName, sender, time] = match;

    // 处理引用和内容
    let content = '';
    let quotedMsg = null;
    let contentStartIndex = 1;

    // 检查是否有引用（以 > 开头的行）
    if (lines[1] && lines[1].startsWith('>')) {
      const quoteLine = lines[1].substring(1).trim();
      const quoteMatch = quoteLine.match(/^(.+?)\s+(\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})$/);

      if (quoteMatch) {
        quotedMsg = {
          sender: quoteMatch[1],
          time: quoteMatch[2]
        };

        // 引用的内容在第二行
        if (lines[2] && lines[2].startsWith('>')) {
          quotedMsg.content = lines[2].substring(1).trim();
          contentStartIndex = 3;
        } else {
          contentStartIndex = 2;
        }
      }
    }

    // 剩余行是消息内容
    content = lines.slice(contentStartIndex).join('\n').trim();

    messages.push({
      sender,
      senderName,
      time,
      content,
      quotedMsg,
      type: 1 // 文本消息
    });
  }

  return messages;
}

/**
 * 查询群聊列表
 */
function queryChatRoom() {
  return new Promise((resolve, reject) => {
    const url = `${CHATLOG_URL}/api/v1/chatroom`;

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
          const rooms = JSON.parse(data);
          resolve(rooms);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

// 命令行调用
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('用法: node fetch-chatlog.js <talker> <date> [limit]');
    console.error('示例: node fetch-chatlog.js 43988234971@chatroom 2026-03-11 1000');
    process.exit(1);
  }

  const [talker, date, limit = '1000'] = args;

  queryChatLog({
    talker,
    time: date,
    limit: parseInt(limit)
  })
    .then(messages => {
      console.log(JSON.stringify(messages, null, 2));
    })
    .catch(error => {
      console.error('错误:', error.message);
      process.exit(1);
    });
}

module.exports = {
  queryChatLog,
  queryChatRoom
};
