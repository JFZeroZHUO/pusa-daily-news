# wechat-daily-digest 配置文件模板
# ===============================
# 使用前请根据你的环境修改以下配置

## 需要修改的配置项

### 1. 群ID (group_id)
# 在 skill.md 中找到这一行，修改为你的群ID：
group_id: "43988234971@chatroom"
# 获取方法：在 chatlog MCP 中查询群名称对应的 ID

### 2. 输出目录 (output_dir)
# 在 skill.md 中找到这一行，修改为你想要的输出目录：
output_dir: "C:/Users/你的用户名/Desktop/AI编程项目-个人合集/测试ClaudeCode/DailyNews/"

### 3. chatlog MCP Server 地址
# 默认：http://127.0.0.1:5030
# 如有不同，需修改 fetch-chatlog.js 中的地址

## skill.md 修改快速定位

# 第81行：group_id
# 第82行：output_dir
# 第226行：文件路径
# 第403行：HTML输出路径
# 第513行：git操作目录
# 第535行：git操作目录

## 快捷修改命令

# Windows PowerShell：
# (Get-Content skill.md) -replace '43988234971@chatroom', '你的群ID' | Set-Content skill.md