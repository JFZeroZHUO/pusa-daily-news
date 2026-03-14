#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import re
from collections import Counter

# Read messages
with open('C:/Users/92860/Desktop/AI编程项目-个人合集/测试ClaudeCode/weekly-reports/messages.json', 'r', encoding='utf-8') as f:
    messages = json.load(f)

# Extract text messages
text_messages = []
for msg in messages:
    msg_type = msg.get('type')
    if msg_type == 1:  # Text message
        content = msg.get('content', '')
        sender = msg.get('senderName') or msg.get('sender', 'Anonymous')
        time = msg.get('time', '')
        text_messages.append({
            'content': content,
            'sender': sender,
            'time': time,
            'msg': msg
        })

# Statistics
total_messages = len(messages)
senders = [msg['sender'] for msg in text_messages if msg['sender']]
sender_counts = Counter(senders)
top_senders = sender_counts.most_common(10)

print(f"Total messages: {total_messages}")
print(f"Text messages: {len(text_messages)}")
print(f"Senders: {len(sender_counts)}")
print(f"\nTop 10 senders:")
for sender, count in top_senders:
    print(f"  {sender}: {count}")

# Save for HTML generation
result = {
    'total': total_messages,
    'text_count': len(text_messages),
    'sender_count': len(sender_counts),
    'top_senders': top_senders,
    'messages': text_messages
}

with open('C:/Users/92860/Desktop/AI编程项目-个人合集/测试ClaudeCode/weekly-reports/analyzed.json', 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print("\nAnalysis complete!")
