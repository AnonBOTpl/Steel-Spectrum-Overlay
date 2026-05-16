const { app, BrowserWindow, ipcMain, screen, dialog, Menu, Tray, nativeImage, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');

const CONFIG_PATH = path.join(__dirname, '..', 'config.json');

let mainWindow;
let settingsWindow;
let tray;

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
        // Rozsyłamy aktualizację do wszystkich okien
        if (mainWindow) mainWindow.webContents.send('config-updated', config);
        if (settingsWindow) settingsWindow.webContents.send('config-updated', config);
    } catch (err) {
        console.error('Błąd podczas zapisywania config.json:', err);
    }
}

function createTray() {
    const size = 16;
    const buffer = Buffer.alloc(size * size * 4);
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const idx = (y * size + x) * 4;
            const t = x / size;
            buffer[idx]     = Math.round(t * 255);         // R: 0->255
            buffer[idx + 1] = Math.round((1 - t) * 255);  // G: 255->0
            buffer[idx + 2] = 255;                          // B: 255
            buffer[idx + 3] = 255;                          // A: 255
        }
    }
    const trayIcon = nativeImage.createFromBuffer(buffer, {
        width: size,
        height: size,
        scaleFactor: 1.0
    });

    tray = new Tray(trayIcon);
    tray.setToolTip('Steel Spectrum Overlay');
    updateTrayMenu();

    tray.on('click', () => {
        if (mainWindow.isVisible()) mainWindow.hide();
        else mainWindow.show();
    });
}

function updateTrayMenu() {
    if (!tray) return;
    const config = loadConfig();

    const contextMenu = Menu.buildFromTemplate([
        {
            label: mainWindow && mainWindow.isVisible() ? 'Ukryj' : 'Pokaż',
            click: () => mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
        },
        {
            label: 'Ustawienia',
            click: () => createSettingsWindow()
        },
        { type: 'separator' },
        {
            label: 'Click-through',
            type: 'checkbox',
            checked: config.system.clickThrough,
            click: (item) => {
                config.system.clickThrough = item.checked;
                saveConfig(config);
                if (mainWindow) mainWindow.setIgnoreMouseEvents(item.checked, { forward: true });
            }
        },
        {
            label: 'Zawsze na wierzchu',
            type: 'checkbox',
            checked: config.system.alwaysOnTop,
            click: (item) => {
                config.system.alwaysOnTop = item.checked;
                saveConfig(config);
                if (mainWindow) mainWindow.setAlwaysOnTop(item.checked);
            }
        },
        { type: 'separator' },
        { label: 'Zamknij', click: () => {
            app.isQuitting = true;
            app.quit();
        }}
    ]);
    tray.setContextMenu(contextMenu);
}

function createSettingsWindow() {
    if (settingsWindow && !settingsWindow.isDestroyed()) {
        settingsWindow.focus();
        return;
    }

    settingsWindow = new BrowserWindow({
        width: 480,
        height: 650,
        title: 'Steel Spectrum — Ustawienia',
        frame: true,
        transparent: false,
        alwaysOnTop: true,
        resizable: false,
        backgroundColor: '#0a0a0f',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    settingsWindow.loadFile(path.join(__dirname, 'settings.html'));
    settingsWindow.setMenuBarVisibility(false);

    settingsWindow.on('closed', () => {
        settingsWindow = null;
    });
}

function registerShortcuts() {
    globalShortcut.register('Ctrl+Shift+E', () => {
        if (mainWindow.isVisible()) mainWindow.hide();
        else mainWindow.show();
    });

    globalShortcut.register('Ctrl+Shift+M', () => {
        const config = loadConfig();
        config.system.clickThrough = !config.system.clickThrough;
        saveConfig(config);
        if (mainWindow) {
            mainWindow.setIgnoreMouseEvents(config.system.clickThrough, { forward: true });
            mainWindow.webContents.send('config-updated-from-main', { system: { clickThrough: config.system.clickThrough } });
        }
        updateTrayMenu();
    });

    globalShortcut.register('Ctrl+Shift+O', () => {
        if (mainWindow) mainWindow.webContents.send('toggle-oscilloscope-hotkey');
    });
}

function validateWindowPosition(winConfig) {
    if (!winConfig || winConfig.x === null || winConfig.y === null) return null;
    const displays = screen.getAllDisplays();
    const isVisible = displays.some(d => {
        const b = d.bounds;
        return winConfig.x >= b.x && winConfig.x < b.x + b.width && winConfig.y >= b.y && winConfig.y < b.y + b.height;
    });
    return isVisible ? { x: winConfig.x, y: winConfig.y } : null;
}

function createWindow() {
    const config = loadConfig();
    const validatedPos = validateWindowPosition(config.window);

    mainWindow = new BrowserWindow({
        width: config.window.width || 800,
        height: config.window.height || 200,
        x: validatedPos ? validatedPos.x : undefined,
        y: validatedPos ? validatedPos.y : undefined,
        transparent: true,
        frame: false,
        alwaysOnTop: config.system.alwaysOnTop,
        backgroundColor: '#00000000',
        hasShadow: false,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    if (!validatedPos) mainWindow.center();

    Menu.setApplicationMenu(null);

    if (process.platform === 'win32') {
        mainWindow.hookWindowMessage(0x0313, () => {
            mainWindow.setEnabled(false);
            setTimeout(() => mainWindow.setEnabled(true), 100);
            return true;
        });
    }

    mainWindow.webContents.on('context-menu', (e) => {
        e.preventDefault();
        createSettingsWindow();
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    if (config.system.clickThrough) {
        mainWindow.setIgnoreMouseEvents(true, { forward: true });
    }

    mainWindow.on('close', (e) => {
        if (!app.isQuitting) {
            e.preventDefault();
            mainWindow.hide();
        }
    });

    mainWindow.once('ready-to-show', () => {
        mainWindow.setOpacity(0);
        mainWindow.show();
        let opacity = 0;
        const timer = setInterval(() => {
            opacity += 0.1;
            if (opacity >= 1) {
                mainWindow.setOpacity(1);
                clearInterval(timer);
            } else {
                mainWindow.setOpacity(opacity);
            }
        }, 60);

        createTray();
        registerShortcuts();
    });

    let moveTimeout;
    mainWindow.on('move', () => {
        if (moveTimeout) clearTimeout(moveTimeout);
        moveTimeout = setTimeout(() => {
            const currentConfig = loadConfig();
            const [x, y] = mainWindow.getPosition();
            currentConfig.window.x = x;
            currentConfig.window.y = y;
            saveConfig(currentConfig);
        }, 500);
    });
}

app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

ipcMain.on('move-window', (event, { x, y }) => {
    if (mainWindow) mainWindow.setPosition(x, y);
});

ipcMain.on('move-window-relative', (event, { dx, dy }) => {
    if (mainWindow) {
        const [x, y] = mainWindow.getPosition();
        mainWindow.setPosition(x + dx, y + dy);
    }
});

ipcMain.handle('toggle-click-through', (event, ignore) => {
    if (mainWindow) {
        mainWindow.setIgnoreMouseEvents(ignore, { forward: true });
        updateTrayMenu();
        return ignore;
    }
    return false;
});

ipcMain.handle('save-config', (event, config) => {
    saveConfig(config);
    return true;
});

ipcMain.handle('load-config', () => loadConfig());

ipcMain.handle('get-displays', () => {
    return screen.getAllDisplays().map((d, index) => ({
        id: d.id,
        index: index,
        bounds: d.bounds
    }));
});

ipcMain.on('move-to-display', (event, displayIndex) => {
    const displays = screen.getAllDisplays();
    if (displays[displayIndex] && mainWindow) {
        const d = displays[displayIndex];
        const [winWidth, winHeight] = mainWindow.getSize();
        const x = d.bounds.x + Math.floor((d.bounds.width - winWidth) / 2);
        const y = d.bounds.y + Math.floor((d.bounds.height - winHeight) / 2);
        mainWindow.setPosition(x, y);
    }
});

ipcMain.handle('export-theme', async (event, themeData) => {
    const { filePath } = await dialog.showSaveDialog(settingsWindow || mainWindow, {
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
    const { filePaths } = await dialog.showOpenDialog(settingsWindow || mainWindow, {
        title: 'Importuj motyw',
        filters: [{ name: 'JSON', extensions: ['json'] }],
        properties: ['openFile']
    });
    if (filePaths && filePaths.length > 0) {
        return JSON.parse(fs.readFileSync(filePaths[0], 'utf8'));
    }
    return null;
});

ipcMain.on('open-settings-window', () => createSettingsWindow());
