Set WshShell = CreateObject("WScript.Shell")
strPath = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)

Dim pythonCmd
pythonCmd = "python" ' Domyślny fallback dla debug

On Error Resume Next
If WshShell.Run("py --version", 0, True) = 0 Then
    pythonCmd = "py"
ElseIf WshShell.Run("python --version", 0, True) = 0 Then
    pythonCmd = "python"
End If
On Error GoTo 0

WshShell.CurrentDirectory = strPath & "\backend"
WshShell.Run "cmd /k " & pythonCmd & " audio_server.py --bands 16", 1, False

WshShell.CurrentDirectory = strPath
WshShell.Run "cmd /k npx electron .", 1, False
