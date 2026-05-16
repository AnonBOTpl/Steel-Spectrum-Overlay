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
    openSettingsWindow: () => ipcRenderer.send('open-settings-window'),

    // Status backendu
    reportBackendStatus: (connected) => ipcRenderer.send('report-backend-status', connected),
    getBackendStatus: () => ipcRenderer.invoke('get-backend-status'),
    onBackendStatusChanged: (callback) => ipcRenderer.on('backend-status-changed', (event, status) => callback(status)),

    // Dane pasm
    sendBandData: (bands) => ipcRenderer.send('band-data-update', bands),
    onBandDataUpdate: (callback) => ipcRenderer.on('band-data-update', (event, bands) => callback(bands)),

    // Obsługa zdarzeń z Main do Renderer
    onConfigUpdated: (callback) => ipcRenderer.on('config-updated', (event, config) => callback(config)),
    onConfigUpdatedFromMain: (callback) => ipcRenderer.on('config-updated-from-main', (event, data) => callback(data)),
    onOpenSettingsPanel: (callback) => ipcRenderer.on('open-settings-panel', () => callback()),
    onToggleOscilloscopeHotkey: (callback) => ipcRenderer.on('toggle-oscilloscope-hotkey', () => callback())
});
