Set WshShell = CreateObject("WScript.Shell")
strPath = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)

WshShell.CurrentDirectory = strPath & "\backend"
WshShell.Run "pythonw.exe audio_server.py --bands 16 --mode db", 0, False

WScript.Sleep 1500

WshShell.CurrentDirectory = strPath
WshShell.Run "npx electron frontend\main.js", 0, False
