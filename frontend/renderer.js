document.addEventListener('DOMContentLoaded', async () => {
    const statusDot = document.getElementById('status-dot');
    const visualizer = new window.Visualizer();

    let config = null;
    let socket = null;
    let reconnectTimeout = null;

    // Wczytanie konfiguracji przy starcie
    async function init() {
        config = await window.electronAPI.loadConfig();
        if (config) {
            visualizer.updateConfig(config);
        }
        connectWebSocket();
    }

    function connectWebSocket() {
        if (socket) {
            socket.close();
        }

        socket = new WebSocket('ws://localhost:8765');

        socket.onopen = () => {
            console.log('Połączono z backendem audio.');
            statusDot.className = 'connected';
            if (reconnectTimeout) {
                clearTimeout(reconnectTimeout);
                reconnectTimeout = null;
            }
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.bands) {
                    visualizer.updateData(data.bands);
                }
            } catch (err) {
                console.error('Błąd parsowania danych WebSocket:', err);
            }
        };

        socket.onclose = () => {
            console.log('Rozłączono z backendem. Próba ponownego połączenia...');
            statusDot.className = 'disconnected';
            scheduleReconnect();
        };

        socket.onerror = (err) => {
            console.error('Błąd WebSocket:', err);
            socket.close();
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

    // Obsługa interakcji
    const controlsOverlay = document.getElementById('controls-overlay');

    // Double click -> Toggle Click-Through
    document.addEventListener('dblclick', async () => {
        if (config) {
            const newState = !config.system.clickThrough;
            const success = await window.electronAPI.toggleClickThrough(newState);
            if (success !== undefined) {
                config.system.clickThrough = success;
                window.electronAPI.saveConfig(config);
                console.log(`Tryb click-through: ${success ? 'WŁ' : 'WYŁ'}`);
            }
        }
    });

    // Ikona ustawień (placeholder dla Task 3)
    const settingsTrigger = document.getElementById('settings-trigger');
    settingsTrigger.addEventListener('click', () => {
        console.log('Otwieranie panelu ustawień (Task 3)');
    });

    init();
});
