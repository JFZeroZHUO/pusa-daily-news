const fs = require('fs');
const path = require('path');

// 读取 index.html
let indexHtml = fs.readFileSync('index.html', 'utf8');

// 查找所有 daily-*.html 文件
const dailyFiles = fs.readdirSync('.')
  .filter(f => f.match(/^daily-\d{4}-\d{2}-\d{2}\.html$/))
  .sort()
  .reverse();

console.log(`找到 ${dailyFiles.length} 个日报文件`);

// 提取每个日报的可搜索文本
const searchData = {};

dailyFiles.forEach(file => {
  console.log(`处理 ${file}...`);

  try {
    const html = fs.readFileSync(file, 'utf8');

    // 提取纯文本（移除 HTML 标签、脚本、样式）
    let text = html
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();

    // 只保留前 5000 个字符（避免 index.html 过大）
    text = text.substring(0, 5000);

    searchData[file] = text;
    console.log(`  - 提取了 ${text.length} 个字符`);
  } catch (e) {
    console.error(`  - 错误: ${e.message}`);
    searchData[file] = '';
  }
});

// 在 index.html 中嵌入搜索数据
// 在 let digests = [...] 后面添加 let searchIndex = {...}
const searchIndexCode = `    let searchIndex = ${JSON.stringify(searchData)};`;

// 查找插入位置（在 DIGEST_DATA_END 之后）
const digestDataEnd = '// ===== DIGEST_DATA_END =====';
const insertPos = indexHtml.indexOf(digestDataEnd);

if (insertPos === -1) {
  console.error('未找到 DIGEST_DATA_END 标记');
  process.exit(1);
}

// 插入搜索索引
const newLine = '\n    // 搜索索引（自动生成，包含每个日报的纯文本内容）\n' + searchIndexCode + '\n';
indexHtml = indexHtml.substring(0, insertPos + digestDataEnd.length) + newLine + indexHtml.substring(insertPos + digestDataEnd.length);

// 写入更新后的 index.html
fs.writeFileSync('index.html', indexHtml, 'utf8');

console.log('\n✅ 已更新 index.html，嵌入了搜索索引');
console.log(`   - 嵌入了 ${Object.keys(searchData).length} 个日报的搜索数据`);
console.log(`   - 新增文件大小约 ${Math.round(JSON.stringify(searchData).length / 1024)} KB`);
