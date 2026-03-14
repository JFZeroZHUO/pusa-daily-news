#!/usr/bin/env node
/**
 * 日报生成提醒脚本
 * 运行 check-daily.js 并根据结果输出Claude提示词
 */

const { execSync } = require('child_process');
const path = require('path');

const DIR = __dirname;

try {
  // 运行检查脚本
  execSync('node check-daily.js', { cwd: DIR, stdio: 'inherit' });

  // Exit code 0: 日报已生成
  console.log('\n✨ 无需操作，今日日报已完成！');

} catch (err) {
  const exitCode = err.status;

  if (exitCode === 2) {
    // 有chatlog但没日报
    console.log('\n🚀 准备生成日报！');
    console.log('\n请对Claude说：');
    console.log('─'.repeat(60));
    console.log('请分析今天的 chatlog JSON 文件，');
    console.log('按照 skill.md 规范生成今日 HTML 日报，');
    console.log('使用瀑布流布局，并根据内容量智能拆分板块。');
    console.log('─'.repeat(60));

  } else if (exitCode === 1) {
    // 没有chatlog
    console.log('\n⏳ 等待聊天记录...');
    console.log('请先导出今天的微信聊天记录为 chatlog_YYYYMMDD.json');
  }
}
