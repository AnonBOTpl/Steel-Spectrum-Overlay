Set fso = CreateObject("Scripting.FileSystemObject")
Set WshShell = CreateObject("WScript.Shell")
strPath = fso.GetParentFolderName(WScript.ScriptFullName)

' Znajdź python — próbuj py launcher (Windows), potem python, potem pythonw
Dim pythonCmd
pythonCmd = "pythonw" ' Domyślny fallback

On Error Resume Next
If WshShell.Run("py --version", 0, True) = 0 Then
    pythonCmd = "py"
ElseIf WshShell.Run("python --version", 0, True) = 0 Then
    pythonCmd = "python"
End If
On Error GoTo 0

' Uruchom backend w tle (okno=0, nie czekaj)
WshShell.CurrentDirectory = strPath & "\backend"
WshShell.Run pythonCmd & " audio_server.py --bands 16", 0, False

' Czekaj na start backendu (websocket potrzebuje chwili)
WScript.Sleep 2000

' Uruchom frontend — użyj lokalnego electron z node_modules
Dim electronPath
electronPath = strPath & "\node_modules\.bin\electron.cmd"
If fso.FileExists(electronPath) Then
    WshShell.CurrentDirectory = strPath
    WshShell.Run """" & electronPath & """ .", 0, False
Else
    ' Fallback do npx jeśli lokalny electron nie istnieje
    WshShell.CurrentDirectory = strPath
    WshShell.Run "npx electron .", 0, False
End If
