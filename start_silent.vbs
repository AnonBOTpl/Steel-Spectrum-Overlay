Set WshShell = CreateObject("WScript.Shell")
strPath = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)

' Uruchom backend w tle używając pythonw
WshShell.CurrentDirectory = strPath & "\backend"
WshShell.Run "pythonw.exe audio_server.py --bands 16", 0, False

' Czekaj na start backendu
WScript.Sleep 1500

' Uruchom frontend w tle
WshShell.CurrentDirectory = strPath
WshShell.Run "npx electron frontend\main.js", 0, False
