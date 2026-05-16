Set fso      = CreateObject("Scripting.FileSystemObject")
Set WshShell = CreateObject("WScript.Shell")
strPath = fso.GetParentFolderName(WScript.ScriptFullName)

' Electron sam uruchomi i będzie pilnował backendu (patrz frontend/main.js)
Dim electronCmd
Dim localElectron
localElectron = strPath & "\node_modules\.bin\electron.cmd"

If fso.FileExists(localElectron) Then
    electronCmd = """" & localElectron & """ """ & strPath & """"
Else
    electronCmd = "electron """ & strPath & """"
End If

WshShell.CurrentDirectory = strPath
WshShell.Run electronCmd, 0, False
