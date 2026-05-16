class SettingsManager {
    constructor() {
        this.config = null;
        this.saveTimeout = null;
        this.init();
    }

    async init() {
        this.config = await window.electronAPI.loadConfig();

        this.populateThemes();
        this.setupEventListeners();
        this.applyConfigToUI();
        this.initCalibrationGrid();

        // Nasłuchiwanie na aktualizacje konfiguracji z innych okien
        window.electronAPI.onConfigUpdated((newConfig) => {
            this.config = newConfig;
            this.applyConfigToUI();
        });

        this.updateCalibration();
    }

    populateThemes() {
        const select = document.getElementById('theme-select');
        if (!select) return;
        select.innerHTML = '';
        if (window.THEMES) {
            window.THEMES.forEach(theme => {
                const option = document.createElement('option');
                option.value = theme.name;
                option.textContent = theme.name;
                select.appendChild(option);
            });
        }
    }

    setupEventListeners() {
        const inputs = document.querySelectorAll('[data-setting]');
        inputs.forEach(input => {
            const eventType = (input.type === 'checkbox' || input.tagName === 'SELECT' || input.type === 'color') ? 'change' : 'input';

            input.addEventListener(eventType, (e) => {
                const path = input.getAttribute('data-setting');
                let value = input.type === 'checkbox' ? input.checked : input.value;

                if (input.type === 'number' || input.type === 'range') value = parseFloat(value);
                if (path === 'audio.bandCount') value = parseInt(value);

                this.updateSetting(path, value, input);
            });
        });

        // Specjalna obsługa dla kolorów - natychmiastowy preview
        document.querySelectorAll('input[type="color"]').forEach(input => {
            input.addEventListener('input', (e) => {
                const path = input.getAttribute('data-setting');
                this.updateSetting(path, e.target.value, input);
            });
        });

        const moveBtn = document.getElementById('move-display-btn');
        if (moveBtn) {
            moveBtn.addEventListener('click', () => {
                const select = document.getElementById('display-select');
                const displayId = parseInt(select.value);
                this.config.window.displayId = displayId;
                window.electronAPI.moveToDisplay(displayId);
                this.debouncedSave();
            });
        }

        this.loadDisplays();

        document.getElementById('export-theme-btn').addEventListener('click', () => this.exportTheme());
        document.getElementById('import-theme-btn').addEventListener('click', () => this.importTheme());
        document.getElementById('reset-defaults-btn').addEventListener('click', () => this.resetToDefaults());

        const saveCloseBtn = document.getElementById('save-close-btn');
        if (saveCloseBtn) {
            saveCloseBtn.addEventListener('click', () => {
                window.electronAPI.saveConfig(this.config);
                window.close();
            });
        }
    }

    async loadDisplays() {
        const displays = await window.electronAPI.getDisplays();
        const select = document.getElementById('display-select');
        if (!select) return;
        select.innerHTML = '';
        displays.forEach(d => {
            const option = document.createElement('option');
            option.value = d.index;
            if (this.config && this.config.window.displayId === d.index) option.selected = true;
            option.textContent = `Monitor ${d.index + 1} — ${d.bounds.width}×${d.bounds.height}`;
            select.appendChild(option);
        });
    }

    updateSetting(path, value, sourceInput) {
        const parts = path.split('.');
        let current = this.config;
        for (let i = 0; i < parts.length - 1; i++) {
            current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = value;

        if (sourceInput && (sourceInput.type === 'range' || sourceInput.type === 'number')) {
            const other = document.querySelector(`${sourceInput.tagName}[data-setting="${path}"]:not([type="${sourceInput.type}"])`);
            if (other) other.value = value;
        }

        if (path === 'audio.bandCount') this.initCalibrationGrid();

        this.debouncedSave();
    }

    debouncedSave() {
        if (this.saveTimeout) clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
            window.electronAPI.saveConfig(this.config);
        }, 300);
    }

    applyConfigToUI() {
        if (!this.config) return;
        const inputs = document.querySelectorAll('[data-setting]');
        inputs.forEach(input => {
            const path = input.getAttribute('data-setting');
            const parts = path.split('.');
            let value = this.config;
            parts.forEach(part => value = value ? value[part] : null);

            if (value !== null) {
                if (input.type === 'checkbox') input.checked = value;
                else input.value = value;
            }
        });
    }

    initCalibrationGrid() {
        const grid = document.getElementById('calibration-grid');
        if (!grid) return;
        grid.innerHTML = '';
        const count = this.config.audio.bandCount;
        for (let i = 0; i < count; i++) {
            const cell = document.createElement('div');
            cell.className = 'raw-cell';
            cell.innerHTML = `<span class="raw-label">B${i+1}</span><span class="raw-value" id="raw-v-${i}">0.00</span>`;
            grid.appendChild(cell);
        }
    }

    updateCalibration() {
        // Dane pobieramy z procesu głównego lub przez współdzieloną pamięć
        // W tej architekturze settings.html nie ma połączenia WS,
        // więc wartości Raw będą aktualizowane tylko w głównym oknie wizualizatora
        // lub musielibyśmy przesyłać je przez IPC (co obciąża CPU).
        // Zostawiamy puste lub implementujemy przesyłanie co 200ms.
    }

    async exportTheme() {
        const themeData = { name: this.config.visuals.theme, visuals: this.config.visuals };
        await window.electronAPI.exportTheme(themeData);
    }

    async importTheme() {
        const theme = await window.electronAPI.importTheme();
        if (theme) {
            const t = theme.visuals || theme;
            if (t.name && t.barGradient && t.peakColor && t.glowColor && t.backgroundColor) {
                if (!window.THEMES.find(existing => existing.name === t.name)) {
                    window.THEMES.push(t);
                    this.populateThemes();
                }
                Object.assign(this.config.visuals, t);
                this.applyConfigToUI();
                this.debouncedSave();
            }
        }
    }

    async resetToDefaults() {
        const defaults = {
            "version": 1,
            "window": { "x": null, "y": null, "width": 800, "height": 200, "displayId": 0 },
            "audio": { "bandCount": 16, "sensitivity": 1.0, "decayFactor": 0.92, "peakIndicators": true, "mode": "magnitude" },
            "visuals": { "theme": "Neon Cyberpunk", "glowIntensity": 15, "glowSpread": 8, "barOpacity": 0.9, "mirrorMode": false, "oscilloscopeMode": false, "beatDetection": true, "beatThreshold": 0.7 },
            "background": { "enabled": false, "color": "#000000", "opacity": 0.5, "borderRadius": 8 },
            "system": { "clickThrough": false, "alwaysOnTop": true, "startMinimized": false }
        };
        this.config = JSON.parse(JSON.stringify(defaults));
        this.applyConfigToUI();
        window.electronAPI.saveConfig(this.config);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.settingsManager = new SettingsManager();
});
