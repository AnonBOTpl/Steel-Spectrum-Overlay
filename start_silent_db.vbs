Set fso = CreateObject("Scripting.FileSystemObject")
Set WshShell = CreateObject("WScript.Shell")
strPath = fso.GetParentFolderName(WScript.ScriptFullName)

Dim pythonCmd
If WshShell.Run("py --version", 0, True) = 0 Then
    pythonCmd = "py"
ElseIf WshShell.Run("python --version", 0, True) = 0 Then
    pythonCmd = "python"
Else
    pythonCmd = "pythonw"
End If

WshShell.CurrentDirectory = strPath & "\backend"
WshShell.Run pythonCmd & " audio_server.py --bands 16 --mode db", 0, False

WScript.Sleep 2000

Dim electronPath
electronPath = strPath & "\node_modules\.bin\electron.cmd"
If fso.FileExists(electronPath) Then
    WshShell.CurrentDirectory = strPath
    WshShell.Run """" & electronPath & """ .", 0, False
Else
    WshShell.CurrentDirectory = strPath
    WshShell.Run "npx electron .", 0, False
End If
