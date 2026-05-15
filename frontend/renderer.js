document.addEventListener('DOMContentLoaded', async () => {
    const statusDot = document.getElementById('status-dot');
    const visualizer = new window.Visualizer();
    const settings = new window.SettingsManager(visualizer);

    let socket = null;
    let reconnectTimeout = null;

    function connectWebSocket() {
        if (socket) {
            socket.onopen = null;
            socket.onmessage = null;
            socket.onclose = null;
            socket.onerror = null;
            socket.close();
        }

        console.log('Próba połączenia z ws://127.0.0.1:8765...');
        socket = new WebSocket('ws://127.0.0.1:8765');

        socket.onopen = () => {
            console.log('POŁĄCZONO z backendem audio.');
            statusDot.className = 'connected';
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
                    // Udostępniamy surowe dane dla SettingsManager (sekcja kalibracji)
                    window.lastRawBands = data.bands;
                }
            } catch (err) {
                console.error('Błąd parsowania danych WebSocket:', err);
            }
        };

        socket.onclose = (event) => {
            console.log(`POŁĄCZENIE ZAMKNIĘTE (Kod: ${event.code}). Próba ponownego połączenia za 2s...`);
            statusDot.className = 'disconnected';
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

    // Obsługa zdarzeń IPC z procesu głównego
    window.electronAPI.onConfigUpdated((newConfig) => {
        console.log('Otrzymano aktualizację konfiguracji z procesu głównego');
        visualizer.updateConfig(newConfig);
        settings.config = newConfig;
        settings.applyConfigToUI();
    });

    // Double click -> Toggle Click-Through (na obszarze aplikacji, poza panelem)
    document.addEventListener('dblclick', async (e) => {
        if (e.target.closest('#controls-overlay') || e.target.closest('#settings-panel')) {
            return;
        }

        if (settings.config) {
            const newState = !settings.config.system.clickThrough;
            try {
                const success = await window.electronAPI.toggleClickThrough(newState);
                settings.config.system.clickThrough = success;
                settings.applyConfigToUI();
                window.electronAPI.saveConfig(settings.config);
                console.log(`Tryb click-through: ${success ? 'WŁ' : 'WYŁ'}`);
            } catch (err) {
                console.error('Błąd zmiany trybu click-through:', err);
            }
        }
    });

    // Skróty klawiszowe (Hotkey O)
    document.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'o') {
            if (config && config.visuals) {
                const newState = !config.visuals.oscilloscopeMode;
                config.visuals.oscilloscopeMode = newState;
                visualizer.updateConfig(config);
                settings.applyConfigToUI();
                window.electronAPI.saveConfig(config);
                console.log(`Oscilloscope Mode: ${newState ? 'WŁ' : 'WYŁ'}`);
            }
        }
    });

    // Start połączenia
    connectWebSocket();
});
