@echo off
chcp 65001 >nul 2>&1
title wechat-daily-digest 技能安装程序

echo ========================================
echo   wechat-daily-digest 技能安装程序
echo ========================================
echo.

:: 检查 Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 Node.js，请先安装 Node.js 18+
    echo 下载地址：https://nodejs.org/
    pause
    exit /b 1
)

echo [✓] Node.js 已安装

:: 创建技能目录
set SKILL_DIR=%USERPROFILE%\.claude\skills\wechat-daily-digest

if not exist "%SKILL_DIR%" (
    echo [创建] 技能目录...
    mkdir "%SKILL_DIR%"
)

:: 复制文件
echo [复制] 技能文件...
copy /Y "%~dp0skill.md" "%SKILL_DIR%\" >nul
copy /Y "%~dp0fetch-chatlog.js" "%SKILL_DIR%\" >nul
copy /Y "%~dp0generate-with-ai.js" "%SKILL_DIR%\" >nul

if %errorlevel% equ 0 (
    echo [✓] 技能文件已安装到 %SKILL_DIR%
) else (
    echo [错误] 文件复制失败，请以管理员身份运行
    pause
    exit /b 1
)

echo.
echo ========================================
echo   安装完成！
echo ========================================
echo.
echo 技能目录：%SKILL_DIR%
echo.
echo 使用方法：
echo   /wechat-daily-digest     生成昨日日报
echo   /wechat-daily-digest 2026-05-08  生成指定日期日报
echo.
echo 提示：请确保 chatlog MCP Server 已在 5030 端口运行
echo.
pause