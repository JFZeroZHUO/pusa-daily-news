#!/usr/bin/env python3
import json
import sys
import requests
from datetime import datetime, timedelta

def fetch_chatlog(target_date):
    """通过 MCP HTTP API 获取聊天记录"""

    group_id = "43988234971@chatroom"
    time_start = f"{target_date} 00:00:00"
    time_end = f"{target_date} 23:59:59"

    # 尝试方法1: 直接 POST 到 query_chat_log
    url = "http://127.0.0.1:5030/query_chat_log"
    payload = {
        "talker": group_id,
        "time_start": time_start,
        "time_end": time_end,
        "limit": 1000,
        "format": "json"
    }

    print(f"正在获取 {target_date} 的聊天记录...")
    print(f"请求 URL: {url}")
    print(f"请求参数: {json.dumps(payload, ensure_ascii=False, indent=2)}")

    try:
        response = requests.post(url, json=payload, timeout=30)
        print(f"响应状态码: {response.status_code}")
        print(f"响应头: {dict(response.headers)}")

        if response.status_code == 200:
            data = response.json()
            output_file = f"./chatlog_{target_date.replace('-', '')}.json"
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"✅ 成功保存到: {output_file}")
            print(f"消息总数: {len(data)}")
            return data
        else:
            print(f"❌ 请求失败: {response.text}")
            return None

    except Exception as e:
        print(f"❌ 错误: {e}")
        return None

if __name__ == "__main__":
    target_date = sys.argv[1] if len(sys.argv) > 1 else (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
    fetch_chatlog(target_date)
