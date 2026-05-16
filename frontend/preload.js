const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    resizeWindow: (newHeight) => ipcRenderer.send('resize-window', newHeight),
    moveWindow: (x, y) => ipcRenderer.send('move-window', { x, y }),
    moveWindowRelative: (dx, dy) => ipcRenderer.send('move-window-relative', { dx, dy }),
    toggleClickThrough: (ignore) => ipcRenderer.invoke('toggle-click-through', ignore),
    saveConfig: (config) => ipcRenderer.invoke('save-config', config),
    loadConfig: () => ipcRenderer.invoke('load-config'),
    getDisplays: () => ipcRenderer.invoke('get-displays'),
    moveToDisplay: (displayIndex) => ipcRenderer.send('move-to-display', displayIndex),
    exportTheme: (themeData) => ipcRenderer.invoke('export-theme', themeData),
    importTheme: () => ipcRenderer.invoke('import-theme'),

    // Obsługa zdarzeń z Main do Renderer
    onConfigUpdated: (callback) => ipcRenderer.on('config-updated', (event, config) => callback(config)),
    onConfigUpdatedFromMain: (callback) => ipcRenderer.on('config-updated-from-main', (event, data) => callback(data)),
    onOpenSettingsPanel: (callback) => ipcRenderer.on('open-settings-panel', () => callback()),
    onToggleOscilloscopeHotkey: (callback) => ipcRenderer.on('toggle-oscilloscope-hotkey', () => callback())
});
