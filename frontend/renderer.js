document.addEventListener('DOMContentLoaded', async () => {
    const visualizer = new window.Visualizer();

    let socket = null;
    let reconnectTimeout = null;

    async function init() {
        try {
            const config = await window.electronAPI.loadConfig();
            if (config) {
                visualizer.updateConfig(config);
                updateClickThroughIndicator(config.system.clickThrough);
            }
        } catch (err) {
            console.error('Błąd inicjalizacji:', err);
        }
        connectWebSocket();
    }

    function connectWebSocket() {
        if (socket) {
            socket.onopen = null;
            socket.onmessage = null;
            socket.onclose = null;
            socket.onerror = null;
            socket.close();
        }

        socket = new WebSocket('ws://127.0.0.1:8765');

        socket.onopen = () => {
            console.log('POŁĄCZONO z backendem audio.');
            if (reconnectTimeout) {
                clearTimeout(reconnectTimeout);
                reconnectTimeout = null;
            }
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data && data.bands) {
                    visualizer.updateData(data.bands);
                }
            } catch (err) {
                console.error('Błąd parsowania danych WebSocket:', err);
            }
        };

        socket.onclose = () => {
            scheduleReconnect();
        };

        socket.onerror = (err) => {
            console.error('BŁĄD WebSocket:', err);
        };
    }

    function scheduleReconnect() {
        if (!reconnectTimeout) {
            reconnectTimeout = setTimeout(() => {
                reconnectTimeout = null;
                connectWebSocket();
            }, 2000);
        }
    }

    function updateClickThroughIndicator(active) {
        const indicator = document.getElementById('click-through-indicator');
        if (indicator) {
            if (active) indicator.classList.remove('hidden');
            else indicator.classList.add('hidden');
        }
    }

    // Obsługa zdarzeń IPC z procesu głównego
    window.electronAPI.onConfigUpdated((newConfig) => {
        visualizer.updateConfig(newConfig);
        updateClickThroughIndicator(newConfig.system.clickThrough);
    });

    window.electronAPI.onConfigUpdatedFromMain((data) => {
        // To zdarzenie przychodzi np. z menu tray
        if (data.system && data.system.clickThrough !== undefined) {
            updateClickThroughIndicator(data.system.clickThrough);
        }
    });

    // Prawy przycisk myszy -> Otwórz okno ustawień
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.electronAPI.openSettingsWindow();
        return false;
    }, true);

    // Obsługa hotkeya oscyloskopu
    window.electronAPI.onToggleOscilloscopeHotkey(() => {
        window.electronAPI.loadConfig().then(config => {
            config.visuals.oscilloscopeMode = !config.visuals.oscilloscopeMode;
            visualizer.updateConfig(config);
            window.electronAPI.saveConfig(config);
        });
    });

    // Tooltip powitalny
    async function checkFirstRun() {
        const config = await window.electronAPI.loadConfig();
        if (!config || config.window.x === null) {
            const tooltip = document.getElementById('welcome-tooltip');
            if (tooltip) tooltip.classList.remove('hidden');
        }
    }
    checkFirstRun();

    // Ręczne przeciąganie okna (Manual Drag)
    let isDragging = false;
    let lastMouseX, lastMouseY;

    document.addEventListener('mousedown', (e) => {
        if (e.button === 0) {
            isDragging = true;
            lastMouseX = e.screenX;
            lastMouseY = e.screenY;
        }
    }, true);

    window.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const dx = e.screenX - lastMouseX;
            const dy = e.screenY - lastMouseY;
            if (dx !== 0 || dy !== 0) {
                window.electronAPI.moveWindowRelative(dx, dy);
                lastMouseX = e.screenX;
                lastMouseY = e.screenY;
            }
        }
    }, true);

    window.addEventListener('mouseup', () => {
        isDragging = false;
    }, true);

    // Double click -> Toggle Click-Through
    document.addEventListener('dblclick', async () => {
        const config = await window.electronAPI.loadConfig();
        if (config) {
            const newState = !config.system.clickThrough;
            const success = await window.electronAPI.toggleClickThrough(newState);
            config.system.clickThrough = success;
            updateClickThroughIndicator(success);
            window.electronAPI.saveConfig(config);
        }
    });

    init();
});
