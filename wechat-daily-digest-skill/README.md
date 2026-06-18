# wechat-daily-digest 技能包

自动获取微信群聊天记录，生成报纸风 HTML 日报。

---

## 一、快速安装

### Windows 一键安装

双击运行 `install.bat` 即可自动安装到：
```
C:\Users\<你的用户名>\.claude\skills\wechat-daily-digest\
```

### 手动安装

将以下文件复制到上述目录：
- skill.md
- fetch-chatlog.js
- generate-with-ai.js

---

## 二、前置依赖

### 1. chatlog MCP Server

这是获取微信聊天记录的服务，必须先安装。

项目地址：https://github.com/littleyoyo/chatlog

安装步骤：
```
# 克隆项目
git clone https://github.com/littleyoyo/chatlog.git

# 进入目录
cd chatlog

# 安装依赖
npm install

# 启动服务（默认端口 5030）
node server.js
```

服务启动后访问：http://127.0.0.1:5030/api/v1/time

### 2. 微信版本要求

- 微信 Windows 版本：3.9.0 或以上（支持聊天记录导出）
- 或微信 Mac 版本：6.0 或以上

查看微信版本：点击微信左下角「≡」→ 关于微信

### 3. Node.js

- 要求版本：18.0 或以上
- 下载地址：https://nodejs.org/

---

## 三、配置修改

使用前必须修改 `skill.md` 中的两处配置：

### 1. 修改群ID

在 skill.md 第81行附近找到：
```
group_id: "43988234971@chatroom"
```

修改为你的群ID，例如：
```
group_id: "你的群ID@chatroom"
```

获取群ID的方法：
- 在已运行的 chatlog MCP 中查询
- 或在群详情中查看

### 2. 修改输出目录

在 skill.md 第82行附近找到：
```
output_dir: "C:/Users/92860/Desktop/AI编程项目-个人合集/测试ClaudeCode/DailyNews/"
```

修改为你想要存放日报的目录，例如：
```
output_dir: "D:/DailyNews/"
```

---

## 四、使用方法

### 触发技能

在 Claude Code 中输入：
```
/wechat-daily-digest
```

这会生成昨天的日报。

### 指定日期

生成特定日期的日报：
```
/wechat-daily-digest 2026-05-08
```

### 批量生成

生成日期范围：
```
/wechat-daily-digest 2026-05-01 2026-05-07
```

### 自动执行

每天 00:30 自动生成：
```
/loop "30 0 * * *" /wechat-daily-digest
```

---

## 五、常见问题

### Q: 技能无法触发？

A: 检查两点：
1. 技能文件是否在正确目录
2. 是否已重启 Claude Code

### Q: 提示 "chatlog 服务未启动"？

A: 确保 MCP Server 正在运行：
```
curl http://127.0.0.1:5030/api/v1/time
```
如果返回时间戳，说明服务正常。

### Q: 找不到聊天记录？

A: 确保：
1. 微信版本在 3.9.0 以上
2. 已在 chatlog 中解密并导入聊天记录

---

## 六、技术支持

如有疑问，请检查：
1. Node.js：18+
2. 微信版本：3.9.0+ (Windows) / 6.0+ (Mac)
3. chatlog 服务：运行在 5030 端口

---

版本：1.0 | 作者：littleyoyo | 许可证：MIT