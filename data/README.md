# 原始数据目录

此目录用于存储从本地 chatlog API 采集的原始聊天记录数据。

## 文件格式

- `raw-YYYY-MM-DD.json` — 每日聊天记录的 JSON 格式

## 数据结构

```json
[
  {
    "sender": "wxid_xxx",
    "senderName": "用户昵称",
    "time": "HH:MM:SS",
    "content": "消息内容",
    "quotedMsg": null,
    "type": 1
  }
]
```

## 隐私说明

⚠️ 此目录包含完整的聊天记录，建议：
- 使用 private repository
- 或在 `.gitignore` 中排除此目录（但会失去自动触发功能）
