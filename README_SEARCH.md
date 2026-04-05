# 📖 日报中心搜索功能使用说明

## ✨ 功能特性

### 1. 智能搜索框
- 位置：页面顶部导航栏右侧
- 输入关键词后自动搜索所有往期日报
- 支持中文搜索

### 2. 实时搜索结果
- 输入关键词后延迟300ms自动搜索
- 搜索结果以下拉列表形式展示
- 点击页面其他地方或按ESC键关闭搜索结果

### 3. 智能匹配
- 支持多关键词搜索（空格分隔）
- 自动提取上下文（关键词前后30字）
- 每个日报最多显示3条匹配结果
- 限制最多显示20条结果（避免性能问题）

### 4. 关键词高亮
- 搜索结果中的关键词会以蓝色背景高亮显示
- 点击结果可跳转到对应日报

### 5. 点击跳转
- 点击任意搜索结果
- 自动加载对应日报到iframe中
- 尝试在日报中高亮关键词（需要日报支持）

## 🎯 使用示例

### 示例1：搜索"比赛"
```
输入：比赛
结果：显示所有包含"比赛"的日报条目
点击：跳转到对应日报
```

### 示例2：搜索"Seedance 2.0"
```
输入：Seedance 2.0
结果：显示包含"Seedance"和"2.0"的日报
```

### 示例3：多关键词搜索
```
输入：Aria清 Seedance
结果：显示同时包含"Aria清"和"Seedance"的日报
```

## ⚡ 性能优化

### 缓存机制
- 已加载的日报内容会自动缓存
- 缓存限制：最多50个日报文件
- 避免重复加载相同文件

### 搜索优化
- 延迟搜索：输入停止后300ms才开始搜索
- 结果限制：每日报最多3条匹配，总共最多20条结果
- 智能上下文：只提取有意义的文本片段

## 🔧 技术实现

### 前端技术
- 纯JavaScript实现，无需后端支持
- 使用 Fetch API 异步加载日报文件
- 正则表达式匹配和关键词高亮

### 浏览器兼容性
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

### 文件协议支持
- ✅ **支持本地 file:// 协议**（搜索数据已嵌入，无需服务器）
- ✅ 支持 HTTP/HTTPS 协议

## 📝 注意事项

1. **搜索已支持本地访问**：所有日报的可搜索内容已嵌入 index.html，即使直接双击打开（file:// 协议）也能正常搜索
2. **结果数量限制**：为避免性能问题，最多显示20条结果
3. **上下文提取**：基于段落分割，可能不包含所有匹配内容
4. **iframe高亮**：需要在日报HTML中添加postMessage监听代码才能实现

## 🚀 高级功能（可选）

### 为日报添加关键词高亮支持

如果需要在日报内部也高亮关键词，可以在每个日报HTML的 `<script>` 标签中添加以下代码：

```javascript
// 监听来自父窗口的消息
window.addEventListener('message', function(event) {
  if (event.data.type === 'highlight-keyword') {
    const keyword = event.data.keyword;
    highlightKeywordInDocument(keyword);
  }

  if (event.data.type === 'scroll-to-first-match') {
    const keyword = event.data.keyword;
    scrollToFirstMatch(keyword);
  }
});

function highlightKeywordInDocument(keyword) {
  if (!keyword) return;

  // 移除之前的高亮
  document.querySelectorAll('.search-highlight-temp').forEach(el => {
    const parent = el.parentNode;
    parent.replaceChild(document.createTextNode(el.textContent), el);
    parent.normalize(); // 合并相邻文本节点
  });

  // 递归高亮所有文本节点
  highlightInElement(document.body, keyword);
}

function highlightInElement(element, keyword) {
  if (element.hasChildNodes()) {
    element.childNodes.forEach(child => highlightInElement(child, keyword));
  } else if (element.nodeType === 3) { // 文本节点
    const text = element.textContent;
    const regex = new RegExp(`(${keyword})`, 'gi');
    
    if (regex.test(text)) {
      const frag = document.createDocumentFragment();
      let lastIdx = 0;
      
      text.replace(regex, (match, p1, idx) => {
        if (idx > lastIdx) {
          frag.appendChild(document.createTextNode(text.substring(lastIdx, idx)));
        }
        
        const mark = document.createElement('mark');
        mark.className = 'search-highlight-temp';
        mark.style.background = 'rgba(88, 166, 255, 0.3)';
        mark.style.color = '#58a6ff';
        mark.style.fontWeight = '600';
        mark.style.padding = '1px 2px';
        mark.style.borderRadius = '2px';
        mark.textContent = p1;
        frag.appendChild(mark);
        
        lastIdx = idx + p1.length;
        return p1;
      });
      
      if (lastIdx < text.length) {
        frag.appendChild(document.createTextNode(text.substring(lastIdx)));
      }
      
      element.parentNode.replaceChild(frag, element);
    }
  }
}

function scrollToFirstMatch(keyword) {
  const firstMark = document.querySelector('.search-highlight-temp');
  if (firstMark) {
    firstMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}
```

## 📞 反馈与改进

如有问题或建议，请联系开发者。
