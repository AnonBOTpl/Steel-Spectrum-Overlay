const { app, BrowserWindow, ipcMain, screen, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const CONFIG_PATH = path.join(__dirname, '..', 'config.json');

let mainWindow;

function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_PATH)) {
            const data = fs.readFileSync(CONFIG_PATH, 'utf8');
            return JSON.parse(data);
        }
    } catch (err) {
        console.error('Błąd podczas wczytywania config.json:', err);
    }
    return null;
}

function saveConfig(config) {
    try {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    } catch (err) {
        console.error('Błąd podczas zapisywania config.json:', err);
    }
}

function createWindow() {
    const config = loadConfig();
    const { window: winConfig } = config;

    mainWindow = new BrowserWindow({
        width: winConfig.width || 800,
        height: winConfig.height || 200,
        x: winConfig.x,
        y: winConfig.y,
        transparent: true,
        frame: false,
        alwaysOnTop: config.system.alwaysOnTop,
        backgroundColor: '#00000000',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    if (winConfig.x === null || winConfig.y === null) {
        mainWindow.center();
    }

    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    // Obsługa trybu click-through przy starcie
    if (config.system.clickThrough) {
        mainWindow.setIgnoreMouseEvents(true, { forward: true });
    }

    // mainWindow.webContents.openDevTools(); // Odkomentować do debugowania
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

// Obsługa zdarzeń IPC
ipcMain.on('resize-window', (event, newHeight) => {
    if (mainWindow) {
        const [width] = mainWindow.getSize();
        mainWindow.setSize(width, newHeight);
    }
});

ipcMain.on('move-window', (event, { x, y }) => {
    if (mainWindow) {
        mainWindow.setPosition(x, y);
    }
});

ipcMain.handle('toggle-click-through', (event, ignore) => {
    if (mainWindow) {
        mainWindow.setIgnoreMouseEvents(ignore, { forward: true });
        return ignore;
    }
    return false;
});

ipcMain.handle('save-config', (event, config) => {
    saveConfig(config);
    return true;
});

ipcMain.handle('load-config', () => {
    return loadConfig();
});

ipcMain.handle('get-displays', () => {
    return screen.getAllDisplays().map((d, index) => ({
        id: d.id,
        index: index,
        bounds: d.bounds
    }));
});

ipcMain.on('move-to-display', (event, displayIndex) => {
    const displays = screen.getAllDisplays();
    if (displays[displayIndex]) {
        const targetDisplay = displays[displayIndex];
        const { x, y, width, height } = targetDisplay.bounds;

        // Wyśrodkuj okno na nowym monitorze
        const [winWidth, winHeight] = mainWindow.getSize();
        const newX = x + Math.floor((width - winWidth) / 2);
        const newY = y + Math.floor((height - winHeight) / 2);

        mainWindow.setPosition(newX, newY);
    }
});

ipcMain.handle('export-theme', async (event, themeData) => {
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
        title: 'Eksportuj motyw',
        defaultPath: 'theme.json',
        filters: [{ name: 'JSON', extensions: ['json'] }]
    });

    if (filePath) {
        fs.writeFileSync(filePath, JSON.stringify(themeData, null, 2));
        return true;
    }
    return false;
});

ipcMain.handle('import-theme', async () => {
    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
        title: 'Importuj motyw',
        filters: [{ name: 'JSON', extensions: ['json'] }],
        properties: ['openFile']
    });

    if (filePaths && filePaths.length > 0) {
        const data = fs.readFileSync(filePaths[0], 'utf8');
        return JSON.parse(data);
    }
    return null;
});
