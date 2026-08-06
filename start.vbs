' Skill Manager - 双击此文件启动（无窗口静默模式）
Dim WshShell, strCurDir

Set WshShell = CreateObject("WScript.Shell")
strCurDir = WshShell.CurrentDirectory

' 检查 node 是否安装
If WshShell.Run("where node", 0, True) <> 0 Then
    MsgBox "未检测到 Node.js，请先安装 https://nodejs.org/", vbCritical, "Skill Manager"
    WScript.Quit 1
End If

' 检查依赖，缺失则自动安装
If Not FsoFileExists(strCurDir & "\node_modules") Then
    WshShell.Run "cmd /c cd /d """ & strCurDir & """ && npm install", 0, True
End If

' 检查前端构建产物，缺失则自动构建
If Not FsoFileExists(strCurDir & "\dist") Then
    WshShell.Run "cmd /c cd /d """ & strCurDir & """ && npm run build", 0, True
End If

' 启动服务器（无命令行窗口）
WshShell.Run "cmd /c cd /d """ & strCurDir & """ && npm run dev:server", 0, False

' 等待服务器启动
WScript.Sleep 2000

' 打开浏览器
WshShell.Run "http://127.0.0.1:3001"

' 辅助函数：检测目录是否存在
Function FsoFileExists(strPath)
    Dim fso
    Set fso = CreateObject("Scripting.FileSystemObject")
    FsoFileExists = fso.FolderExists(strPath) Or fso.FileExists(strPath)
    Set fso = Nothing
End Function
