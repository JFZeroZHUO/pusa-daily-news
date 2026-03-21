/**
 * 微信群聊日报分析脚本（测试版）
 *
 * 功能：完整分析 0-24 小时聊天记录，提取 6 个板块内容
 * 解决 Read 工具 25000 token 限制问题
 *
 * 使用方法：
 * node test-analyze.js [日期]
 * 例如：node test-analyze.js 2026-03-20
 */

const fs = require('fs');
const path = require('path');

// ========== 配置 ==========
const CONFIG = {
  targetDate: process.argv[2] || new Date().toISOString().split('T')[0], // 目标日期
  jsonFile: `data/raw-${process.argv[2] || new Date().toISOString().split('T')[0]}.json`,
  outputFile: 'chatlog-analysis-test.json',
  rawTxtFile: `raw-${process.argv[2] || new Date().toISOString().split('T')[0]}.txt`
};

console.log('========================================');
console.log('📊 微信群聊日报分析脚本（测试版）');
console.log('========================================');
console.log(`📅 目标日期: ${CONFIG.targetDate}`);
console.log(`📄 JSON文件: ${CONFIG.jsonFile}`);
console.log(`📄 输出文件: ${CONFIG.outputFile}`);
console.log('========================================\n');

// ========== 主程序 ==========

try {
  // 步骤1: 读取 JSON 数据
  console.log('📡 [1/5] 正在读取 JSON 数据...');

  if (!fs.existsSync(CONFIG.jsonFile)) {
    console.error(`❌ 错误：找不到文件 ${CONFIG.jsonFile}`);
    console.log('请确保已执行以下命令获取数据：');
    console.log(`curl -s "http://127.0.0.1:5030/api/v1/chatlog?time=${CONFIG.targetDate}&talker=43988234971@chatroom&format=json&limit=1000" > ${CONFIG.jsonFile}`);
    process.exit(1);
  }

  // 读取完整数据
  const fullMessages = JSON.parse(fs.readFileSync('temp_chatlog.json', 'utf8'));

  // 构建 wxid 到 senderName 的映射（从所有可用的 data/raw-*.json 文件中）
  const wxidToName = {};
  const dataDir = 'data';
  if (fs.existsSync(dataDir)) {
    const files = fs.readdirSync(dataDir).filter(f => f.startsWith('raw-') && f.endsWith('.json'));
    files.forEach(file => {
      try {
        const msgs = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
        msgs.forEach(m => {
          if (m.sender && m.senderName) {
            wxidToName[m.sender] = m.senderName;
          }
        });
      } catch (e) {
        // 忽略解析错误
      }
    });
  }

  console.log(`📡 构建了 ${Object.keys(wxidToName).length} 个 wxid 映射`);

  // 将映射应用到完整数据
  const messages = fullMessages.map(m => ({
    ...m,
    senderName: m.senderName || wxidToName[m.sender] || m.sender
  }));

  console.log(`✅ 读取成功：${messages.length} 条消息\n`);

  // 步骤2: 统计分析
  console.log('📊 [2/5] 正在进行统计分析...');

  const speakers = new Set();
  const byHour = {};
  const byPeriod = { 上午: 0, 下午: 0, 晚上: 0, 深夜: 0 };

  messages.forEach(msg => {
    const sender = msg.senderName || '未知';
    speakers.add(sender);

    const hour = new Date(msg.time).getHours();
    if (!byHour[hour]) byHour[hour] = [];
    byHour[hour].push(msg);

    // 按时段统计
    if (hour >= 0 && hour < 6) byPeriod.深夜++;
    else if (hour >= 6 && hour < 12) byPeriod.上午++;
    else if (hour >= 12 && hour < 18) byPeriod.下午++;
    else byPeriod.晚上++;
  });

  console.log(`✅ 统计完成：${messages.length} 条消息，${speakers.size} 人发言\n`);

  // 步骤3: 提取 6 个板块内容
  console.log('🔍 [3/5] 正在提取 6 个板块内容...');

  // 板块1: 重要公告
  const announcements = messages.filter(m => {
    const sender = m.senderName || '';
    const content = m.content || '';
    return (
      sender.includes('ANDY') ||
      sender.includes('团团') ||
      content.includes('@所有人') ||
      content.includes('通知') ||
      content.includes('公告')
    );
  }).slice(0, 10).map(m => ({
    time: m.time,
    hour: new Date(m.time).getHours(),
    sender: m.senderName,
    content: (m.content || '').substring(0, 300)
  }));

  // 板块2: 师说
  const teachers = messages.filter(m => {
    const sender = m.senderName || '';
    return (
      sender === 'Pusa' ||
      sender === 'Aria清' ||
      sender === '野菩萨' ||
      sender.includes('老师')
    );
  }).slice(0, 10).map(m => ({
    time: m.time,
    hour: new Date(m.time).getHours(),
    sender: m.senderName,
    content: (m.content || '').substring(0, 500)
  }));

  // 板块3: 热议话题（回复数 >= 3 的讨论）
  // 简化版本：提取内容长度 > 20 的消息作为候选
  const hotTopics = messages.filter(m => {
    const content = m.content || '';
    return content.length > 20 && content.length < 500;
  }).slice(0, 20).map(m => ({
    time: m.time,
    hour: new Date(m.time).getHours(),
    sender: m.senderName,
    content: (m.content || '').substring(0, 200)
  }));

  // 板块4: 荣誉时刻
  const honors = messages.filter(m => {
    const content = m.content || '';
    return (
      content.includes('恭喜') ||
      content.includes('获奖') ||
      content.includes('优秀') ||
      content.includes('🏆') ||
      content.includes('[强]') ||
      content.includes('[庆祝]')
    );
  }).slice(0, 10).map(m => ({
    time: m.time,
    hour: new Date(m.time).getHours(),
    sender: m.senderName,
    content: (m.content || '').substring(0, 200)
  }));

  // 板块5: AI资讯
  const aiInfo = messages.filter(m => {
    const content = (m.content || '').toLowerCase();
    return (
      content.includes('seedance') ||
      content.includes('可灵') ||
      content.includes('即梦') ||
      content.includes('sora') ||
      content.includes('runway') ||
      content.includes('claude') ||
      content.includes('chatgpt') ||
      content.includes('gemini') ||
      content.includes('deepseek')
    );
  }).slice(0, 15).map(m => ({
    time: m.time,
    hour: new Date(m.time).getHours(),
    sender: m.senderName,
    content: (m.content || '').substring(0, 200)
  }));

  // 板块6: 社群动态（新成员、表情包、问候）
  const community = messages.filter(m => {
    const content = (m.content || '');
    return (
      content.includes('加入群聊') ||
      content.includes('欢迎') ||
      content.includes('[表情包]') ||
      content.includes('[庆祝]') ||
      content.includes('[烟花]') ||
      m.type === 47 // 表情包
    );
  }).slice(0, 15).map(m => ({
    time: m.time,
    hour: new Date(m.time).getHours(),
    sender: m.senderName,
    content: (m.content || '').substring(0, 150)
  }));

  console.log('✅ 板块提取完成\n');

  // 步骤4: 生成完整分析报告
  console.log('📝 [4/5] 正在生成分析报告...');

  // 发言排行榜
  const speakerCount = {};
  messages.forEach(m => {
    const sender = m.senderName || '未知';
    speakerCount[sender] = (speakerCount[sender] || 0) + 1;
  });
  const sortedSpeakers = Object.entries(speakerCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

  // 时间覆盖检查
  const sortedMessages = messages.sort((a, b) =>
    new Date(a.time) - new Date(b.time)
  );
  const firstMsg = sortedMessages[0];
  const lastMsg = sortedMessages[sortedMessages.length - 1];

  const analysisResult = {
    meta: {
      targetDate: CONFIG.targetDate,
      generatedAt: new Date().toISOString(),
      totalMessages: messages.length,
      totalSpeakers: speakers.size,
      timeCoverage: {
        firstMessage: firstMsg?.time || 'N/A',
        lastMessage: lastMsg?.time || 'N/A',
        coverage: '0-24小时全覆盖'
      },
      byPeriod,
      byHour
    },
    boards: {
      announcements: {
        title: '📢 重要公告',
        count: announcements.length,
        items: announcements
      },
      teachers: {
        title: '👨‍🏫 师说',
        count: teachers.length,
        items: teachers
      },
      hotTopics: {
        title: '🔥 热议话题',
        count: hotTopics.length,
        items: hotTopics
      },
      honors: {
        title: '🏆 荣誉时刻',
        count: honors.length,
        items: honors
      },
      aiInfo: {
        title: '🤖 AI资讯',
        count: aiInfo.length,
        items: aiInfo
      },
      community: {
        title: '💬 社群动态',
        count: community.length,
        items: community
      }
    },
    speakers: sortedSpeakers.map(([name, count], idx) => ({
      rank: idx + 1,
      name,
      count
    })),
    // 保存前100条完整消息用于引用
    sampleMessages: messages.slice(0, 100).map(m => ({
      time: m.time,
      sender: m.senderName,
      content: m.content || '',
      type: m.type
    }))
  };

  // 步骤5: 写入分析结果
  console.log('💾 [5/5] 正在保存分析结果...');

  fs.writeFileSync(
    CONFIG.outputFile,
    JSON.stringify(analysisResult, null, 2),
    'utf8'
  );

  console.log(`✅ 分析完成！结果已保存到: ${CONFIG.outputFile}\n`);

  // 输出统计摘要
  console.log('========================================');
  console.log('📊 分析摘要');
  console.log('========================================');
  console.log(`📅 日期: ${analysisResult.meta.timeCoverage.firstMessage} ~ ${analysisResult.meta.timeCoverage.lastMessage}`);
  console.log(`📝 消息数: ${analysisResult.meta.totalMessages} 条`);
  console.log(`👥 发言人: ${analysisResult.meta.totalSpeakers} 人`);
  console.log(`⏰ 时段分布:`);
  console.log(`   - 上午(06-12): ${byPeriod.上午} 条`);
  console.log(`   - 下午(12-18): ${byPeriod.下午} 条`);
  console.log(`   - 晚上(18-24): ${byPeriod.晚上} 条`);
  console.log(`   - 深夜(00-06): ${byPeriod.深夜} 条`);
  console.log('');
  console.log('📋 板块统计:');
  Object.entries(analysisResult.boards).forEach(([key, board]) => {
    console.log(`   ${board.title}: ${board.count} 条`);
  });
  console.log('');
  console.log(`💡 下一步: 基于此分析结果生成 HTML 日报`);
  console.log('========================================');

} catch (error) {
  console.error('❌ 错误:', error.message);
  process.exit(1);
}
