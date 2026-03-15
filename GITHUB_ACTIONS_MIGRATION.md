# GitHub Actions 迁移方案

## 📋 方案概述

**最终方案：本地完整生成 + GitHub 托管**

由于第三方 API 服务商限制了 GitHub Actions 的 IP 访问，改为本地执行所有操作：
- **本地脚本**：采集数据 + 调用 Claude API + 生成日报 + 推送到 GitHub
- **GitHub**：仅作为代码和日报文件的托管平台

---

## 🚀 使用方法（超简单）

### 每天一键生成日报

```bash
cd "C:/Users/92860/Desktop/AI编程项目-个人合集/测试ClaudeCode"
node .github/scripts/generate-all-local.js
```

**就这么简单！** 脚本会自动：
1. 调用本地 chatlog API 获取昨天的聊天记录
2. 调用 Claude API 分析生成日报
3. 生成 HTML 文件
4. 自动 commit + push 到 GitHub

### 生成指定日期的日报

```bash
node .github/scripts/generate-all-local.js 2026-03-13
```

---

## 🔐 环境变量配置（可选）

脚本已内置 API 配置，无需额外设置。如果需要修改，可以设置环境变量：

```bash
# Windows (PowerShell)
$env:ANTHROPIC_API_KEY="your_key"
$env:ANTHROPIC_BASE_URL="https://api.uucode.org"
$env:ANTHROPIC_MODEL_ID="claude-opus-4-5-20251101"

# Linux/Mac
export ANTHROPIC_API_KEY="your_key"
export ANTHROPIC_BASE_URL="https://api.uucode.org"
export ANTHROPIC_MODEL_ID="claude-opus-4-5-20251101"
```

---

## 📁 文件结构

```
测试ClaudeCode/
├── .github/
│   ├── workflows/
│   │   └── generate-daily-digest.yml    # GitHub Actions 工作流
│   └── scripts/
│       ├── collect-data-local.js        # 本地数据采集脚本
│       └── generate-digest-cloud.js     # 云端日报生成脚本
├── data/
│   └── raw-YYYY-MM-DD.json              # 采集的原始数据（自动生成）
└── DailyNews/
    ├── daily-YYYY-MM-DD.html            # 生成的日报（自动生成）
    └── raw-YYYY-MM-DD.txt               # 原始记录（自动生成）
```

---

## 🚀 使用流程

### 方式 1：本地采集 + 自动触发（推荐）

**每天执行一次：**

```bash
# 在本地运行（采集昨天的数据）
node .github/scripts/collect-data-local.js

# 或指定日期
node .github/scripts/collect-data-local.js 2026-03-13
```

**执行流程：**
1. 脚本调用本地 chatlog API 获取消息
2. 保存为 `data/raw-YYYY-MM-DD.json`
3. 自动 git commit + push
4. GitHub Actions 检测到 `data/` 目录变化，自动触发
5. 云端调用 Claude API 生成日报
6. 自动提交 HTML 文件到仓库

### 方式 2：手动触发（仅云端生成）

**前提**：已经有 `data/raw-YYYY-MM-DD.json` 文件

1. 打开 GitHub 仓库页面
2. 进入 `Actions` 标签
3. 选择 `Generate Daily Digest` workflow
4. 点击 `Run workflow`
5. 输入日期（可选，留空则使用昨天）
6. 点击 `Run workflow` 确认

---

## 🔄 定时自动化（可选）

### 方案 A：Windows 任务计划程序

1. 打开"任务计划程序"
2. 创建基本任务
3. 触发器：每天早上 9:00
4. 操作：启动程序
   - 程序：`node`
   - 参数：`C:\Users\92860\Desktop\AI编程项目-个人合集\测试ClaudeCode\.github\scripts\collect-data-local.js`
   - 起始于：`C:\Users\92860\Desktop\AI编程项目-个人合集\测试ClaudeCode`

### 方案 B：cron (Linux/Mac)

```bash
# 编辑 crontab
crontab -e

# 添加定时任务（每天早上 9:00 执行）
0 9 * * * cd /path/to/测试ClaudeCode && node .github/scripts/collect-data-local.js
```

---

## 📊 API 调用说明

### 本地 chatlog API
- **地址**：`http://127.0.0.1:5030`
- **端点**：`/api/v1/chatlog`
- **参数**：
  - `talker`: 群ID（`43988234971@chatroom`）
  - `time`: 日期（`YYYY-MM-DD`）
  - `limit`: 消息数量（默认 1000）

### Claude API (第三方代理)
- **API 地址**：`https://api.uucode.org`
- **模型**：`claude-opus-4-5-20251101`
- **用途**：分析聊天记录，生成 6 个板块内容
- **Token 消耗**：约 4000-8000 tokens/次
- **费用**：根据第三方服务商定价

---

## ⚠️ 注意事项

1. **本地 chatlog API 必须运行**
   - 采集脚本依赖本地服务
   - 确保 `http://127.0.0.1:5030` 可访问

2. **数据隐私**
   - 原始 JSON 包含完整聊天记录
   - 建议使用 **private repository**
   - 或在 `.gitignore` 中排除 `data/` 目录（但会失去自动触发功能）

3. **Git 配置**
   - 确保本地 Git 已配置用户名和邮箱
   - 确保有仓库的 push 权限

4. **GitHub Actions 限制**
   - 免费账户：2000 分钟/月
   - 每次执行约 2-3 分钟
   - 足够每天运行一次

---

## 🐛 故障排查

### 本地采集失败

```bash
# 检查 chatlog API
curl http://127.0.0.1:5030/api/v1/chatroom

# 检查 Node.js 版本
node --version  # 需要 >= 14

# 手动测试脚本
node .github/scripts/collect-data-local.js 2026-03-13
```

### GitHub Actions 失败

1. 检查 Actions 日志：`Actions` 标签 → 点击失败的 workflow
2. 常见问题：
   - `ANTHROPIC_API_KEY` 未配置
   - 数据文件不存在（检查 `data/` 目录）
   - API 配额用尽

### 生成的日报为空

- 检查 `data/raw-YYYY-MM-DD.json` 是否有数据
- 检查日期是否正确（群聊是否有消息）
- 检查 Claude API 响应（查看 Actions 日志）

---

## 📈 后续优化建议

1. **批量生成**：修改脚本支持日期范围
2. **增量更新**：只采集新消息，避免重复
3. **通知推送**：生成完成后发送邮件/Webhook 通知
4. **数据备份**：定期备份 `data/` 目录到云存储
5. **成本优化**：使用 Haiku 模型降低 API 费用

---

## 📞 技术支持

- **Anthropic API 文档**：https://docs.anthropic.com/
- **GitHub Actions 文档**：https://docs.github.com/actions
- **问题反馈**：在仓库创建 Issue
