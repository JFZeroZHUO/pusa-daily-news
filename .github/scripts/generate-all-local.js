#!/usr/bin/env node
/**
 * 本地完整流程：采集 + 生成 + 推送
 * 一键完成所有操作
 */

const { execSync } = require('child_process');
const path = require('path');

const REPO_PATH = 'C:/Users/92860/Desktop/AI编程项目-个人合集/测试ClaudeCode';

async function main() {
  const targetDate = process.argv[2] || getYesterday();

  console.log('🚀 开始完整流程...');
  console.log(`📅 目标日期：${targetDate}`);
  console.log('');

  try {
    // Step 1: 采集数据
    console.log('📡 [1/3] 正在采集聊天记录...');
    execSync(`node "${path.join(REPO_PATH, '.github/scripts/collect-data-local.js')}" ${targetDate}`, {
      stdio: 'inherit',
      cwd: REPO_PATH
    });

    // Step 2: 生成日报
    console.log('');
    console.log('🤖 [2/3] 正在生成日报...');
    execSync(`node "${path.join(REPO_PATH, '.github/scripts/generate-digest-cloud.js')}"`, {
      stdio: 'inherit',
      cwd: REPO_PATH,
      env: {
        ...process.env,
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || 'gr_f6b84b5fb31e521d6b28313363a4a6a99d5c9b788a8283a67aeb721566d1fc93',
        ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL || 'https://api.uucode.org',
        ANTHROPIC_MODEL_ID: process.env.ANTHROPIC_MODEL_ID || 'claude-opus-4-5-20251101',
        TARGET_DATE: targetDate
      }
    });

    // Step 3: 推送到 GitHub
    console.log('');
    console.log('🚀 [3/3] 正在推送到 GitHub...');
    process.chdir(REPO_PATH);

    execSync(`git add DailyNews/daily-${targetDate}.html data/raw-${targetDate}.json`, { stdio: 'inherit' });

    try {
      execSync(`git commit -m "📰 日报 ${targetDate} | 自动生成"`, { stdio: 'inherit' });
      execSync('git push', { stdio: 'inherit' });
      console.log('   ✅ 推送成功！');
    } catch (e) {
      if (e.message.includes('nothing to commit')) {
        console.log('   ℹ️  没有新内容需要提交');
      } else {
        throw e;
      }
    }

    console.log('');
    console.log('✅ 全部完成！');
    console.log('');
    console.log(`📁 生成的文件：`);
    console.log(`   - ${REPO_PATH}/DailyNews/daily-${targetDate}.html`);
    console.log(`   - ${REPO_PATH}/DailyNews/raw-${targetDate}.txt`);
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ 流程失败:', error.message);
    process.exit(1);
  }
}

function getYesterday() {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

main();
