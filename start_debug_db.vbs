Set WshShell = CreateObject("WScript.Shell")
strPath = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)

WshShell.CurrentDirectory = strPath & "\backend"
WshShell.Run "cmd /k python audio_server.py --bands 16 --mode db", 1, False

WshShell.CurrentDirectory = strPath
WshShell.Run "cmd /k npx electron .", 1, False
