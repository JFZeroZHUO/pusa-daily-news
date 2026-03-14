#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
微信社群周报生成器 - 消息分析模块
"""

import json
import re
from datetime import datetime
from collections import Counter

# 读取消息数据
with open('C:/Users/92860/Desktop/AI编程项目-个人合集/测试ClaudeCode/weekly-reports/messages.json', 'r', encoding='utf-8') as f:
    messages = json.load(f)

# 消息分类
categories = {
    'highlight': [],    # 本周焦点
    'honor': [],        # 荣誉时刻
    'skill': [] ,       # 技能干货
    '福利': [],         # 福利分享
    'discussion': [],   # 热议话题
    'activity': [],     # 社群活动
}

# 关键词匹配规则
keywords = {
    'highlight': ['公告', '通知', '@全体成员', '重要', '提醒', '截止', ' deadline', '必读', '开课', '课程'],
    'honor': ['获奖 '第一名', '', '优秀',冠军', '恭喜', '祝贺', '作品', '提交', '作业', '采纳', '展示'],
    'skill': ['教程', '技巧', '工具', 'AI视频', 'Sora', 'Midjourney', 'Stable Diffusion', 'Lora', '问题', '解答', '学习', '怎么', '如何'],
    '福利': ['红包', '优惠', '免费', '资源', '送', '福利', '积分', '活动'],
    'activity': ['节日', '春节', '元宵', '欢迎', '新成员', '打卡', '提醒'],
}

# 分析每条消息
text_messages = []
for msg in messages:
    msg_type = msg.get('type')
    if msg_type == 1:  # 文本消息
        content = msg.get('content', '')
        sender = msg.get('senderName') or msg.get('sender', '匿名')
        time = msg.get('time', '')
        text_messages.append({
            'content': content,
            'sender': sender,
            'time': time,
            'msg': msg
        })

# 分类消息
for msg in text_messages:
    content = msg['content']
    sender = msg['sender']
    time = msg['time']

    # 荣誉时刻
    if any(kw in content for kw in ['第一名', '冠军', '恭喜', '祝贺', '采纳', '获奖', '优秀作业']):
        msg['category'] = 'honor'
        categories['honor'].append(msg)
    # 本周焦点
    elif any(kw in content for kw in ['公告', '通知', '@全体', '重要', '提醒', '开课', '截止']):
        msg['category'] = 'highlight'
        categories['highlight'].append(msg)
    # 技能干货
    elif any(kw in content for kw in ['教程', '技巧', '工具', 'AI视频', 'Sora', 'Midjourney', 'Lora', '问题', '怎么', '如何', '#交作业']):
        msg['category'] = 'skill'
        categories['skill'].append(msg)
    # 福利分享
    elif any(kw in content for kw in ['红包', '优惠', '免费', '资源', '送', '福利']):
        msg['category'] = '福利'
        categories['福利'].append(msg)
    # 社群活动
    elif any(kw in content for kw in ['节日', '春节', '元宵', '欢迎', '打卡', '课程']):
        msg['category'] = 'activity'
        categories['activity'].append(msg)
    # 热议话题（长消息，有讨论价值）
    elif len(content) > 30 and ('?' in content or '？' in content or '大家' in content or '觉得' in content):
        msg['category'] = 'discussion'
        categories['discussion'].append(msg)

# 统计信息
total_messages = len(messages)
text_count = len(text_messages)
senders = [msg['sender'] for msg in text_messages if msg['sender']]
sender_counts = Counter(senders)
top_senders = sender_counts.most_common(10)

# 输出分析结果
print(f"总消息数: {total_messages}")
print(f"文本消息数: {text_count}")
print(f"发言人数: {len(sender_counts)}")
print(f"\nTop 10 发言者:")
for sender, count in top_senders:
    print(f"  {sender}: {count} 条")

for cat, msgs in categories.items():
    print(f"\n{cat}: {len(msgs)} 条")

# 保存分类结果
with open('C:/Users/92860/Desktop/AI编程项目-个人合集/测试ClaudeCode/weekly-reports/categorized.json', 'w', encoding='utf-8') as f:
    json.dump({
        'categories': categories,
        'stats': {
            'total': total_messages,
            'text': text_count,
            'senders': len(sender_counts),
            'top_senders': top_senders
        }
    }, f, ensure_ascii=False, indent=2)

print("\n分析完成，已保存到 categorized.json")
