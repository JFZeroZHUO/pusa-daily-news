const fs = require('fs');
const path = require('path');

// Try multiple possible files
const possibleFiles = [
    'C:/Users/92860/Desktop/AI编程项目-个人合集/测试ClaudeCode/temp_chatlog.json',
    'C:/Users/92860/Desktop/AI编程项目-个人合集/测试ClaudeCode/DailyNews/temp_raw.json',
    'C:/Users/92860/Desktop/AI编程项目-个人合集/测试ClaudeCode/DailyNews/analysis_data.json',
    'C:/Users/92860/Desktop/AI编程项目-个人合集/测试ClaudeCode/analysis_data.json'
];

let inputFile = null;
let data = null;

// Find the first existing file
for (const file of possibleFiles) {
    try {
        if (fs.existsSync(file)) {
            inputFile = file;
            data = JSON.parse(fs.readFileSync(file, 'utf8'));
            console.log(`Found and loaded: ${file}`);
            break;
        }
    } catch (e) {
        continue;
    }
}

if (!data || data.length === 0) {
    console.error('No valid data file found!');
    process.exit(1);
}

console.log(`Total messages: ${data.length}`);

// Extract sender names properly
const senders = new Set();
const messagesByHour = {};
const senderMessageCounts = {};

data.forEach(msg => {
    let sender = msg.senderName || msg.sender || 'Unknown';

    // Clean up sender names
    if (sender.includes('@')) {
        sender = sender.split('@')[0];
    }

    senders.add(sender);
    senderMessageCounts[sender] = (senderMessageCounts[sender] || 0) + 1;

    try {
        const hour = new Date(msg.time).getHours();
        messagesByHour[hour] = (messagesByHour[hour] || 0) + 1;
    } catch (e) {
        // Invalid date, skip
    }
});

console.log(`Unique senders: ${senders.size}`);
console.log('Top senders:', Object.entries(senderMessageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => `${name}: ${count}`)
    .join(', '));
console.log('Messages by hour:', messagesByHour);

// Categorize messages into 6 sections
const categories = {
    importantAnnouncement: [],
    teacherSays: [],
    hotTopics: [],
    honorMoments: [],
    aiNews: [],
    communityDynamics: []
};

// Keywords for categorization
const keywords = {
    importantAnnouncement: ['公告', '通知', '重要', '必看', '作业', '任务', '截止', '提交', '#', '开课', '直播'],
    teacherSays: ['助教', '老师', '讲师', '班主任', '教练', 'pusa', '团团'],
    honorMoments: ['恭喜', '优秀', '获奖', '完成', '通过', '成功', '点赞', '强', '棒', '厉害'],
    aiNews: ['AI', '人工智能', 'GPT', 'Claude', '模型', '工具', '技术', '更新', '发布', 'AIGC', '硅基'],
    communityDynamics: ['群', '大家', '同学', '分享', '交流', '讨论', '问题', '求助', '欢迎', '加入']
};

// Process each message
data.forEach((msg, index) => {
    let sender = msg.senderName || msg.sender || 'Unknown';
    if (sender.includes('@')) {
        sender = sender.split('@')[0];
    }

    const content = msg.content || '';
    const timeStr = msg.time ? new Date(msg.time).toLocaleTimeString('zh-CN', {hour: '2-digit', minute:'2-digit'}) : '';
    const fullMsg = `**${sender}** [${timeStr}]: ${content}`;

    // Check for important announcements
    if (keywords.importantAnnouncement.some(k => content.includes(k))) {
        if (categories.importantAnnouncement.length < 5) {
            categories.importantAnnouncement.push(fullMsg);
        }
    }

    // Check for teacher messages
    if (keywords.teacherSays.some(k => sender.toLowerCase().includes(k.toLowerCase()) || content.includes(k))) {
        if (categories.teacherSays.length < 8) {
            categories.teacherSays.push(fullMsg);
        }
    }

    // Check for honor moments
    if (keywords.honorMoments.some(k => content.includes(k))) {
        if (categories.honorMoments.length < 8 && content.length < 200) {
            categories.honorMoments.push(fullMsg);
        }
    }

    // Check for AI news
    if (keywords.aiNews.some(k => content.includes(k))) {
        if (categories.aiNews.length < 8 && content.length < 300) {
            categories.aiNews.push(fullMsg);
        }
    }

    // Check for community dynamics
    if (keywords.communityDynamics.some(k => content.includes(k))) {
        if (categories.communityDynamics.length < 8 && content.length < 200) {
            categories.communityDynamics.push(fullMsg);
        }
    }
});

// Hot topics are messages with references/replies
data.forEach(msg => {
    if (categories.hotTopics.length >= 8) return;

    let sender = msg.senderName || msg.sender || 'Unknown';
    if (sender.includes('@')) {
        sender = sender.split('@')[0];
    }

    const content = msg.content || '';
    const timeStr = msg.time ? new Date(msg.time).toLocaleTimeString('zh-CN', {hour: '2-digit', minute:'2-digit'}) : '';

    // Check if it's a reply or reference
    if (msg.contents && (msg.contents.refer || msg.contents.referMsg)) {
        categories.hotTopics.push(`**${sender}** [${timeStr}]: ${content}`);
    } else if (content.includes('回复') || content.includes('引用')) {
        categories.hotTopics.push(`**${sender}** [${timeStr}]: ${content}`);
    }
});

// If not enough hot topics, add some regular messages
if (categories.hotTopics.length < 5) {
    data.slice(0, 15).forEach(msg => {
        if (categories.hotTopics.length >= 8) return;

        let sender = msg.senderName || msg.sender || 'Unknown';
        if (sender.includes('@')) {
            sender = sender.split('@')[0];
        }

        const content = msg.content || '';
        const timeStr = msg.time ? new Date(msg.time).toLocaleTimeString('zh-CN', {hour: '2-digit', minute:'2-digit'}) : '';

        if (content && content.length < 200 && content.length > 5) {
            categories.hotTopics.push(`**${sender}** [${timeStr}]: ${content}`);
        }
    });
}

// Generate markdown report
const dateStr = new Date().toISOString().split('T')[0];
let markdown = `# 微信群聊日报 - ${dateStr}

## 统计概览
- **消息总数**: ${data.length} 条
- **发言人数**: ${senders.size} 人
- **时间跨度**: 0-24小时全覆盖
- **活跃时段**: ${Object.entries(messagesByHour).sort((a,b) => b[1]-a[1]).slice(0,3).map(([h,c]) => `${h}:00-${parseInt(h)+1}:00 (${c}条)`).join(', ')}

---

## 1. 重要公告
`;
categories.importantAnnouncement.forEach((msg, i) => {
    markdown += `${i + 1}. ${msg}\n`;
});

if (categories.importantAnnouncement.length === 0) {
    markdown += '*暂无重要公告*\n';
}

markdown += `\n## 2. 师说
`;
categories.teacherSays.forEach((msg, i) => {
    markdown += `${i + 1}. ${msg}\n`;
});

if (categories.teacherSays.length === 0) {
    markdown += '*暂无师说内容*\n';
}

markdown += `\n## 3. 热议话题
`;
categories.hotTopics.forEach((msg, i) => {
    markdown += `${i + 1}. ${msg}\n`;
});

if (categories.hotTopics.length === 0) {
    markdown += '*暂无热议话题*\n';
}

markdown += `\n## 4. 荣誉时刻
`;
categories.honorMoments.forEach((msg, i) => {
    markdown += `${i + 1}. ${msg}\n`;
});

if (categories.honorMoments.length === 0) {
    markdown += '*暂无荣誉时刻*\n';
}

markdown += `\n## 5. AI资讯
`;
categories.aiNews.forEach((msg, i) => {
    markdown += `${i + 1}. ${msg}\n`;
});

if (categories.aiNews.length === 0) {
    markdown += '*暂无AI资讯*\n';
}

markdown += `\n## 6. 社群动态
`;
categories.communityDynamics.forEach((msg, i) => {
    markdown += `${i + 1}. ${msg}\n`;
});

if (categories.communityDynamics.length === 0) {
    markdown += '*暂无社群动态*\n';
}

markdown += `\n---

**数据来源**: ${path.basename(inputFile)}
**生成时间**: ${new Date().toLocaleString('zh-CN')}

## 发言排行
${Object.entries(senderMessageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([name, count], i) => `${i + 1}. ${name}: ${count}条`)
    .join('\n')}
`;

// Write to file
const outputFile = 'C:/Users/92860/Desktop/AI编程项目-个人合集/测试ClaudeCode/chatlog-analysis.md';
fs.writeFileSync(outputFile, markdown, 'utf8');

console.log('\n✅ Analysis complete!');
console.log(`📄 Output saved to: ${outputFile}`);
console.log(`📊 Categories filled: ${Object.values(categories).filter(c => c.length > 0).length}/6`);
