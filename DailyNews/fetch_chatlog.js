const fs = require('fs');
const https = require('https');

// 目标日期
const targetDate = process.argv[2] || '2026-03-14';
const groupId = '43988234971@chatroom';

// MCP 请求
const mcpRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/call',
  params: {
    name: 'query_chat_log',
    arguments: {
      talker: groupId,
      time_start: `${targetDate} 00:00:00`,
      time_end: `${targetDate} 23:59:59`,
      limit: 1000,
      format: 'json'
    }
  }
};

console.log(`正在获取 ${targetDate} 的聊天记录...`);
console.log('MCP 请求:', JSON.stringify(mcpRequest, null, 2));

// 由于 MCP SSE 连接较复杂，这里提供一个简化的 HTTP 查询方案
// 实际使用时需要根据 chatlog 服务的具体实现调整

const outputFile = `./chatlog_${targetDate.replace(/-/g, '')}.json`;
console.log(`\n提示：由于 MCP HTTP API 限制，请手动执行以下操作：`);
console.log(`1. 打开浏览器访问 http://127.0.0.1:5030`);
console.log(`2. 在查询界面输入以下参数：`);
console.log(`   - 群聊ID: ${groupId}`);
console.log(`   - 开始时间: ${targetDate} 00:00:00`);
console.log(`   - 结束时间: ${targetDate} 23:59:59`);
console.log(`   - 数量限制: 1000`);
console.log(`3. 导出 JSON 并保存为: ${outputFile}`);
console.log(`\n或者，如果有命令行工具，请运行：`);
console.log(`chatlog query --talker="${groupId}" --start="${targetDate} 00:00:00" --end="${targetDate} 23:59:59" --limit=1000 > ${outputFile}`);
