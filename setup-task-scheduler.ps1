# 微信群日报 - Windows 任务计划程序自动配置脚本
# 以管理员身份运行此脚本

$TaskName = "微信群日报自动生成"
$NodePath = (Get-Command node -ErrorAction SilentlyContinue).Source
$ScriptPath = "C:\Users\92860\Desktop\AI编程项目-个人合集\测试ClaudeCode\.github\scripts\daily-runner.js"
$WorkDir = "C:\Users\92860\Desktop\AI编程项目-个人合集\测试ClaudeCode"
$LogDir = "C:\Users\92860\Desktop\AI编程项目-个人合集\测试ClaudeCode\logs"

if (-not $NodePath) {
    Write-Host "未找到 Node.js，请先安装 Node.js" -ForegroundColor Red
    exit 1
}
Write-Host "Node.js 路径：$NodePath" -ForegroundColor Green

if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
    Write-Host "已创建日志目录：$LogDir" -ForegroundColor Green
}

if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host "已删除旧任务" -ForegroundColor Yellow
}

$Action = New-ScheduledTaskAction -Execute $NodePath -Argument "`"$ScriptPath`"" -WorkingDirectory $WorkDir

$TriggerBoot = New-ScheduledTaskTrigger -AtStartup
$TriggerBoot.Delay = "PT2M"

$TriggerDaily = New-ScheduledTaskTrigger -Daily -At "09:00"

$Settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Hours 3) -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 5) -StartWhenAvailable -DontStopOnIdleEnd

$Principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType S4U -RunLevel Highest

Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger @($TriggerBoot, $TriggerDaily) -Settings $Settings -Principal $Principal -Description "开机后自动检测 chatlog 服务，生成微信群日报并推送到 GitHub" -Force

Write-Host ""
Write-Host "任务计划程序配置完成！" -ForegroundColor Green
Write-Host "任务名称：$TaskName" -ForegroundColor Cyan
Write-Host "触发时机：开机后2分钟 + 每天09:00" -ForegroundColor Cyan
Write-Host "日志文件：$LogDir\daily-runner.log" -ForegroundColor Cyan
Write-Host ""
Write-Host "立即测试命令：" -ForegroundColor Yellow
Write-Host "  Start-ScheduledTask -TaskName '$TaskName'" -ForegroundColor White
