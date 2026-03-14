#!/usr/bin/env node
/**
 * 本地数据采集脚本
 * 功能：调用本地 chatlog API，将消息保存为 JSON 并推送到 GitHub
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ============ 配置 ============
const CONFIG = {
  chatlogUrl: 'http://127.0.0.1:5030',
  groupId: '43988234971@chatroom',
  repoPath: 'C:/Users/92860/Desktop/AI编程项目-个人合集/测试ClaudeCode',
  dataDir: 'data',
};

// ============ 工具函数 ============
function getYesterday() {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// ============ HTTP API 调用 ============
function queryChatLog(talker, time, limit = 1000) {
  return new Promise((resolve, reject) => {
    const queryParams = new URLSearchParams({ talker, time, limit });
    const url = `${CONFIG.chatlogUrl}/api/v1/chatlog?${queryParams.toString()}`;

    console.log(`📡 正在获取群聊消息 (日期: ${time})...`);

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
          const messages = parseChatlogText(data);
          console.log(`   获取到 ${messages.length} 条消息`);
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

function parseChatlogText(text) {
  const messages = [];
  const blocks = text.split('\n\n').filter(b => b.trim());

  for (const block of blocks) {
    const lines = block.split('\n');
    if (lines.length === 0) continue;

    const firstLine = lines[0];
    const match = firstLine.match(/^(.+?)\((.+?)\)\s+(\d{2}:\d{2}:\d{2})$/);

    if (!match) continue;

    const [, senderName, sender, time] = match;

    let content = '';
    let quotedMsg = null;
    let contentStartIndex = 1;

    if (lines[1] && lines[1].startsWith('>')) {
      const quoteLine = lines[1].substring(1).trim();
      const quoteMatch = quoteLine.match(/^(.+?)\s+(\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})$/);

      if (quoteMatch) {
        quotedMsg = {
          sender: quoteMatch[1],
          time: quoteMatch[2]
        };

        if (lines[2] && lines[2].startsWith('>')) {
          quotedMsg.content = lines[2].substring(1).trim();
          contentStartIndex = 3;
        } else {
          contentStartIndex = 2;
        }
      }
    }

    content = lines.slice(contentStartIndex).join('\n').trim();

    messages.push({
      sender,
      senderName,
      time,
      content,
      quotedMsg,
      type: 1
    });
  }

  return messages;
}

// ============ 保存并推送 ============
function saveAndPush(messages, targetDate) {
  console.log(`💾 正在保存数据文件...`);

  const dataDir = path.join(CONFIG.repoPath, CONFIG.dataDir);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dataFile = path.join(dataDir, `raw-${targetDate}.json`);
  fs.writeFileSync(dataFile, JSON.stringify(messages, null, 2), 'utf-8');
  console.log(`   已保存：${dataFile}`);

  console.log(`🚀 正在推送到 GitHub...`);

  try {
    // 切换到仓库目录
    process.chdir(CONFIG.repoPath);

    // Git 操作
    execSync(`git add ${CONFIG.dataDir}/raw-${targetDate}.json`, { stdio: 'inherit' });
    execSync(`git commit -m "📊 数据采集 ${targetDate} | ${messages.length}条消息"`, { stdio: 'inherit' });
    execSync('git push', { stdio: 'inherit' });

    console.log(`   推送成功！GitHub Actions 将自动生成日报`);
  } catch (error) {
    console.error('❌ Git 操作失败:', error.message);
    console.error('请手动执行：');
    console.error(`  cd ${CONFIG.repoPath}`);
    console.error(`  git add ${CONFIG.dataDir}/raw-${targetDate}.json`);
    console.error(`  git commit -m "📊 数据采集 ${targetDate}"`);
    console.error(`  git push`);
    process.exit(1);
  }
}

// ============ 主流程 ============
async function main() {
  try {
    const targetDate = process.argv[2] || getYesterday();

    console.log('🚀 开始采集数据...');
    console.log(`📅 目标日期：${targetDate}`);
    console.log('');

    // 检查 chatlog API 是否可用
    console.log(`🔍 检查 chatlog API (${CONFIG.chatlogUrl})...`);
    try {
      await new Promise((resolve, reject) => {
        http.get(`${CONFIG.chatlogUrl}/api/v1/chatroom`, (res) => {
          if (res.statusCode === 200) {
            console.log('   ✅ API 可用');
            resolve();
          } else {
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        }).on('error', reject);
      });
    } catch (error) {
      console.error('❌ chatlog API 不可用，请确保服务已启动');
      console.error(`   错误：${error.message}`);
      process.exit(1);
    }

    // 获取消息
    const messages = await queryChatLog(CONFIG.groupId, targetDate);

    if (messages.length === 0) {
      console.log('⚠️  未获取到任何消息');
      console.log('   可能原因：');
      console.log('   1. 该日期没有聊天记录');
      console.log('   2. 群ID配置错误');
      console.log('   3. chatlog 数据库未同步');
    }

    // 保存并推送
    saveAndPush(messages, targetDate);

    console.log('');
    console.log('✅ 采集完成！');
    console.log('');
    console.log('📋 后续步骤：');
    console.log('   1. GitHub Actions 将自动触发');
    console.log('   2. 云端调用 Claude API 生成日报');
    console.log('   3. 生成的 HTML 将自动提交到仓库');
    console.log('');

  } catch (error) {
    console.error('❌ 采集失败:', error.message);
    process.exit(1);
  }
}

main();
