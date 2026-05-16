const { app, BrowserWindow, ipcMain, screen, dialog, Menu, Tray, nativeImage, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');

const CONFIG_PATH = path.join(__dirname, '..', 'config.json');

let mainWindow;
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
    } catch (err) {
        console.error('Błąd podczas zapisywania config.json:', err);
    }
}

function createTray() {
    let iconPath = path.join(__dirname, 'assets', 'tray-icon.png');
    let trayIcon;

    if (fs.existsSync(iconPath)) {
        trayIcon = nativeImage.createFromPath(iconPath);
    } else {
        // Generowanie placeholdera 16x16 (czysty kwadrat z gradientem)
        const canvas = nativeImage.createEmpty();
        trayIcon = nativeImage.createFromNamedImage('NSStatusAvailable', [16, 16]); // Fallback systemowy lub pusty
        if (trayIcon.isEmpty()) {
             // Tworzymy prosty kolorowy kwadrat jeśli named image nie działa
             const buffer = Buffer.from(
                'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5gMREB0X8W7YVAAAADVJREFUOMtjYKAiYGFgYGBgYDBgYGBgYDBgYGBgYDBgYGBgYDBgYGBgYDBgYGBgYDBgYGBgYAApDwEAl7YdfwAAAABJRU5ErkJggg==',
                'base64'
            );
            trayIcon = nativeImage.createFromBuffer(buffer);
        }
    }

    tray = new Tray(trayIcon.resize({ width: 16, height: 16 }));
    tray.setToolTip('Steel Spectrum Overlay');

    updateTrayMenu();

    tray.on('click', () => {
        if (mainWindow.isVisible()) {
            mainWindow.hide();
        } else {
            mainWindow.show();
        }
    });
}

function updateTrayMenu() {
    if (!tray) return;
    const config = loadConfig();

    const contextMenu = Menu.buildFromTemplate([
        {
            label: mainWindow.isVisible() ? 'Ukryj' : 'Pokaż',
            click: () => mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
        },
        {
            label: 'Ustawienia',
            click: () => {
                mainWindow.show();
                mainWindow.webContents.send('open-settings-panel');
            }
        },
        { type: 'separator' },
        {
            label: 'Click-through',
            type: 'checkbox',
            checked: config.system.clickThrough,
            click: (item) => {
                mainWindow.webContents.send('config-updated-from-main', { system: { clickThrough: item.checked } });
                mainWindow.setIgnoreMouseEvents(item.checked, { forward: true });
            }
        },
        {
            label: 'Zawsze na wierzchu',
            type: 'checkbox',
            checked: config.system.alwaysOnTop,
            click: (item) => {
                mainWindow.setAlwaysOnTop(item.checked);
                mainWindow.webContents.send('config-updated-from-main', { system: { alwaysOnTop: item.checked } });
            }
        },
        { type: 'separator' },
        { label: 'Zamknij', click: () => {
            mainWindow.destroy(); // Pomiń event 'close' aby faktycznie zamknąć
            app.quit();
        }}
    ]);
    tray.setContextMenu(contextMenu);
}

function registerShortcuts() {
    globalShortcut.register('Ctrl+Shift+E', () => {
        if (mainWindow.isVisible()) mainWindow.hide();
        else mainWindow.show();
    });

    globalShortcut.register('Ctrl+Shift+M', () => {
        const config = loadConfig();
        const newState = !config.system.clickThrough;
        mainWindow.setIgnoreMouseEvents(newState, { forward: true });
        mainWindow.webContents.send('config-updated-from-main', { system: { clickThrough: newState } });
        updateTrayMenu();
    });

    globalShortcut.register('Ctrl+Shift+O', () => {
        mainWindow.webContents.send('toggle-oscilloscope-hotkey');
    });
}

function validateWindowPosition(winConfig) {
    if (winConfig.x === null || winConfig.y === null) return null;

    const displays = screen.getAllDisplays();
    const isVisible = displays.some(display => {
        const bounds = display.bounds;
        return (
            winConfig.x >= bounds.x &&
            winConfig.x < bounds.x + bounds.width &&
            winConfig.y >= bounds.y &&
            winConfig.y < bounds.y + bounds.height
        );
    });

    return isVisible ? { x: winConfig.x, y: winConfig.y } : null;
}

function createWindow() {
    const config = loadConfig();
    const { window: winConfig } = config;

    const validatedPos = validateWindowPosition(winConfig);

    mainWindow = new BrowserWindow({
        width: winConfig.width || 800,
        height: winConfig.height || 200,
        x: validatedPos ? validatedPos.x : undefined,
        y: validatedPos ? validatedPos.y : undefined,
        transparent: true,
        frame: false,
        alwaysOnTop: config.system.alwaysOnTop,
        backgroundColor: '#00000000',
        hasShadow: false,
        show: false, // Pokażemy po animacji fade-in
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    if (!validatedPos) {
        mainWindow.center();
    }

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
        mainWindow.webContents.send('open-settings-panel');
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

        // Fade-in animacja
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

    // Debounced save pozycji
    let moveTimeout;
    const savePos = () => {
        if (moveTimeout) clearTimeout(moveTimeout);
        moveTimeout = setTimeout(() => {
            const currentConfig = loadConfig();
            const [x, y] = mainWindow.getPosition();
            const [width, height] = mainWindow.getSize();
            // Wysokość zapisujemy tylko jeśli panel jest zamknięty (podstawowa wysokość widgetu)
            // Ale tutaj upraszczamy: w Task 3 wysokość jest w config.window.height
            currentConfig.window.x = x;
            currentConfig.window.y = y;
            saveConfig(currentConfig);
        }, 500);
    };

    mainWindow.on('move', savePos);
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
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

ipcMain.on('move-window-relative', (event, { dx, dy }) => {
    if (mainWindow) {
        const [x, y] = mainWindow.getPosition();
        mainWindow.setPosition(x + dx, y + dy);
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
