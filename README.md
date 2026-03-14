# 风变野菩萨AI视频社团 - 资讯管理系统

一个用于微信社群聊天记录分析、日报生成和周报汇总的自动化工具集。

## 项目概述

本项目包含三个核心模块：

- **DailyNews** - 社群日报生成系统
- **weekly-reports** - 周报/月报汇总展示
- **wechat-scheduler** - 微信消息定时推送工具

## 目录结构

```
.
├── DailyNews/              # 日报生成模块
│   ├── index.html          # 日报中心主页（带侧边栏导航）
│   ├── daily-*.html        # 每日生成的日报文件
│   ├── gen_daily.js        # 日报生成脚本
│   ├── parse-chat-v2.js    # 聊天记录解析工具
│   ├── gen_txt.js          # 文本格式导出
│   ├── manifest.json       # 日报元数据清单
│   └── temp_*.json         # 临时数据文件
│
├── weekly-reports/         # 周报模块
│   ├── index.html          # 周报汇总主页
│   ├── analyze.py          # 数据分析脚本
│   ├── generate_report.py  # 周报生成脚本
│   ├── messages.json       # 消息数据
│   └── weekly-digest-*.html # 周报文件
│
└── wechat-scheduler/       # 定时推送模块
    ├── scheduler.js        # 主调度程序
    ├── ecosystem.config.js # PM2 配置
    ├── dashboard/          # Web 管理面板
    │   ├── server.js       # Express 服务器
    │   ├── public/         # 前端静态资源
    │   ├── routes/         # API 路由
    │   └── services/       # 后端服务
    └── logs/               # 日志目录
```

## 功能特性

### 📰 DailyNews - 日报系统

- 自动解析微信群聊天记录
- 智能提取关键话题和讨论
- 生成精美的 HTML 日报页面
- 侧边栏日历导航，支持按月分组
- 响应式设计，支持移动端
- 键盘快捷键支持（← → Home）

### 📊 Weekly Reports - 周报系统

- 聚合多日聊天数据
- 数据统计与可视化分析
- 生成周报/月报汇总
- 展示社群活跃度、热门话题等

### ⏰ WeChat Scheduler - 定时推送

- 定时发送微信消息
- 支持多种消息类型（文本、图片、链接等）
- **Web 管理面板**：可视化控制台
  - 调度器启动/停止/重启控制
  - 任务历史记录查看
  - 实时日志监控
  - 系统状态监控
- PM2 进程守护
- 完整的日志记录与追踪

## 快速开始

### 环境要求

- Node.js >= 14.x
- Python >= 3.8（用于周报分析）
- PM2（可选，用于进程管理）

### 安装依赖

```bash
# 安装 wechat-scheduler 依赖
cd wechat-scheduler
npm install

# 安装 Python 依赖（用于周报分析）
pip install -r requirements.txt  # 如果有的话
```

### 使用方法

#### 1. 生成日报

```bash
cd DailyNews

# 解析聊天记录并生成日报
node gen_daily.js

# 或者先解析为文本格式
node parse-chat-v2.js <输入JSON> <输出TXT> <日期>
```

**日报生成流程：**
1. 导出微信群聊天记录为 JSON 格式
2. 将 JSON 文件放入 `DailyNews/` 目录
3. 运行 `gen_daily.js` 生成 HTML 日报
4. 打开 `DailyNews/index.html` 查看所有日报

#### 2. 生成周报

```bash
cd weekly-reports

# 分析聊天数据
python analyze.py

# 生成周报
python generate_report.py
```

#### 3. 启动定时推送服务

```bash
cd wechat-scheduler

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入必要配置

# 使用 PM2 启动调度器
pm2 start ecosystem.config.js

# 或直接运行调度器
node scheduler.js
```

#### 4. 启动管理面板

```bash
cd wechat-scheduler/dashboard

# 安装依赖
npm install

# 启动面板服务
npm start

# 或使用 PM2 守护进程
pm2 start server.js --name "dashboard"
```

**访问管理面板：**
```
http://localhost:3000
```

**面板功能：**
- 📊 实时监控调度器状态
- ▶️ 启动/暂停/重启调度器
- 📋 查看任务执行历史
- 📝 实时日志查看
- 🔄 手动触发任务重新生成

## 配置说明

### DailyNews 配置

在 `gen_daily.js` 中配置：

```javascript
// 昵称映射
const nameMap = {
  'wxid_xxx': '昵称',
  // ...
};

// 输入文件路径
const inputFile = 'temp_2026-02-26.json';
```

### WeChat Scheduler 配置

在 `wechat-scheduler/.env` 中配置：

```env
# 微信相关配置
WECHAT_API_URL=your_api_url
WECHAT_TOKEN=your_token

# 推送配置
SCHEDULE_TIME=09:00
TARGET_GROUP=your_group_id
```

## 核心脚本说明

### DailyNews 脚本

| 文件 | 功能 |
|------|------|
| `gen_daily.js` | 主日报生成脚本，读取 JSON 生成 HTML |
| `parse-chat-v2.js` | 聊天记录解析器，支持多种消息类型 |
| `gen_txt.js` | 导出纯文本格式聊天记录 |

### Weekly Reports 脚本

| 文件 | 功能 |
|------|------|
| `analyze.py` | 数据分析，统计发言频率、活跃用户等 |
| `analyze_simple.py` | 简化版分析脚本 |
| `generate_report.py` | 生成周报 HTML 页面 |

### WeChat Scheduler 脚本

| 文件 | 功能 |
|------|------|
| `scheduler.js` | 主调度程序，处理定时任务 |
| `ecosystem.config.js` | PM2 配置文件 |

### Dashboard 管理面板

| 文件/目录 | 功能 |
|------|------|
| `server.js` | Express 服务器入口 |
| `routes/scheduler.js` | 调度器控制 API |
| `routes/tasks.js` | 任务历史 API |
| `routes/digests.js` | 日报管理 API |
| `routes/events.js` | 事件日志 API |
| `services/pm2-service.js` | PM2 进程管理服务 |
| `services/log-parser.js` | 日志解析服务 |
| `public/index.html` | 管理面板前端页面 |

## 数据格式

### 聊天记录 JSON 格式

```json
[
  {
    "time": 1708934400000,
    "senderName": "用户昵称",
    "content": "消息内容",
    "type": 1,
    "subType": 0
  }
]
```

**消息类型：**
- `type: 1` - 文本消息
- `type: 3` - 图片
- `type: 43` - 视频
- `type: 47` - 表情包
- `type: 49` - 链接/文件/引用

### Manifest 格式

```json
{
  "digests": [
    {
      "date": "2026-02-27",
      "file": "daily-2026-02-27.html",
      "title": "日报标题",
      "messageCount": 166,
      "speakerCount": 27
    }
  ]
}
```

## 界面预览

### 日报中心
- 深色主题设计
- 侧边栏日历导航
- 支持收缩/展开
- 移动端适配

### 周报页面
- 卡片式布局
- 渐变色设计
- 统计数据展示

### 管理面板
- 现代化仪表盘设计
- 实时状态监控
- 调度器控制按钮
- 任务历史表格
- 日志查看器
- 响应式布局

## 开发指南

### 添加新的消息类型解析

在 `parse-chat-v2.js` 中添加：

```javascript
else if (m.type === YOUR_TYPE) {
  content = '[自定义类型]';
}
```

### 自定义日报样式

修改 `gen_daily.js` 中的 CSS 模板部分。

### 扩展定时任务

在 `scheduler.js` 中添加新的 cron 任务：

```javascript
cron.schedule('0 9 * * *', () => {
  // 你的任务逻辑
});
```

## 常见问题

**Q: 日报生成失败？**
A: 检查 JSON 文件格式是否正确，确保包含必要字段（time, senderName, content）。

**Q: 定时推送不工作？**
A: 检查 PM2 进程状态 `pm2 status`，查看日志 `pm2 logs scheduler`，或通过管理面板查看实时状态。

**Q: 管理面板无法访问？**
A: 确保 dashboard 服务已启动，检查端口 3000 是否被占用，可通过 `PORT=3001 npm start` 更改端口。

**Q: 如何查看历史任务执行情况？**
A: 访问管理面板的"任务历史"模块，可查看所有任务的执行状态、耗时和日志。

**Q: 如何导出微信聊天记录？**
A: 需要使用第三方工具或微信开发者工具导出群聊数据为 JSON 格式。

## 技术栈

- **前端**: HTML5, CSS3, Vanilla JavaScript
- **后端**: Node.js, Express.js
- **数据分析**: Python
- **进程管理**: PM2
- **定时任务**: node-cron
- **API 服务**: RESTful API

## 注意事项

⚠️ **隐私保护**
- 本项目处理敏感的聊天记录数据
- 请勿将生成的报告公开分享
- 建议在本地环境运行

⚠️ **数据安全**
- 定期备份重要数据
- `.env` 文件不要提交到版本控制
- 生产环境使用 HTTPS

## 许可证

本项目仅供学习和内部使用。

## 贡献

欢迎提交 Issue 和 Pull Request。

## 联系方式

- 项目维护：风变野菩萨AI视频社团A班
- 技术支持：[联系方式]

---

**最后更新**: 2026-02-28
