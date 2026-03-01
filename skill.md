# 日报生成 HTML 输出规范

> 本文件定义新建日报 HTML 的必要模板元素，供 Claude Code / AI 助手生成新日报时参照。

---

## 必需结构

### 1. `<html>` 根元素
必须包含 `data-theme="dark"` 属性（默认深色），以支持主题切换：

```html
<html lang="zh-CN" data-theme="dark">
```

---

### 2. CSS 变量（`:root`）
必须声明以下 6 个背景/文字 CSS 变量，以确保亮色主题覆盖生效：

```css
:root {
  --bg-primary:    <深色背景值>;
  --bg-card:       <卡片深色背景值>;
  --bg-card-hover: <卡片悬浮深色背景值>;
  --border:        <边框深色值>;
  --text-primary:  <主文字深色值>;
  --text-secondary:<次文字深色值>;
  /* accent 色根据当日配色主题设置 */
}
```

---

### 3. 亮色主题 CSS 覆盖（必须包含，放在 `</style>` 前）

```css
/* ── 主题切换按钮 ── */
.theme-toggle {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 2px solid var(--border);
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  padding: 0;
  line-height: 1;
}
.theme-toggle:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
}
/* ── 亮色主题变量覆盖 ── */
[data-theme="light"] {
  --bg-primary:    #f5f3ee;
  --bg-card:       #ffffff;
  --bg-card-hover: #edeae0;
  --border:        #d4cfc0;
  --text-primary:  #1e1b14;
  --text-secondary:#6b6555;
}
[data-theme="light"] blockquote {
  background: rgba(0,0,0,0.04);
  color: #3a3525;
}
[data-theme="light"] .analysis-box {
  background: rgba(0,0,0,0.04);
  color: #3a3525;
}
[data-theme="light"] .newspaper-header {
  background: linear-gradient(135deg, #f0ede2, #f7f5ee);
}
[data-theme="light"] .block-teacher {
  background: linear-gradient(135deg, #f0ede2, #edeae0);
}
```

---

### 4. 主题切换按钮 HTML（放在 `</header>` 前）

```html
<button class="theme-toggle" id="themeToggle" onclick="toggleTheme()" title="切换亮色/暗色主题">☀️</button>
```

> 按钮图标含义：☀️ = 当前深色（点击切换亮色）；🌙 = 当前亮色（点击切换深色）

---

### 5. 主题切换 JavaScript（放在 `</body>` 前，独立 `<script>` 块）

```html
<script>
  /* ── 主题切换 ── */
  (function () {
    const saved = localStorage.getItem('pusa-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    document.addEventListener('DOMContentLoaded', function () {
      const btn = document.getElementById('themeToggle');
      if (btn) btn.textContent = saved === 'dark' ? '☀️' : '🌙';
    });
  })();
  function toggleTheme() {
    const html = document.documentElement;
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('pusa-theme', next);
    const btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = next === 'dark' ? '☀️' : '🌙';
  }
</script>
```

**localStorage key**：`pusa-theme`（所有页面统一，浏览器记忆主题偏好）

---

## 注意事项

- **accent 颜色**（蓝/绿/橙/紫/金）在亮色背景下保持不变，无需覆盖。
- 若日报中有硬编码深色背景的 class（如 `.block-teacher`），需在亮色覆盖块中单独处理。
- `index.html` 额外需要在 `toggleTheme()` 中同步 iframe：
  ```javascript
  const iframe = document.querySelector('#iframeContainer iframe');
  if (iframe && iframe.contentDocument) {
    try {
      iframe.contentDocument.documentElement.setAttribute('data-theme', next);
    } catch(e) {}
  }
  ```
  以及在 `iframe.onload` 中同步：
  ```javascript
  const currentTheme = document.documentElement.getAttribute('data-theme');
  try {
    iframe.contentDocument.documentElement.setAttribute('data-theme', currentTheme);
  } catch(e) {}
  ```
