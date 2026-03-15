#!/usr/bin/env node
/**
 * 本地智能日报守护脚本
 * 功能：开机后自动检测 chatlog 服务，就绪后生成日报
 * 配合 Windows 任务计划程序使用
 */

const { execSync, spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

// ============ 配置 ============
const CONFIG = {
  repoPath: 'C:/Users/92860/Desktop/AI编程项目-个人合集/测试ClaudeCode',
  chatlogUrl: 'http://127.0.0.1:5030',
  groupId: '43988234971@chatroom',
  apiKey: 'gr_f6b84b5fb31e521d6b28313363a4a6a99d5c9b788a8283a67aeb721566d1fc93',
  apiBaseUrl: 'https://api.uucode.org',
  modelId: 'claude-opus-4-5-20251101',
  // 轮询配置
  pollIntervalMs: 5 * 60 * 1000,   // 每5分钟检查一次 chatlog
  maxWaitMs: 2 * 60 * 60 * 1000,   // 最多等待2小时
  logFile: 'C:/Users/92860/Desktop/AI编程项目-个人合集/测试ClaudeCode/logs/daily-runner.log',
};

// ============ 日志工具 ============
function log(msg) {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const line = `[${timestamp}] ${msg}`;
  console.log(line);
  try {
    const logDir = path.dirname(CONFIG.logFile);
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(CONFIG.logFile, line + '\n', 'utf-8');
  } catch (e) {
    // 日志写入失败不影响主流程
  }
}

// ============ 获取目标日期（昨天） ============
function getYesterday() {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// ============ 检查日报是否已生成 ============
function isDigestAlreadyGenerated(targetDate) {
  const htmlFile = path.join(CONFIG.repoPath, 'DailyNews', `daily-${targetDate}.html`);
  return fs.existsSync(htmlFile);
}

// ============ 检查 chatlog 服务是否运行 ============
function isChatlogRunning() {
  return new Promise((resolve) => {
    const req = http.get(`${CONFIG.chatlogUrl}/api/v1/chatlog?talker=test&time=2020-01-01&limit=1`, (res) => {
      resolve(true);
      res.resume();
    });
    req.on('error', () => resolve(false));
    req.setTimeout(3000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// ============ 等待 chatlog 就绪 ============
async function waitForChatlog() {
  const startTime = Date.now();
  let attempts = 0;

  while (Date.now() - startTime < CONFIG.maxWaitMs) {
    attempts++;
    log(`检查 chatlog 服务 (第${attempts}次)...`);

    const running = await isChatlogRunning();
    if (running) {
      log('chatlog 服务已就绪！');
      return true;
    }

    log(`chatlog 未运行，${CONFIG.pollIntervalMs / 60000} 分钟后重试...`);
    await sleep(CONFIG.pollIntervalMs);
  }

  log('等待超时（2小时），今日放弃生成');
  return false;
}

// ============ 执行完整生成流程 ============
function runGeneration(targetDate) {
  log(`开始生成 ${targetDate} 日报...`);

  try {
    execSync(
      `node "${path.join(CONFIG.repoPath, '.github/scripts/generate-all-local.js')}" ${targetDate}`,
      {
        stdio: 'inherit',
        cwd: CONFIG.repoPath,
        env: {
          ...process.env,
          ANTHROPIC_API_KEY: CONFIG.apiKey,
          ANTHROPIC_BASE_URL: CONFIG.apiBaseUrl,
          ANTHROPIC_MODEL_ID: CONFIG.modelId,
        },
        timeout: 10 * 60 * 1000, // 最多10分钟
      }
    );
    log(`日报生成成功：${targetDate}`);
    return true;
  } catch (err) {
    log(`日报生成失败：${err.message}`);
    return false;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============ 主函数 ============
async function main() {
  const targetDate = process.argv[2] || getYesterday();

  log('====================================');
  log(`daily-runner 启动，目标日期：${targetDate}`);

  // 1. 幂等检查：今天日报是否已生成
  if (isDigestAlreadyGenerated(targetDate)) {
    log(`日报已存在，跳过生成：DailyNews/daily-${targetDate}.html`);
    process.exit(0);
  }

  log('日报尚未生成，开始检测 chatlog 服务...');

  // 2. 等待 chatlog 就绪
  const chatlogReady = await waitForChatlog();
  if (!chatlogReady) {
    log('chatlog 未就绪，退出。请手动运行或等待明天开机重试。');
    process.exit(1);
  }

  // 3. 执行生成
  const success = runGeneration(targetDate);
  process.exit(success ? 0 : 1);
}

main();
