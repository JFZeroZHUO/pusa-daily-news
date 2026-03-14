#!/usr/bin/env node
/**
 * 每日日报检查脚本
 * 功能：
 * 1. 检查是否有今天的 chatlog JSON 文件
 * 2. 检查是否已生成今天的 daily HTML 文件
 * 3. 输出提示信息，便于后续生成日报
 */

const fs = require('fs');
const path = require('path');

const DIR = __dirname;

// 获取昨天日期 YYYY-MM-DD
function getYesterday() {
  const now = new Date();
  now.setDate(now.getDate() - 1); // 减去1天
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 获取昨天日期 YYYYMMDD
function getYesterdayCompact() {
  return getYesterday().replace(/-/g, '');
}

function main() {
  const yesterday = getYesterday();
  const yesterdayCompact = getYesterdayCompact();

  console.log('='.repeat(60));
  console.log(`📅 日报检查 - ${yesterday}（昨日）`);
  console.log('='.repeat(60));

  // 1. 检查 chatlog 文件
  const chatlogFile = path.join(DIR, `chatlog_${yesterdayCompact}.json`);
  const hasChatlog = fs.existsSync(chatlogFile);

  console.log(`\n🔍 检查聊天记录:`);
  if (hasChatlog) {
    const stat = fs.statSync(chatlogFile);
    const data = JSON.parse(fs.readFileSync(chatlogFile, 'utf8'));
    console.log(`  ✅ 找到: chatlog_${yesterdayCompact}.json`);
    console.log(`  📊 消息数: ${data.length} 条`);
    console.log(`  📦 文件大小: ${(stat.size / 1024).toFixed(1)} KB`);
  } else {
    console.log(`  ❌ 未找到: chatlog_${yesterdayCompact}.json`);
  }

  // 2. 检查 daily HTML 文件
  const dailyFile = path.join(DIR, `daily-${yesterday}.html`);
  const hasDaily = fs.existsSync(dailyFile);

  console.log(`\n📰 检查日报文件:`);
  if (hasDaily) {
    const stat = fs.statSync(dailyFile);
    console.log(`  ✅ 已生成: daily-${yesterday}.html`);
    console.log(`  📦 文件大小: ${(stat.size / 1024).toFixed(1)} KB`);
  } else {
    console.log(`  ❌ 未生成: daily-${yesterday}.html`);
  }

  // 3. 输出建议
  console.log('\n💡 建议:');
  if (!hasChatlog) {
    console.log(`  • 请先导出昨天的聊天记录为 chatlog_${yesterdayCompact}.json`);
  } else if (!hasDaily) {
    console.log('  • 聊天记录已就绪，可以开始生成日报');
    console.log(`  • 运行命令: 请AI分析 chatlog_${yesterdayCompact}.json 并根据 skill.md 生成 daily-${yesterday}.html`);
  } else {
    console.log('  ✨ 昨日日报已完成！');
  }

  console.log('\n' + '='.repeat(60));

  // 返回状态码
  if (hasChatlog && !hasDaily) {
    // 有chatlog但没日报，需要生成
    process.exit(2);
  } else if (hasDaily) {
    // 日报已存在
    process.exit(0);
  } else {
    // 没有chatlog
    process.exit(1);
  }
}

main();
