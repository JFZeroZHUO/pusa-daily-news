#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成详细的社群周报/月报
"""

import json
from collections import Counter
from datetime import datetime

# 读取消息
with open('C:/Users/92860/Desktop/AI编程项目-个人合集/测试ClaudeCode/weekly-reports/messages_full.json', 'r', encoding='utf-8') as f:
    messages = json.load(f)

# 只处理文本消息
text_messages = []
for msg in messages:
    if msg.get('type') == 1:  # 文本消息
        content = msg.get('content', '').strip()
        if content:
            sender = msg.get('senderName') or msg.get('sender', '匿名')
            time = msg.get('time', '')
            text_messages.append({
                'content': content,
                'sender': sender,
                'time': time,
                'msg': msg
            })

# 分类消息
categories = {
    'highlight': [],   # 本周焦点
    'honor': [],      # 荣誉时刻
    'skill': [],      # 技能干货
    'welfare': [],   # 福利分享
    'discussion': [], # 热议话题
    'activity': [],   # 社群活动
}

# 关键词匹配
keywords_map = {
    'highlight': ['公告', '通知', '@全体', '重要', '提醒', '截止', '开课', '课程', '报名', '必读', '发布', '新功能', '更新'],
    'honor': ['第一名', '冠军', '恭喜', '祝贺', '获奖', '优秀', '采纳', '作品', '作业', '通过', '成功', '完成'],
    'skill': ['教程', '技巧', '工具', 'AI视频', 'Sora', 'Midjourney', 'Stable Diffusion', 'Lora', '怎么', '如何', '问题', '解答', '学习', '提示词', 'prompt', '即梦', '可灵', '海螺', 'seedan'],
    'welfare': ['红包', '优惠', '免费', '资源', '送', '福利', '积分', '活动', '抽奖', '赠送'],
    'activity': ['节日', '春节', '元宵', '欢迎', '打卡', '社群', '聚会', '分享会', '直播'],
}

for msg in text_messages:
    content = msg['content']
    categorized = False

    # 荣誉时刻 - 优先匹配
    if any(kw in content for kw in ['第一名', '冠军', '恭喜', '祝贺', '采纳', '获奖', '优秀作业', '太棒了', '厉害', '牛']):
        msg['category'] = 'honor'
        categories['honor'].append(msg)
        categorized = True
    # 本周焦点
    elif any(kw in content for kw in keywords_map['highlight']):
        msg['category'] = 'highlight'
        categories['highlight'].append(msg)
        categorized = True
    # 技能干货
    elif any(kw in content for kw in keywords_map['skill']):
        msg['category'] = 'skill'
        categories['skill'].append(msg)
        categorized = True
    # 福利分享
    elif any(kw in content for kw in keywords_map['welfare']):
        msg['category'] = 'welfare'
        categories['welfare'].append(msg)
        categorized = True
    # 社群活动
    elif any(kw in content for kw in keywords_map['activity']):
        msg['category'] = 'activity'
        categories['activity'].append(msg)
        categorized = True
    # 热议话题 - 有讨论价值的长消息
    elif len(content) > 40 and ('?' in content or '？' in content or '大家' in content or '觉得' in content or '认为' in content):
        msg['category'] = 'discussion'
        categories['discussion'].append(msg)
        categorized = True

# 统计
senders = [msg['sender'] for msg in text_messages]
sender_counts = Counter(senders)
top_senders = sender_counts.most_common(20)

# 生成 HTML
html = '''<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>风变野菩萨AI视频社团A班 · 本月资讯 (2026年1月19日 - 2月19日)</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        :root {
            --primary: #2c3e50;
            --accent: #e67e22;
            --accent-light: #f39c12;
            --bg: #fafafa;
            --card-bg: #fff;
            --text: #333;
            --text-light: #666;
            --border: #eee;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', sans-serif;
            background: var(--bg);
            color: var(--text);
            line-height: 1.9;
            padding: 24px;
        }

        .container {
            max-width: 820px;
            margin: 0 auto;
            background: var(--card-bg);
            border-radius: 16px;
            box-shadow: 0 4px 40px rgba(0,0,0,0.08);
            overflow: hidden;
        }

        /* Header */
        header {
            background: linear-gradient(135deg, var(--primary) 0%, #34495e 50%, var(--accent) 100%);
            color: #fff;
            padding: 56px 40px;
            position: relative;
            overflow: hidden;
        }

        header::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -20%;
            width: 400px;
            height: 400px;
            background: rgba(255,255,255,0.1);
            border-radius: 50%;
        }

        header::after {
            content: '';
            position: absolute;
            bottom: -30%;
            left: -10%;
            width: 300px;
            height: 300px;
            background: rgba(255,255,255,0.05);
            border-radius: 50%;
        }

        header h1 {
            font-size: 32px;
            font-weight: 800;
            margin-bottom: 16px;
            position: relative;
            z-index: 1;
            letter-spacing: 2px;
        }

        header .subtitle {
            font-size: 18px;
            opacity: 0.95;
            position: relative;
            z-index: 1;
        }

        header time {
            display: inline-block;
            margin-top: 16px;
            padding: 8px 20px;
            background: rgba(255,255,255,0.2);
            border-radius: 24px;
            font-size: 15px;
            position: relative;
            z-index: 1;
        }

        /* Main Content */
        main { padding: 40px; }

        section {
            margin-bottom: 52px;
        }

        section:last-child { margin-bottom: 0; }

        section h2 {
            font-size: 24px;
            color: var(--primary);
            padding-bottom: 14px;
            border-bottom: 3px solid var(--accent);
            margin-bottom: 28px;
            display: flex;
            align-items: center;
            gap: 12px;
            font-weight: 700;
        }

        section h2 .icon {
            font-size: 28px;
        }

        /* Cards */
        .card {
            background: linear-gradient(135deg, #f8f9fa 0%, #fff 100%);
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 20px;
            border: 1px solid var(--border);
            transition: all 0.3s ease;
            position: relative;
        }

        .card:hover {
            box-shadow: 0 8px 24px rgba(0,0,0,0.08);
            transform: translateY(-2px);
        }

        .card::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 4px;
            background: var(--accent);
            border-radius: 12px 0 0 12px;
        }

        .card .meta {
            display: flex;
            align-items: center;
            margin-bottom: 14px;
            flex-wrap: wrap;
            gap: 8px;
        }

        .card .sender {
            font-size: 15px;
            color: var(--accent);
            font-weight: 600;
            background: rgba(230, 126, 34, 0.1);
            padding: 4px 14px;
            border-radius: 16px;
        }

        .card .time {
            font-size: 13px;
            color: #999;
        }

        .card .quote {
            background: #fff;
            border-radius: 8px;
            padding: 18px 20px;
            margin: 14px 0;
            color: #444;
            font-size: 15px;
            line-height: 1.8;
            border-left: 3px solid #ddd;
            position: relative;
        }

        .card .quote::before {
            content: '"';
            position: absolute;
            top: 8px;
            left: 12px;
            font-size: 32px;
            color: #ddd;
            font-family: Georgia, serif;
        }

        .card .analysis {
            color: var(--text-light);
            font-size: 14px;
            line-height: 1.8;
            padding-left: 12px;
            border-left: 2px solid var(--accent-light);
        }

        /* Stats Section */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 32px;
        }

        .stat-card {
            background: linear-gradient(135deg, var(--primary) 0%, #34495e 100%);
            border-radius: 12px;
            padding: 28px 20px;
            text-align: center;
            color: #fff;
        }

        .stat-card .number {
            font-size: 42px;
            font-weight: 800;
            display: block;
            background: linear-gradient(135deg, #fff 0%, var(--accent-light) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .stat-card .label {
            font-size: 14px;
            opacity: 0.9;
            margin-top: 8px;
        }

        .top-senders {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 20px;
        }

        .sender-tag {
            background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
            border: 1px solid var(--accent);
            border-radius: 20px;
            padding: 8px 18px;
            font-size: 14px;
            color: var(--accent);
            font-weight: 500;
            transition: all 0.3s ease;
        }

        .sender-tag:hover {
            background: var(--accent);
            color: #fff;
        }

        /* Section-specific accents */
        #highlight .card::before { background: #e74c3c; }
        #honor .card::before { background: #f1c40f; }
        #skill .card::before { background: #3498db; }
        #welfare .card::before { background: #9b59b6; }
        #discussion .card::before { background: #1abc9c; }
        #activity .card::before { background: #e67e22; }

        /* Footer */
        footer {
            background: var(--primary);
            color: #fff;
            text-align: center;
            padding: 32px;
        }

        footer p {
            opacity: 0.8;
            font-size: 14px;
        }

        footer .brand {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 8px;
            opacity: 1;
        }

        /* Responsive */
        @media (max-width: 768px) {
            .stats-grid {
                grid-template-columns: repeat(2, 1fr);
            }
            header {
                padding: 40px 24px;
            }
            header h1 {
                font-size: 24px;
            }
            main {
                padding: 24px;
            }
            .card {
                padding: 18px;
            }
        }

        @media (max-width: 480px) {
            .stats-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>风变野菩萨AI视频社团A班 · 本月资讯</h1>
            <p class="subtitle">让每一位社员都不错过社群的重要价值</p>
            <time>2026年1月19日 - 2月19日</time>
        </header>

        <main>
            <!-- 统计数据 -->
            <section id="stats">
                <h2><span class="icon">📊</span> 一月数据</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <span class="number">''' + str(len(messages)) + '''</span>
                        <span class="label">消息总数</span>
                    </div>
                    <div class="stat-card">
                        <span class="number">''' + str(len(text_messages)) + '''</span>
                        <span class="label">文本消息</span>
                    </div>
                    <div class="stat-card">
                        <span class="number">''' + str(len(sender_counts)) + '''</span>
                        <span class="label">发言人数</span>
                    </div>
                    <div class="stat-card">
                        <span class="number">''' + str(sum(1 for c in text_messages if len(c['content']) > 30)) + '''</span>
                        <span class="label">高质量讨论</span>
                    </div>
                </div>
                <div class="card">
                    <h3 style="margin-bottom: 16px; color: var(--primary);">👥 活跃社员榜 TOP 20</h3>
                    <div class="top-senders">
'''

for sender, count in top_senders:
    html += f'                        <span class="sender-tag">{sender} ({count}条)</span>\n'

html += '''                    </div>
                </div>
            </section>

            <!-- 本月焦点 -->
            <section id="highlight">
                <h2><span class="icon">🔥</span> 本月焦点</h2>
'''

# 本月焦点内容
highlight_msgs = categories['highlight'][:15]
if highlight_msgs:
    for msg in highlight_msgs:
        content = msg['content'][:200] + ('...' if len(msg['content']) > 200 else '')
        sender = msg['sender']
        time = msg['time'][:10] if msg['time'] else ''
        html += f'''                <div class="card">
                    <div class="meta">
                        <span class="sender">{sender}</span>
                        <span class="time">{time}</span>
                    </div>
                    <div class="quote">{content}</div>
                    <div class="analysis">本月重要通知与公告，社员需密切关注。</div>
                </div>
'''
else:
    html += '''                <div class="card">
                    <div class="analysis">本月暂无重要公告通知。</div>
                </div>
'''

# 荣誉时刻
html += '''            </section>

            <!-- 荣誉时刻 -->
            <section id="honor">
                <h2><span class="icon">🏆</span> 荣誉时刻</h2>
'''

honor_msgs = categories['honor'][:20]
if honor_msgs:
    for msg in honor_msgs:
        content = msg['content'][:200] + ('...' if len(msg['content']) > 200 else '')
        sender = msg['sender']
        time = msg['time'][:10] if msg['time'] else ''
        html += f'''                <div class="card">
                    <div class="meta">
                        <span class="sender">{sender}</span>
                        <span class="time">{time}</span>
                    </div>
                    <div class="quote">{content}</div>
                    <div class="analysis">学员成就展示，恭喜获得荣誉的同学们！</div>
                </div>
'''
else:
    html += '''                <div class="card">
                    <div class="analysis">本月暂无荣誉记录。</div>
                </div>
'''

# 技能干货
html += '''            </section>

            <!-- 技能干货 -->
            <section id="skill">
                <h2><span class="icon">📚</span> 技能干货</h2>
'''

skill_msgs = categories['skill'][:25]
if skill_msgs:
    for msg in skill_msgs:
        content = msg['content'][:250] + ('...' if len(msg['content']) > 250 else '')
        sender = msg['sender']
        time = msg['time'][:10] if msg['time'] else ''
        html += f'''                <div class="card">
                    <div class="meta">
                        <span class="sender">{sender}</span>
                        <span class="time">{time}</span>
                    </div>
                    <div class="quote">{content}</div>
                    <div class="analysis">AI视频制作技巧、工具使用心得、学习经验分享。</div>
                </div>
'''
else:
    html += '''                <div class="card">
                    <div class="analysis">本月暂无技能讨论记录。</div>
                </div>
'''

# 福利分享
html += '''            </section>

            <!-- 福利分享 -->
            <section id="welfare">
                <h2><span class="icon">🎁</span> 福利分享</h2>
'''

welfare_msgs = categories['welfare'][:15]
if welfare_msgs:
    for msg in welfare_msgs:
        content = msg['content'][:200] + ('...' if len(msg['content']) > 200 else '')
        sender = msg['sender']
        time = msg['time'][:10] if msg['time'] else ''
        html += f'''                <div class="card">
                    <div class="meta">
                        <span class="sender">{sender}</span>
                        <span class="time">{time}</span>
                    </div>
                    <div class="quote">{content}</div>
                    <div class="analysis">社群福利、资源分享、红包雨等活动信息。</div>
                </div>
'''
else:
    html += '''                <div class="card">
                    <div class="analysis">本月暂无福利分享记录。</div>
                </div>
'''

# 热议话题
html += '''            </section>

            <!-- 热议话题 -->
            <section id="discussion">
                <h2><span class="icon">💬</span> 热议话题</h2>
'''

discussion_msgs = categories['discussion'][:25]
if discussion_msgs:
    for msg in discussion_msgs:
        content = msg['content'][:280] + ('...' if len(msg['content']) > 280 else '')
        sender = msg['sender']
        time = msg['time'][:10] if msg['time'] else ''
        html += f'''                <div class="card">
                    <div class="meta">
                        <span class="sender">{sender}</span>
                        <span class="time">{time}</span>
                    </div>
                    <div class="quote">{content}</div>
                    <div class="analysis">引发社员热烈讨论的话题，碰撞思维火花。</div>
                </div>
'''
else:
    html += '''                <div class="card">
                    <div class="analysis">本月暂无引发热议的话题。</div>
                </div>
'''

# 社群活动
html += '''            </section>

            <!-- 社群活动 -->
            <section id="activity">
                <h2><span class="icon">🎉</span> 社群活动</h2>
'''

activity_msgs = categories['activity'][:15]
if activity_msgs:
    for msg in activity_msgs:
        content = msg['content'][:200] + ('...' if len(msg['content']) > 200 else '')
        sender = msg['sender']
        time = msg['time'][:10] if msg['time'] else ''
        html += f'''                <div class="card">
                    <div class="meta">
                        <span class="sender">{sender}</span>
                        <span class="time">{time}</span>
                    </div>
                    <div class="quote">{content}</div>
                    <div class="analysis">社群互动、活动通知、节日祝福等精彩瞬间。</div>
                </div>
'''
else:
    html += '''                <div class="card">
                    <div class="analysis">本月暂无社群活动记录。</div>
                </div>
'''

html += '''            </section>
        </main>

        <footer>
            <p class="brand">风变野菩萨AI视频社团A班 · 资讯中心</p>
            <p>生成时间：2026年2月19日 | 每月更新，让价值流动</p>
        </footer>
    </div>
</body>
</html>'''

# 保存
with open('C:/Users/92860/Desktop/AI编程项目-个人合集/测试ClaudeCode/weekly-reports/weekly-digest-2026-01-19-2026-02-19.html', 'w', encoding='utf-8') as f:
    f.write(html)

print(f"生成完成！")
print(f"- 总消息: {len(messages)}")
print(f"- 文本消息: {len(text_messages)}")
print(f"- 发言人数: {len(sender_counts)}")
print(f"- 本月焦点: {len(categories['highlight'])}")
print(f"- 荣誉时刻: {len(categories['honor'])}")
print(f"- 技能干货: {len(categories['skill'])}")
print(f"- 福利分享: {len(categories['welfare'])}")
print(f"- 热议话题: {len(categories['discussion'])}")
print(f"- 社群活动: {len(categories['activity'])}")
