Set fso      = CreateObject("Scripting.FileSystemObject")
Set WshShell = CreateObject("WScript.Shell")
strPath = fso.GetParentFolderName(WScript.ScriptFullName)

Dim electronCmd
Dim localElectron
localElectron = strPath & "\node_modules\.bin\electron.cmd"

If fso.FileExists(localElectron) Then
    electronCmd = """" & localElectron & """ """ & strPath & """ --mode db"
Else
    electronCmd = "electron """ & strPath & """ --mode db"
End If

WshShell.CurrentDirectory = strPath
WshShell.Run "cmd /k " & electronCmd, 1, False
