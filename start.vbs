' Skill Manager - 双击此文件启动
Dim WshShell, strCurDir, objExec

Set WshShell = CreateObject("WScript.Shell")
strCurDir = WshShell.CurrentDirectory

' 启动 Node.js 服务器（无命令行窗口）
WshShell.Run "cmd /c cd /d """ & strCurDir & """ && node dist-server\bundle.cjs", 0, False

' 等待服务器启动
WScript.Sleep 2000

' 打开浏览器
WshShell.Run "http://127.0.0.1:3001"
