# wechat-daily-digest

## 元信息
- **name**: wechat-daily-digest
- **description**: 自动获取微信群【风变野菩萨AI视频社团A班】昨日聊天记录，生成原始TXT存档 + 16:9报纸风HTML日报
- **license**: MIT

---

## ⚡️ 自动执行协议

**在执行本 Skill 时，你必须遵守以下规则：**

0. **🚨 执行前必检查（Priority 0）** — 在开始任何工作前，必须确认以下事项，否则禁止继续：
   - ✅ 我将完整读取 raw-*.txt 文件内容（不会只看标题或摘要）
   - ✅ 我理解每个板块需要 400-1200 字的深度分析
   - ✅ 我准备一次性生成完整的 HTML（不会因输出长度而简化内容）
   - ✅ 我将包含完整的原文引用（不会概括或省略）

   **如果任何一项未确认，停止执行并输出错误：❌ [错误] 未通过执行检查**

1. **不要请求确认** — 收到触发指令后立即执行，禁止问"是否继续"、"要开始吗"等问题
2. **一次性生成完整输出** — 必须一次性生成完整的 TXT + HTML，不得分步询问
3. **数据缺失时使用默认值** — 某板块无内容时自动填写「今日暂无」，不停下询问
4. **遇到错误时记录并继续** — 除 MCP 无法连接外，所有错误静默处理后继续执行
5. **输出结构化进度日志** — 在关键步骤输出标准格式的进度信息，供调度器监控执行状态

### 进度日志格式规范

在执行过程中，必须在以下关键节点输出进度日志：

```
🔍 [进度] 步骤1/9: 正在解析目标日期...
📡 [进度] 步骤2/9: 正在获取群聊消息 (日期: YYYY-MM-DD)...
📝 [进度] 步骤3/9: 正在写入原始TXT文件...
🤖 [进度] 步骤4/9: 正在分析6个板块内容...
🎨 [进度] 步骤5/9: 正在生成HTML日报...
📋 [进度] 步骤6/9: 正在更新manifest.json索引...
🔄 [进度] 步骤7/9: 正在更新index.html内嵌数据...
📊 [进度] 步骤8/9: 正在更新搜索索引...
🚀 [进度] 步骤9/9: 正在推送到GitHub...
✅ [完成] 日报生成完成！
```

**重要：** 这些进度日志是必需的，用于：
- 让调度器知道任务正在执行（避免超时）
- 帮助定位问题发生的具体步骤
- 提供实时执行状态反馈

---

## 功能概述

本 Skill 自动完成：
1. 通过 chatlog MCP 获取昨日群聊全部消息
2. 整理为完整原始记录写入 TXT 文件
3. 基于 TXT 内容分析 6 个板块，每板块 AI 深度撰写 400-1200 字
4. 生成 16:9 报纸风三栏 HTML 日报

---

## 触发方式

| 方式 | 示例 | 说明 |
|---|---|---|
| 斜杠命令 | `/wechat-daily-digest` | 生成昨天的日报 |
| 斜杠命令+日期 | `/wechat-daily-digest 2026-02-19` | 生成指定日期的日报 |
| 斜杠命令+日期范围 | `/wechat-daily-digest 2026-02-11 2026-02-15` | 批量生成多天日报 |
| 自然语言 | "生成昨天的群聊日报" | 生成昨天的日报 |
| 自然语言+日期 | "生成2月11日的日报" | 生成指定日期的日报 |
| 自然语言+范围 | "生成过去7天的日报" | 批量生成多天日报 |

---

## 输入参数

| 参数 | 默认值 | 说明 |
|---|---|---|
| `date` | 昨天（自动计算） | 分析日期，格式 YYYY-MM-DD。支持单日期或日期范围 |
| `end_date` | 无 | 可选，日期范围的结束日期。指定后会批量生成从 date 到 end_date 的所有日报 |
| `group_id` | `43988234971@chatroom` | 固定群ID，无需修改 |
| `output_dir` | `C:/Users/92860/Desktop/AI编程项目-个人合集/测试ClaudeCode/DailyNews/` | 固定输出目录 |

---

## MCP 工具调用顺序

### Step 1: 解析目标日期

**⚠️ 进度日志输出点：**
```
🔍 [进度] 步骤1/9: 正在解析目标日期...
```

**执行逻辑：**
```
1. 如果用户指定了日期参数，使用指定日期
2. 如果用户指定了日期范围（两个日期），生成范围内所有日期的列表
3. 如果未指定日期，默认使用昨天（today - 1天）

日期格式支持：
- YYYY-MM-DD（标准格式）
- MM-DD（自动补全当前年份）
- "昨天"、"前天"、"今天"（自然语言）
- "过去N天"（生成最近N天的日报）
```

### Step 2: 获取群聊消息

**⚠️ 进度日志输出点：**
```
📡 [进度] 步骤2/9: 正在获取群聊消息 (日期: YYYY-MM-DD)...
```

**执行逻辑：**
```
调用 query_chat_log:
  talker:     43988234971@chatroom
  time_start: <target_date> 00:00:00
  time_end:   <target_date> 23:59:59
  limit:      1000
  format:     json

如果是批量生成，对每个日期分别调用。
```

**⚠️ 数据查询优化建议：**
- **limit 从 2000 降低到 1000**：减少单次查询数据量，提高响应速度
- 如果消息数超过 1000 条，可以分时段查询：
  - 上午段：00:00-12:00
  - 下午段：12:00-18:00
  - 晚间段：18:00-23:59
- 对于历史数据批量生成，建议使用日期范围而非单次大查询

**重要：JSON 返回数据字段说明**
- `sender`: 发送者的 wxid（如 `wxid_531c1a5cxpuj11`）— 不要使用这个
- `senderName`: 发送者的真实昵称（如 `逆流而上 lu-xh`）— **必须使用这个字段作为发言人名称**
- 在生成 TXT 和 HTML 时，始终使用 `senderName` 显示发言人，不要显示 wxid

### Step 3: 写入原始 TXT

**⚠️ 进度日志输出点：**
```
📝 [进度] 步骤3/9: 正在写入原始TXT文件...
```

**执行逻辑：**
```
1. 使用 Step 2 获取的 chatlog JSON 数据
2. 使用 Node.js 脚本将 JSON 格式化为 TXT
3. **强制覆盖写入** raw-YYYY-MM-DD.txt（即使文件已存在）

⚠️ 重要：每次执行都必须重新生成txt文件，确保数据始终来自最新的chatlog查询

💡 跨平台兼容实现（Bash + Node.js）：

**Windows 版本（已验证）：**
```bash
# Step 2: 获取 JSON 数据
curl -s "http://127.0.0.1:5030/api/v1/chatlog?time=${target_date}&talker=43988234971@chatroom&format=json&limit=1000" > temp_chatlog.json

# Step 3: 转换为 TXT（使用相对路径，不依赖系统临时目录）
node -e "
const fs = require('fs');
const data = fs.readFileSync('temp_chatlog.json', 'utf8');
const messages = JSON.parse(data);

// 统计信息
const messageCount = messages.length;
const speakers = new Set();
messages.forEach(m => speakers.add(m.senderName));

// 生成 TXT 内容
let txt = \`===== 风变野菩萨AI视频社团A班 · \${target_date.replace(/-/g,'年').replace(/(\d{4})(\d{2})/, '\$1年\$2月\$3日')} 聊天记录 =====
生成时间：\${new Date().toISOString().replace('T', ' ').substring(0, 19)}
消息总数：\${messageCount} 条
发言人数：\${speakers.size} 人
========================================

\`;

messages.forEach(msg => {
  const time = new Date(msg.time);
  const hh = String(time.getHours()).padStart(2, '0');
  const mm = String(time.getMinutes()).padStart(2, '0');
  const timestamp = \`[\${hh}:\${mm}]\`;

  let content = msg.content || '';

  // 处理不同类型消息
  if (msg.type === 47) content = '[表情包]';
  else if (msg.type === 43) content = '[视频]';
  else if (msg.type === 49 && msg.subType === 57) {
    const refer = msg.contents?.refer;
    if (refer) {
      const refTime = new Date(refer.time);
      const refHH = String(refTime.getHours()).padStart(2, '0');
      const refMM = String(refTime.getMinutes()).padStart(2, '0');
      const refMonth = String(refTime.getMonth() + 1).padStart(2, '0');
      const refDay = String(refTime.getDate()).padStart(2, '0');
      content = \`\\> \${refer.senderName || '未知'} \${refMonth}-\${refDay} \${refHH}:\${refMM}\\n\`;
      if (refer.contents?.url) {
        content += \`> [链接|\${refer.contents.title || refer.contents.desc}](\${refer.contents.url})\`;
      }
      content += '\\n' + (msg.content || '');
    }
  } else if (msg.type === 1 && content.includes('<?xml')) {
    content = '[其他消息]';
  }

  txt += \`\${timestamp} \${msg.senderName}: \${content}\\n\\n\`;
});

fs.writeFileSync('raw-\${target_date}.txt', txt, 'utf8');
console.log('✅ TXT文件已生成，消息数:', messageCount, '发言人数:', speakers.size);
"
```

**关键要点：**
- ✅ 使用相对路径 `temp_chatlog.json`（当前工作目录）而非系统临时目录
- ✅ 避免硬编码 `/tmp` 或 `C:\tmp` 等平台特定路径
- ✅ 所有文件操作都在当前工作目录中进行
``
```

文件路径：`{output_dir}/raw-YYYY-MM-DD.txt`

TXT 格式：
```
===== 风变野菩萨AI视频社团A班 · YYYY年MM月DD日 聊天记录 =====
生成时间：YYYY-MM-DD HH:mm:ss
消息总数：XXX 条
发言人数：XX 人
========================================

[HH:mm] 发言人昵称：消息内容
[HH:mm] 发言人昵称：消息内容
...
```

**⚠️ 关键规则：发言人名称必须使用 senderName（真实昵称），绝对不能使用 sender（wxid）**

示例：
- ✅ 正确：`[07:20] 春天: seedance2.0,不让用人物了`
- ❌ 错误：`[07:20] wxid_g9sdp64gtr1p21: seedance2.0,不让用人物了`

其他规则：
- 过滤掉系统消息（type=10000）
- 图片/视频/表情包标注为 [图片]、[视频]、[表情包]
- 分享内容标注为 [分享: 标题]
- 引用消息格式：「引用 XXX：原文」→ 回复内容

### Step 4: 分析 6 个板块内容

**⚠️ 进度日志输出点：**
```
🤖 [进度] 步骤4/9: 正在分析6个板块内容...
```

**执行逻辑：**

**⚠️ 大文件处理策略（防止 Read 工具 25000 token 限制）：**

```
1. 检查文件大小：
   - 使用 Bash 命令统计 raw TXT 文件的行数
   - 如果行数 < 2000：直接使用 Read 工具读取完整文件
   - 如果行数 ≥ 2000：启用分段读取策略

2. 分段读取策略（针对大文件）：
   方案 A：按时间段分段
   - 读取前 500 行（00:00-12:00 时段）
   - 读取中间 500 行（12:00-18:00 时段）
   - 读取后 500 行（18:00-24:00 时段）
   - 使用 Read 工具的 offset 和 limit 参数实现

   方案 B：按板块优先级分段
   - 第一遍：搜索"重要公告"关键词（Pusa、ANDY、团团、@所有人）
   - 第二遍：搜索"师说"关键词（Pusa、Aria清、老师）
   - 第三遍：搜索"荣誉"关键词（恭喜、获奖、优秀）
   - 使用 Grep 工具精准定位关键对话

3. 综合分析：
   - 汇总各时段/各板块的提取内容
   - 按照下方"6 个板块内容规范"进行深度分析
   - 确保每个板块 400-1200 字的深度撰写
```

**示例：大文件分段读取命令**

```bash
# 检查文件行数
wc -l raw-2026-03-20.txt

# 分段读取（使用 Read 工具的 offset/limit 参数）
# 第一段：行 1-500
# 第二段：行 500-1000
# 第三段：行 1500-2000（或到文件末尾）
```

**核心原则：**
- ✅ 完整读取 0-24 小时数据，不允许截断
- ✅ 每个板块必须有深度分析，不能只是概括
- ✅ 保留完整原文引用（blockquote 格式）
- ✅ 如果某个板块内容稀少，主动补充行业背景或 AI 见解

---

### ⚠️ 引用消息识别规则（所有板块通用）

**问题说明：**
微信群聊中存在大量"引用回复"消息，格式如下：

```
[10:50] 张三: > Aria清 03-21 10:41

回复内容
```

这种消息的含义是：
- **张三**在 10:50 发言
- 引用了 **Aria清** 在 10:41 的话
- "回复内容"是 **张三** 说的，不是 Aria清 说的

**识别特征：**
1. 消息中包含 `> 某人 日期 时间` 格式
2. 引用标记下方是回复者的内容
3. 发言人是 `> ` 前面的名字，不是 `> ` 后面的名字

**错误示例：**
```
[10:50] : > Aria清 03-21 10:41

我给忘了，主要是会做PPT，却不会写提案[流泪]
```
❌ 错误理解：这是 Aria清 说的
✅ 正确理解：这是某人引用 Aria清 的话后说的回复

**应用规则（所有板块）：**

1. **👨‍🏫 师说板块**
   - 需要找到老师的**原始发言**，不是引用老师的话
   - 如果消息格式是 `> 某老师 时间`，说明这是**回复者**说的，不是老师说的
   - 正确做法：搜索老师名字，找到他们的主动发言（不带 `> ` 标记的）

2. **🔥 热议话题板块**
   - 引用回复表示"这是某人在回应之前的讨论"
   - 回复者才是观点表达者，被引用者只是话题背景
   - 需要提取回复者的观点，并标注"某某回应：..."

3. **🏆 荣誉时刻板块**
   - 引用格式常用于"恭喜某人的作品"
   - 需要区分：是谁在表扬谁的作品
   - 示例：`> 张三 时间` + "太棒了！" → 某人在表扬张三

4. **🤖 AI资讯板块**
   - 引用讨论表示"某人在回应工具话题"
   - 回复内容才是真正的观点分享

5. **💬 社群动态板块**
   - 引用欢迎 = 某人在欢迎新人
   - 需要准确记录"谁欢迎了谁"

**代码识别逻辑（供参考）：**
```javascript
// 判断是否为引用消息
function isReplyMessage(content) {
  return content.includes('> ') && content.match(/> .+?\s+\d{2}-\d{2}\s+\d{2}:\d{2}/);
}

// 提取真实发言人
function extractRealSpeaker(message) {
  if (isReplyMessage(message.content)) {
    // 引用标记后的内容是回复者说的
    return message.sender; // 发送引用回复的人
  }
  return message.sender; // 普通消息的发送者
}
```

**AI 分析时的检查清单：**
```
□ 这条消息包含 `> 某人 时间` 格式吗？
  □ 是 → 这是引用回复，内容是回复者说的
  □ 否 → 这是普通消息，内容是发言人说的

□ 我要把这段话归给谁？
  □ 被引用者（`> ` 后面的人）→ ❌ 错误
  □ 回复者（`> ` 前面的人）→ ✅ 正确
```

---

根据下方"6 个板块内容规范"章节的规则，分析聊天记录并提取各板块内容。

### Step 5: 生成 HTML 日报

**⚠️ 进度日志输出点：**
```
🎨 [进度] 步骤5/9: 正在生成HTML日报...
```

文件路径：`{output_dir}/daily-YYYY-MM-DD.html`

### Step 6: 更新 manifest.json 索引

**⚠️ 进度日志输出点：**
```
📋 [进度] 步骤6/9: 正在更新manifest.json索引...
```

每次生成日报后，必须更新 `{output_dir}/manifest.json` 文件，将新日报添加到索引中。

**manifest.json 结构：**
```json
{
  "name": "野菩萨AI社团日报中心",
  "description": "风变AI视频社团A班每日资讯存档",
  "lastUpdated": "YYYY-MM-DD",
  "digests": [
    {
      "date": "YYYY-MM-DD",
      "file": "daily-YYYY-MM-DD.html",
      "title": "今日核心话题标题",
      "messageCount": 消息总数,
      "speakerCount": 发言人数
    }
  ]
}
```

**更新规则：**
1. 读取现有 `manifest.json`，如不存在则创建新文件
2. 检查 `digests` 数组中是否已存在该日期的记录
   - 如已存在：更新该条记录
   - 如不存在：在数组开头插入新记录
3. 更新 `lastUpdated` 为当前日期
4. `title` 字段：从今日内容中提取最核心的话题作为标题（10-20字）
5. 保持 `digests` 数组按日期降序排列（最新在前）

**示例：**
```json
{
  "name": "野菩萨AI社团日报中心",
  "description": "风变AI视频社团A班每日资讯存档",
  "lastUpdated": "2026-02-20",
  "digests": [
    {
      "date": "2026-02-19",
      "file": "daily-2026-02-19.html",
      "title": "Seedance 2.0 vs 可灵 3.0 深度解读",
      "messageCount": 42,
      "speakerCount": 14
    },
    {
      "date": "2026-02-18",
      "file": "daily-2026-02-18.html",
      "title": "AI视频大赛获奖作品分析",
      "messageCount": 56,
      "speakerCount": 18
    }
  ]
}
```

### Step 7: 更新 index.html 内嵌数据

**⚠️ 进度日志输出点：**
```
🔄 [进度] 步骤7/9: 正在更新index.html内嵌数据...
```

每次生成日报后，必须同步更新 `{output_dir}/index.html` 中的内嵌日报数据，确保本地直接打开也能正常显示。

**更新方法：**
1. 读取 `index.html` 文件
2. 找到 `// ===== DIGEST_DATA_START =====` 和 `// ===== DIGEST_DATA_END =====` 之间的内容
3. 将 `let digests = [...]` 替换为最新的日报数组（与 manifest.json 中的 digests 保持一致）
4. 保存文件

**示例：**
替换前：
```javascript
// ===== DIGEST_DATA_START =====
let digests = [
  {"date":"2026-02-18","file":"daily-2026-02-18.html","title":"旧标题","messageCount":30,"speakerCount":10}
];
// ===== DIGEST_DATA_END =====
```

替换后：
```javascript
// ===== DIGEST_DATA_START =====
let digests = [
  {"date":"2026-02-19","file":"daily-2026-02-19.html","title":"Seedance 2.0 vs 可灵 3.0 深度解读","messageCount":42,"speakerCount":14},
  {"date":"2026-02-18","file":"daily-2026-02-18.html","title":"旧标题","messageCount":30,"speakerCount":10}
];
// ===== DIGEST_DATA_END =====
```

### Step 8: 更新搜索索引

**⚠️ 进度日志输出点：**
```
📋 [进度] 步骤8/9: 正在更新搜索索引...
```

**执行逻辑：**

在生成新日报后，需要更新搜索索引，以便搜索功能能找到新内容：

```bash
cd {output_dir}
node build-search-index.js
```

此脚本会：
1. 扫描所有 `daily-*.html` 文件
2. 提取每个日报的纯文本内容（前5000字）
3. 将搜索数据嵌入到 `index.html` 的 `searchIndex` 变量中
4. 更新后的 `index.html` 支持本地 file:// 协议的搜索功能

### Step 9: 推送到 GitHub

**⚠️ 进度日志输出点：**
```
🚀 [进度] 步骤9/9: 正在推送到GitHub...
```

**执行逻辑：**

在所有文件写入完成后，切换到输出目录并执行 git 操作：

```bash
cd {output_dir}
git add daily-YYYY-MM-DD.html manifest.json index.html
git commit -m "📰 日报 YYYY-MM-DD | XX条消息 · XX人发言"
git push
```

> ⚠️ `raw-*.txt` 文件已被 `.gitignore` 排除，**不要**尝试 add，直接忽略即可。

**提交信息格式：**
```
📰 日报 YYYY-MM-DD | {messageCount}条消息 · {speakerCount}人发言
```

示例：
```
📰 日报 2026-02-28 | 188条消息 · 30人发言
```

**注意事项：**
- `{output_dir}` 是一个独立的 git 仓库（`C:/Users/92860/Desktop/AI编程项目-个人合集/测试ClaudeCode/DailyNews/`）
- 只 add 本次生成的相关文件，不要 `git add .`（避免误提交临时文件）
- 批量生成多天日报时，每天单独 commit，最后统一 push 一次
- 如果 git push 失败（网络问题、无远程仓库等），静默记录错误并继续，不影响本地文件生成的成功状态

**错误处理：**

| 场景 | 处理方式 |
|---|---|
| 无远程仓库（未配置 origin） | 跳过 push，只执行 commit，输出提示 |
| push 失败（网络/权限） | 静默记录，输出警告，任务仍标记成功 |
| 目录不是 git 仓库 | 输出提示，跳过整个 Step 8 |

---

## 6 个板块内容规范

### 板块一：📢 重要公告
**识别规则：**
- 发言人为 ANDY老师、团团老师（企业微信号，通常含"@openim"或公司名）
- **ANDY老师或团团老师 @全员 的消息**（即使不含"公告"字样，只要@全员就算重要通知）
- 内容含"通知"、"公告"、"提醒"、"@所有人"等关键词
- 任何人转发的官方通知

**内容结构（400-600字）：**
1. 公告原文完整引用（blockquote格式）
2. 要点提炼列表（3-5条）
3. AI行动建议段落（100-150字）

**今日暂无时：** 填写「今日群内暂无重要公告，社群运营平稳进行中。」

---

### 板块二：👨‍🏫 师说
**识别规则：**
- 发言人：`Pusa`（野菩萨）、`Aria清`（wxid_kpgoc237amu922）
- 提取所有发言，重点关注超过50字的深度内容
- **⚠️ 引用消息判断：**
  - 如果消息格式是 `> Aria清 时间` + "回复内容"，这是**某人在引用老师的话**
  - "回复内容"不是老师说的，而是回复者说的
  - 必须找到老师的**原始发言**（不带 `> ` 标记的消息）
  - 示例：
    ```
    [10:50] 张三: > Aria清 03-21 10:41

    我给忘了，主要是会做PPT，却不会写提案[流泪]
    ```
    ❌ 错误：把"我给忘了..."归为 Aria清 说的
    ✅ 正确：这是张三在引用 Aria清 后说的回复，不是 Aria清 的发言

**内容结构（600-1200字）：**
1. **核心观点提炼**：用1-2句话概括老师本日核心主张
2. **关键句引用**：选取最有价值的2-3段原文（blockquote）
3. **AI延伸解读**：基于老师观点，AI提供200-300字的延伸分析、背景补充、对学员的实践建议
4. 若两位老师都有发言，分别呈现，各有小标题

**写作要求：**
- 语气：专业媒体 + 社群运营结合，有温度但不失深度
- 引用后必须有AI的独立见解，不能只是复述
- 可以提出"延伸思考"或"实践建议"

**今日暂无时：** 填写「今日两位老师暂无重要发言，期待明日精彩内容。」

---

### 板块三：🔥 热议话题
**识别规则：**
- 判断标准：回复数 ≥ 3 条的讨论串 **且** 话题具有学习/行业价值
- 优先选取涉及 AI工具、创作技巧、行业动态的讨论
- 最多提取 2 个热议话题
- **⚠️ 引用消息判断：**
  - 热议话题中的引用消息表示"某人在回应之前的观点"
  - 回复者才是新的观点贡献者
  - 提取时需要标注清楚：某某回应了某话题
  - 示例：
    ```
    [13:05] 正: > 张三 03-20 12:30

    我觉得你这个观点不对，应该是...
    ```
    ✅ 正确：这是"正"在回应张三的观点，"我觉得..."是正说的

**内容结构（600-1000字，每个话题300-500字）：**
1. **话题标题**：用一句话概括话题核心
2. **热度标签**：参与人数 + 消息条数
3. **多方观点引用**：选取2-4条代表性发言（blockquote）
4. **AI分析结论**：话题背景分析 + 各方观点梳理 + AI的判断与建议（150-200字）

**今日暂无时：** 填写「今日群内讨论较为平静，暂无高热度话题。」

---

### 板块四：🏆 荣誉时刻
**识别规则：**
- 含"恭喜"、"获奖"、"优秀"、"第一"、"金奖"、"银奖"、"铜奖"、"表扬"等关键词
- 老师对学员作品的正面点评
- 比赛结果公布
- **⚠️ 引用消息判断：**
  - 引用格式常用于"恭喜某人的作品"或"回应某人的成就"
  - 需要区分：是谁在表扬谁的作品
  - 示例：
    ```
    [13:20] 李四: > 张三 13:15

    太棒了！恭喜恭喜[强][强]
    ```
    ✅ 正确：李四在表扬张三的作品
    ❌ 错误：张三自己夸自己太棒了

**内容结构（400-600字）：**
1. 获奖/表扬原文引用
2. 获奖人/作品简介（如有信息）
3. AI点评推荐（100-150字）：分析作品/成就的亮点，对其他学员的启发

**今日暂无时：** 填写「今日暂无荣誉表彰，继续加油，期待下一位闪光时刻！」

---

### 板块五：🤖 AI资讯
**识别规则：**
- 涉及 AI 工具名称（Seedance、可灵、即梦、Sora、Runway、Kling等）
- 涉及 AI 技术讨论、工具对比、使用技巧
- 涉及行业动态、竞赛信息
- **⚠️ 引用消息判断：**
  - 引用讨论表示"某人在回应工具话题或补充观点"
  - 回复内容才是真正的观点分享或经验交流
  - 示例：
    ```
    [14:30] 王五: > 赵六 14:25

    我也试过，Seedance 确实好用，但我发现...
    ```
    ✅ 正确：王五在分享自己的使用经验，并回应赵六的观点

**内容结构（500-800字）：**
1. **今日AI焦点**：概括本日群内最重要的AI相关讨论
2. **工具/技术引用**：相关原文引用（blockquote）
3. **趋势判断**：AI对该工具/技术的客观评价（100字）
4. **使用建议**：针对社团学员的具体实践建议（100-150字）
5. 如有相关链接，保留并样式化为胶囊按钮

**今日暂无时：** 填写「今日暂无AI工具相关讨论，可关注行业最新动态。」

---

### 板块六：💬 社群动态
**识别规则：**
- 不属于以上板块的有价值消息
- 新成员加入、节日祝福、互动活动、日常交流精华
- **⚠️ 引用消息判断：**
  - 引用欢迎 = 某人在欢迎新人或回应某人的发言
  - 需要准确记录"谁欢迎了谁"或"谁回应了谁"
  - 示例：
    ```
    [15:20] 小明: > 系统 15:18

    欢迎新同学！✧٩(ˊωˋ*)و✧
    ```
    ✅ 正确：小明在欢迎新成员加入
    ✅ 描述时写：小明、小红等热烈欢迎新同学

**内容结构（400-600字）：**
1. 精选2-3条有代表性的对话或动态（气泡引用格式）
2. 氛围总结：用100-150字描述今日社群整体氛围和活跃度
3. 小编寄语：一句有温度的结语

**今日暂无时：** 填写「今日社群较为安静，大家都在默默耕耘中。」

---

## HTML 输出规范

### 文件命名
```
daily-YYYY-MM-DD.html
例：daily-2026-02-19.html
```

### 页面尺寸
- **固定 16:9 比例**，基准宽度 1600px，高度 900px
- 超出内容可滚动，但首屏必须呈现完整报头 + 三栏预览
- 响应式：屏幕小于1200px时自动转为单栏

### 配色系统（每日轮换）

根据日期的星期几自动选择配色方案，7天7种风格：

| 星期 | 主题名 | 风格描述 |
|---|---|---|
| 一 | 深空蓝 | 科技感、专业、冷静 |
| 二 | 森林绿 | 自然、清新、活力 |
| 三 | 暖阳橙 | 温暖、创意、能量 |
| 四 | 星空紫 | 神秘、优雅、灵感 |
| 五 | 珊瑚红 | 热情、庆祝、周末前奏 |
| 六 | 金沙黄 | 轻松、休闲、阳光 |
| 日 | 玫瑰粉 | 柔和、温馨、放松 |

#### 星期一：深空蓝（Monday Blue）
```css
--bg-primary:    #0a0e14;   /* 深空背景 */
--bg-card:       #11151c;   /* 卡片背景 */
--bg-card-hover: #1a1f2a;   /* 卡片悬停 */
--border:        #2d3748;   /* 边框 */
--text-primary:  #e2e8f0;   /* 主文字 */
--text-secondary:#718096;   /* 次文字 */
--accent-primary:#63b3ed;   /* 天蓝：主强调 */
--accent-red:    #fc8181;   /* 浅红：公告 */
--accent-green:  #68d391;   /* 薄荷绿：荣誉 */
--accent-purple: #b794f4;   /* 淡紫：师说 */
--accent-orange: #f6ad55;   /* 杏橙：AI资讯 */
--accent-yellow: #ecc94b;   /* 金黄：奖牌 */
--gradient-title: linear-gradient(90deg, #63b3ed, #4299e1);
```

#### 星期二：森林绿（Tuesday Green）
```css
--bg-primary:    #0d1512;   /* 深林背景 */
--bg-card:       #141f1a;   /* 卡片背景 */
--bg-card-hover: #1a2922;   /* 卡片悬停 */
--border:        #2d4a3e;   /* 边框 */
--text-primary:  #e6f4ea;   /* 主文字 */
--text-secondary:#81a894;   /* 次文字 */
--accent-primary:#48bb78;   /* 翠绿：主强调 */
--accent-red:    #f687b3;   /* 玫红：公告 */
--accent-green:  #9ae6b4;   /* 浅绿：荣誉 */
--accent-purple: #d6bcfa;   /* 藤紫：师说 */
--accent-orange: #fbd38d;   /* 蜜橙：AI资讯 */
--accent-yellow: #f6e05e;   /* 柠黄：奖牌 */
--gradient-title: linear-gradient(90deg, #48bb78, #38a169);
```

#### 星期三：暖阳橙（Wednesday Orange）
```css
--bg-primary:    #1a1410;   /* 暖棕背景 */
--bg-card:       #231c16;   /* 卡片背景 */
--bg-card-hover: #2d241c;   /* 卡片悬停 */
--border:        #4a3f35;   /* 边框 */
--text-primary:  #faf5f0;   /* 主文字 */
--text-secondary:#a89888;   /* 次文字 */
--accent-primary:#ed8936;   /* 暖橙：主强调 */
--accent-red:    #fc8181;   /* 珊瑚：公告 */
--accent-green:  #68d391;   /* 青绿：荣誉 */
--accent-purple: #d6bcfa;   /* 淡紫：师说 */
--accent-orange: #fbd38d;   /* 杏黄：AI资讯 */
--accent-yellow: #f6e05e;   /* 金黄：奖牌 */
--gradient-title: linear-gradient(90deg, #ed8936, #dd6b20);
```

#### 星期四：星空紫（Thursday Purple）
```css
--bg-primary:    #13111a;   /* 夜紫背景 */
--bg-card:       #1a1725;   /* 卡片背景 */
--bg-card-hover: #231f30;   /* 卡片悬停 */
--border:        #3d3654;   /* 边框 */
--text-primary:  #f0e6fa;   /* 主文字 */
--text-secondary:#9f8fbf;   /* 次文字 */
--accent-primary:#9f7aea;   /* 星紫：主强调 */
--accent-red:    #f687b3;   /* 粉红：公告 */
--accent-green:  #68d391;   /* 翠绿：荣誉 */
--accent-purple: #d6bcfa;   /* 淡紫：师说 */
--accent-orange: #fbd38d;   /* 蜜橙：AI资讯 */
--accent-yellow: #f6e05e;   /* 金黄：奖牌 */
--gradient-title: linear-gradient(90deg, #9f7aea, #805ad5);
```

#### 星期五：珊瑚红（Friday Red）
```css
--bg-primary:    #1a1011;   /* 深红背景 */
--bg-card:       #251618;   /* 卡片背景 */
--bg-card-hover: #301c1f;   /* 卡片悬停 */
--border:        #5c3a3e;   /* 边框 */
--text-primary:  #fef2f2;   /* 主文字 */
--text-secondary:#c9a0a5;   /* 次文字 */
--accent-primary:#f56565;   /* 珊瑚红：主强调 */
--accent-red:    #fc8181;   /* 浅红：公告 */
--accent-green:  #68d391;   /* 翠绿：荣誉 */
--accent-purple: #d6bcfa;   /* 淡紫：师说 */
--accent-orange: #fbd38d;   /* 蜜橙：AI资讯 */
--accent-yellow: #f6e05e;   /* 金黄：奖牌 */
--gradient-title: linear-gradient(90deg, #f56565, #e53e3e);
```

#### 星期六：金沙黄（Saturday Gold）
```css
--bg-primary:    #1a1810;   /* 暖沙背景 */
--bg-card:       #252216;   /* 卡片背景 */
--bg-card-hover: #302c1c;   /* 卡片悬停 */
--border:        #5c5435;   /* 边框 */
--text-primary:  #fefcf2;   /* 主文字 */
--text-secondary:#c9c0a0;   /* 次文字 */
--accent-primary:#ecc94b;   /* 金沙黄：主强调 */
--accent-red:    #fc8181;   /* 浅红：公告 */
--accent-green:  #68d391;   /* 翠绿：荣誉 */
--accent-purple: #d6bcfa;   /* 淡紫：师说 */
--accent-orange: #fbd38d;   /* 蜜橙：AI资讯 */
--accent-yellow: #f6e05e;   /* 亮黄：奖牌 */
--gradient-title: linear-gradient(90deg, #ecc94b, #d69e2e);
```

#### 星期日：玫瑰粉（Sunday Rose）
```css
--bg-primary:    #1a1015;   /* 玫瑰夜背景 */
--bg-card:       #251620;   /* 卡片背景 */
--bg-card-hover: #301c28;   /* 卡片悬停 */
--border:        #5c3a4a;   /* 边框 */
--text-primary:  #fef2f6;   /* 主文字 */
--text-secondary:#c9a0b0;   /* 次文字 */
--accent-primary:#ed64a6;   /* 玫瑰粉：主强调 */
--accent-red:    #f687b3;   /* 浅粉：公告 */
--accent-green:  #68d391;   /* 翠绿：荣誉 */
--accent-purple: #d6bcfa;   /* 淡紫：师说 */
--accent-orange: #fbd38d;   /* 蜜橙：AI资讯 */
--accent-yellow: #f6e05e;   /* 金黄：奖牌 */
--gradient-title: linear-gradient(90deg, #ed64a6, #d53f8c);
```

#### 配色选择规则
生成 HTML 时，根据目标日期的星期几选择对应配色：
- 计算 `dayOfWeek = new Date(targetDate).getDay()`
- 0=星期日, 1=星期一, ..., 6=星期六
- 将对应配色方案的 CSS 变量写入 `:root`

#### 默认配色（兼容旧版）
如无法确定星期，使用星期一「深空蓝」作为默认配色：
```css
--bg-primary:    #0d1117;   /* 深夜蓝黑背景 */
--bg-card:       #161b22;   /* 卡片背景 */
--bg-card-hover: #1c2128;   /* 卡片悬停 */
--border:        #30363d;   /* 边框 */
--text-primary:  #e6edf3;   /* 主文字 */
--text-secondary:#8b949e;   /* 次文字 */
--accent-primary:#58a6ff;   /* 科技蓝：标题、链接 */
--accent-red:    #f78166;   /* 珊瑚红：公告、警示 */
--accent-green:  #3fb950;   /* 活力绿：荣誉、正向 */
--accent-purple: #d2a8ff;   /* 薰衣草紫：师说引用 */
--accent-orange: #ffa657;   /* 暖橙：AI资讯、数据 */
--accent-yellow: #e3b341;   /* 金黄：荣誉奖牌 */
```

### 字体规范（强制，所有报告必须一致）

每次生成 HTML 时，**必须**将以下 CSS 变量写入 `:root`，所有字体大小均从变量取值，禁止在各选择器中硬编码与下表不同的值：

```css
:root {
  /* ===== 字体大小系统 ===== */
  --font-base:        16px;   /* body 基础字号 */
  --font-xs:          14px;   /* 角标、badge、footer、辅助信息 */
  --font-sm:          15px;   /* blockquote、分析框、次级正文 */
  --font-md:          16px;   /* 正文、气泡内容、honor-name */
  --font-lg:          18px;   /* 板块标题（.block-title / .section-title） */
  --font-xl:          21px;   /* 板块标题 icon/emoji */
  --font-2xl:         27px;   /* 荣誉图标、装饰性 emoji */
  --font-3xl:         31px;   /* 报头主标题 (.newspaper-title) */
  --font-data:        23px;   /* AI资讯数字强调 (.ai-data-number) */
}
```

**各元素对应关系（必须遵守）：**

| 元素 | 变量 | 实际值 |
|---|---|---|
| `body` | `--font-base` | 16px |
| `.newspaper-title` | `--font-3xl` | 31px |
| `.issue-info` | `--font-xs` | 14px |
| `.stats-badge` | `--font-xs` | 14px |
| `.header-tagline` | `--font-xs` | 14px |
| `.block-title` / `.section-title` | `--font-lg` | 18px |
| `.block-title .icon` | `--font-xl` | 21px |
| `blockquote` | `--font-sm` | 15px |
| `.chat-bubble` | `--font-md` | 16px |
| `.bubble-sender` / `.chat-sender` | `--font-xs` | 14px |
| `.hot-topic-title` | `--font-lg` | 18px |
| `.analysis-box` | `--font-sm` | 15px |
| `.ai-tool-tag` / `.ai-tool-badge` | `--font-xs` | 14px |
| `.ai-item` | `--font-sm` | 15px |
| `.ai-data-number` / `.ai-highlight` | `--font-data` | 23px |
| `.honor-name` / `.honor-prize` | `--font-md` | 16px |
| `.honor-icon` / `.honor-medal` | `--font-2xl` | 27px |
| `.heat-stats` | `--font-xs` | 14px |
| `.link-pill` | `--font-xs` | 14px |
| `.badge` | `--font-xs` | 14px |
| `.community-speaker` | `--font-xs` | 14px |
| `footer` | `--font-xs` | 14px |

### 文字强调样式（5种，混合使用）
```css
/* 1. 关键词加粗变色 */
.highlight-blue  { color: #58a6ff; font-weight: 700; }
.highlight-red   { color: #f78166; font-weight: 700; }
.highlight-green { color: #3fb950; font-weight: 700; }

/* 2. 重要句子底部色块 */
.bg-highlight { background: rgba(88,166,255,0.12); padding: 2px 6px; border-radius: 3px; }

/* 3. 引用原文 blockquote */
blockquote { border-left: 3px solid var(--accent-purple); padding: 8px 16px; margin: 12px 0; background: rgba(210,168,255,0.06); color: #c9d1d9; font-style: italic; }

/* 4. mark 高亮（各板块不同色） */
mark.blue   { background: rgba(88,166,255,0.25); color: #58a6ff; }
mark.orange { background: rgba(255,166,87,0.25); color: #ffa657; }
mark.green  { background: rgba(63,185,80,0.25);  color: #3fb950; }

/* 5. 链接胶囊按钮 */
.link-pill { display:inline-block; padding:3px 10px; border-radius:20px; border:1px solid #58a6ff; color:#58a6ff; font-size:12px; text-decoration:none; }
```

### 各板块差异化排版

**📢 重要公告**
- 顶部红色警示横条（`background: linear-gradient(90deg, #f78166, #ff9580)`）
- 左侧竖线时间轴（`border-left: 2px solid #f78166`）
- 公告条目用时间轴节点样式

**👨‍🏫 师说**
- 大号引用块，左边框紫色（`border-left: 4px solid #d2a8ff`）
- 发言人名字用圆形头像占位（CSS纯色圆圈 + 首字）
- 背景微渐变：`background: linear-gradient(135deg, #161b22, #1a1f2e)`

**🔥 热议话题**
- 对话气泡样式（左右交替，`border-radius: 18px`）
- 热度 badge（`background: #f78166; border-radius: 12px; padding: 2px 8px`）
- 话题标题用大号字体 + 下划线装饰

**🏆 荣誉时刻**
- 金色奖牌图标（Unicode 🏆 放大 + 金色光晕 `text-shadow`）
- 获奖人名字用金色卡片高亮（`background: rgba(227,179,65,0.15); border: 1px solid #e3b341`）
- 整体暖金色调

**🤖 AI资讯**
- 代码块风格边框（`border: 1px solid #30363d; font-family: monospace`）
- 工具名称用橙色 badge 标签
- 数据/数字用橙色大字体强调

**💬 社群动态**
- 瀑布流小卡片（`column-count: 2`）
- 灰色轻量风格（`background: #161b22; border: 1px solid #21262d`）
- 气泡引用用浅色背景

### HTML 完整结构
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>风变野菩萨AI视频社团A班 · 日报 YYYY-MM-DD</title>
  <style>/* 完整CSS */</style>
</head>
<body>
  <!-- 报头 Header -->
  <header class="newspaper-header">
    <div class="header-top">
      <span class="issue-info">第XXX期 · YYYY年MM月DD日 星期X</span>
      <h1 class="newspaper-title">野菩萨AI社团 · 每日资讯</h1>
      <span class="stats-badge">今日 XX 条消息 · XX 人发言</span>
    </div>
    <div class="header-divider"></div>
  </header>

  <!-- 三栏主体 -->
  <main class="newspaper-grid">
    <!-- 左栏：重要公告 + 荣誉时刻 -->
    <aside class="col-left">
      <section class="block-announcement">...</section>
      <section class="block-honor">...</section>
    </aside>

    <!-- 中栏（最宽）：师说 + 热议话题 -->
    <article class="col-center">
      <section class="block-teacher">...</section>
      <section class="block-hot">...</section>
    </article>

    <!-- 右栏：AI资讯 + 社群动态 -->
    <aside class="col-right">
      <section class="block-ai">...</section>
      <section class="block-community">...</section>
    </aside>
  </main>

  <!-- 页脚 -->
  <footer>
    <p>风变野菩萨AI视频社团A班 · 每日资讯 · 生成时间：YYYY-MM-DD HH:mm:ss</p>
  </footer>
</body>
</html>
```

### 三栏宽度比例
```
左栏 (col-left):   25%
中栏 (col-center): 45%
右栏 (col-right):  28%
间距 (gap):        2%
```

---

## 错误处理策略

| 场景 | 处理方式 |
|---|---|
| chatlog MCP 无法连接 | 报错停止，提示"请确保 chatlog 服务已启动在 5030 端口" |
| 群ID找不到 | 尝试关键词"风变野菩萨"模糊匹配，仍失败则报错 |
| 消息数为0 | 生成空报告框架，所有板块填写「今日暂无」 |
| 某板块内容为空 | 静默填充「今日暂无」，继续生成其他板块 |
| 输出目录不存在 | 自动创建目录 |
| HTML写入失败 | 报错提示具体原因 |

---

## Good Case（正确示例）

**触发：**
```
用户: /daily-digest
```

**执行流程：**
1. ✅ 自动计算昨天日期：2026-02-19
2. ✅ 调用 chatlog MCP 获取消息：共 XXX 条
3. ✅ 写入 raw-2026-02-19.txt
4. ✅ 分析 6 个板块内容
5. ✅ 生成 daily-2026-02-19.html
6. ✅ 更新 manifest.json 索引
7. ✅ 更新 index.html 内嵌数据
8. ✅ git commit & push 到 GitHub
9. ✅ 输出完成信息

**完成输出：**
```
✅ [完成] 日报生成完成！

📁 文件位置：
   - 原始记录：.../DailyNews/raw-2026-02-19.txt
   - 日报HTML：.../DailyNews/daily-2026-02-19.html
   - 索引更新：.../DailyNews/manifest.json

📊 今日数据：
   - 消息总数：XXX 条
   - 发言人数：XX 人
   - 活跃时段：XX:00 - XX:00

🚀 GitHub：已推送 (commit: 📰 日报 2026-02-19 | XXX条消息 · XX人发言)
```

**⚠️ 重要：** 必须输出 `✅ [完成] 日报生成完成！` 或 `✅ 日报已存在` 标记，调度器依赖此标记判断任务成功。

---

### 🔄 Loop 模式自动提示（新增）

**在完成输出后，AI 必须自动检测并输出 Loop 设置提示：**

```
💡 [Loop 提示] 如需每天 00:30 自动执行，请运行：

   /loop "30 0 * * *" /wechat-daily-digest

   说明：cron 格式为"分 时 日 月 周"，30 0 * * * = 每天 00:30
         关闭 Claude Code 后需重新设置
```

**输出规则：**
- **仅在手动触发时输出提示**（用户主动调用 `/wechat-daily-digest`）
- **Loop 运行中不输出提示**（检测到当前已处于 loop 调度中，跳过此提示）
- **提示格式固定**：使用上面的模板，确保用户可以复制命令直接使用
- **固定时间：00:30**（生成昨天的日报，时间刚好）

**检测方法（伪代码）：**
```javascript
// 如果是用户手动调用（而非 loop 调度触发）
if (!isLoopScheduled) {
  output("💡 [Loop 提示] 如需每天 00:30 自动执行，请运行：\n/loop \"30 0 * * *\" /wechat-daily-digest");
}
```

---

## Anti-Patterns（禁止的行为）

❌ **绝对禁止：**

1. ❌ "请问您要分析哪一天的记录？" → 应该默认昨天
2. ❌ "消息比较少，要继续生成吗？" → 应该直接生成空报告
3. ❌ "我已经获取了消息，接下来要分析吗？" → 应该直接继续
4. ❌ "HTML内容比较长，要分段输出吗？" → 应该一次性完整生成
5. ❌ "某板块没有内容，要跳过吗？" → 应该自动填写「今日暂无」
6. ❌ 生成内容少于400字/板块 → 必须达到字数要求，不足时AI主动补充分析

---

## ✅ 完成标准自测（质量保证）

**在输出 `✅ [完成]` 之前，必须进行以下自测：**

### 必须通过的检查项

```
□ TXT文件检查
  □ 文件是否存在？
  □ 是否包含完整聊天记录（不只是统计信息）？
  □ 发言人名称是否使用 senderName（而非wxid）？

□ HTML文件检查
  □ 文件行数是否 > 400 行？（简化版通常 < 200 行）
  □ 是否包含完整的 6 个板块？
    - 📢 重要公告
    - 👨‍🏫 师说
    - 🔥 热议话题
    - 🏆 荣誉时刻
    - 🤖 AI资讯
    - 💬 社群动态
  □ 每个板块是否有 blockquote 引用？（检查原文引用完整性）
  □ 每个板块字数是否在 400-1200 字之间？

□ 内容深度检查
  □ 是否只概括了要点而没有详细展开？→ 不合格
  □ 是否包含完整的对话链引用？→ 必须包含
  □ 是否有 AI 分析结论/延伸解读？→ 必须包含
  □ 热议话题是否有多方观点引用？→ 必须包含
```

### 不合格处理

**如果任何一项未通过：**
1. 标记为失败：`❌ [错误] 质量检查未通过`
2. 指出具体问题
3. 重新生成，直到所有检查项通过

**示例：**
```
❌ [错误] 质量检查未通过：
- 文件行数：185 行（要求 > 400 行）
- 热议话题板块缺少完整对话链引用
正在重新生成...
```

---

## 依赖条件

| 依赖 | 说明 |
|---|---|
| chatlog MCP Server | 必须运行在 `http://127.0.0.1:5030` |
| 微信聊天记录 | 必须已通过 chatlog 解密并索引 |
| MCP 工具 | `query_chat_log`, `query_chat_room`, `current_time` |
| Node.js | 用于文件写入操作 |

---

## 输出目录

```
C:/Users/92860/Desktop/AI编程项目-个人合集/测试ClaudeCode/
```

所有日报文件直接输出到项目根目录。
