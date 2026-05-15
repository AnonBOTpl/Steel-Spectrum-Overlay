class SettingsManager {
    constructor(visualizer) {
        this.visualizer = visualizer;
        this.config = null;
        this.isOpen = false;
        this.panelHeight = 320;

        this.panel = document.getElementById('settings-panel');
        this.trigger = document.getElementById('settings-trigger');
        this.appContainer = document.getElementById('app-container');

        this.saveTimeout = null;

        this.init();
    }

    async init() {
        this.config = await window.electronAPI.loadConfig();

        this.populateThemes();
        this.setupEventListeners();
        this.applyConfigToUI();
        this.initCalibrationGrid();

        // Start pętli kalibracji
        this.updateCalibration();
    }

    populateThemes() {
        const select = document.getElementById('theme-select');
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
        // Automatyczna synchronizacja kontrolek
        const inputs = document.querySelectorAll('[data-setting]');
        inputs.forEach(input => {
            const eventType = input.type === 'checkbox' || input.tagName === 'SELECT' ? 'change' : 'input';

            input.addEventListener(eventType, (e) => {
                const path = input.getAttribute('data-setting');
                let value = input.type === 'checkbox' ? input.checked : input.value;

                // Konwersja typów
                if (input.type === 'number' || input.type === 'range') {
                    value = parseFloat(value);
                }
                if (path === 'audio.bandCount') {
                    value = parseInt(value);
                }

                this.updateSetting(path, value, input);
            });
        });

        // Obsługa monitorów
        const moveBtn = document.getElementById('move-display-btn');
        moveBtn.addEventListener('click', () => {
            const select = document.getElementById('display-select');
            window.electronAPI.moveToDisplay(parseInt(select.value));
        });

        this.loadDisplays();

        // Przyciski akcji
        document.getElementById('export-theme-btn').addEventListener('click', () => this.exportTheme());
        document.getElementById('import-theme-btn').addEventListener('click', () => this.importTheme());
        document.getElementById('reset-defaults-btn').addEventListener('click', () => this.resetToDefaults());
    }

    async loadDisplays() {
        const displays = await window.electronAPI.getDisplays();
        const select = document.getElementById('display-select');
        select.innerHTML = '';
        displays.forEach(d => {
            const option = document.createElement('option');
            option.value = d.index;
            option.textContent = `Monitor ${d.index + 1} — ${d.bounds.width}×${d.bounds.height}`;
            select.appendChild(option);
        });
    }

    togglePanel() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.panel.classList.remove('hidden');
            const totalHeight = (this.config.window.height || 200) + this.panelHeight;
            window.electronAPI.resizeWindow(totalHeight);
        } else {
            this.panel.classList.add('hidden');
            window.electronAPI.resizeWindow(this.config.window.height || 200);
        }
    }

    updateSetting(path, value, sourceInput) {
        // Aktualizacja obiektu config
        const parts = path.split('.');
        let current = this.config;
        for (let i = 0; i < parts.length - 1; i++) {
            current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = value;

        // Synchronizacja bliźniaczej kontrolki (range <-> number)
        if (sourceInput && (sourceInput.type === 'range' || sourceInput.type === 'number')) {
            const other = document.querySelector(`${sourceInput.tagName}[data-setting="${path}"]:not([type="${sourceInput.type}"])`);
            if (other) other.value = value;
        }

        // Specjalna obsługa zmiany wysokości widgetu
        if (path === 'window.height') {
            const totalHeight = value + (this.isOpen ? this.panelHeight : 0);
            window.electronAPI.resizeWindow(totalHeight);
            // Visualizer zareaguje przez event resize na oknie
        }

        // Specjalna obsługa zmiany liczby pasm
        if (path === 'audio.bandCount') {
            this.initCalibrationGrid();
        }

        // Live preview w wizualizatorze
        this.visualizer.updateConfig(this.config);

        // Debounced save
        this.debouncedSave();
    }

    debouncedSave() {
        if (this.saveTimeout) clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
            window.electronAPI.saveConfig(this.config);
            console.log('Config saved');
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
                if (input.type === 'checkbox') {
                    input.checked = value;
                } else {
                    input.value = value;
                }
            }
        });
    }

    initCalibrationGrid() {
        const grid = document.getElementById('calibration-grid');
        grid.innerHTML = '';
        const count = this.config.audio.bandCount;

        // Dostosowanie kolumn gridu
        grid.style.gridTemplateColumns = `repeat(${count <= 16 ? 8 : 8}, 1fr)`;

        for (let i = 0; i < count; i++) {
            const cell = document.createElement('div');
            cell.className = 'raw-cell';
            cell.innerHTML = `
                <span class="raw-label">B${i+1}</span>
                <span class="raw-value" id="raw-v-${i}">0.00</span>
            `;
            grid.appendChild(cell);
        }
    }

    updateCalibration() {
        if (this.isOpen && window.lastRawBands) {
            const bands = window.lastRawBands;
            for (let i = 0; i < bands.length; i++) {
                const el = document.getElementById(`raw-v-${i}`);
                if (el) {
                    el.textContent = bands[i].toFixed(2);
                }
            }
        }
        // Używamy requestIdleCallback dla wydajności (Task 3 requirement)
        if (window.requestIdleCallback) {
            window.requestIdleCallback(() => {
                setTimeout(() => this.updateCalibration(), 100);
            });
        } else {
            setTimeout(() => this.updateCalibration(), 100);
        }
    }

    async exportTheme() {
        const themeData = {
            name: this.config.visuals.theme,
            visuals: this.config.visuals
        };
        await window.electronAPI.exportTheme(themeData);
    }

    async importTheme() {
        const theme = await window.electronAPI.importTheme();
        if (theme) {
            // Walidacja pól motywu
            const t = theme.visuals || theme;
            if (t.name && t.barGradient && t.peakColor && t.glowColor && t.backgroundColor) {
                // Dodaj do listy THEMES jeśli jeszcze go nie ma (po nazwie)
                if (!window.THEMES.find(existing => existing.name === t.name)) {
                    window.THEMES.push({
                        name: t.name,
                        barGradient: t.barGradient,
                        peakColor: t.peakColor,
                        glowColor: t.glowColor,
                        backgroundColor: t.backgroundColor
                    });
                    this.populateThemes();
                }

                Object.assign(this.config.visuals, t);
                this.applyConfigToUI();
                this.visualizer.updateConfig(this.config);
                this.debouncedSave();
                console.log(`Zaimportowano motyw: ${t.name}`);
            } else {
                console.error('Nieprawidłowy format pliku motywu.');
            }
        }
    }

    async resetToDefaults() {
        const defaults = {
            "version": 1,
            "window": { "x": null, "y": null, "width": 800, "height": 200, "displayId": 0 },
            "audio": { "bandCount": 16, "sensitivity": 1.5, "decayFactor": 0.92, "peakIndicators": true },
            "visuals": { "theme": "Neon Cyberpunk", "glowIntensity": 15, "glowSpread": 8, "barOpacity": 0.9, "mirrorMode": false, "oscilloscopeMode": false, "beatDetection": true, "beatThreshold": 0.7 },
            "system": { "clickThrough": false, "alwaysOnTop": true, "startMinimized": false }
        };
        this.config = JSON.parse(JSON.stringify(defaults));
        this.applyConfigToUI();
        this.visualizer.updateConfig(this.config);

        if (this.isOpen) {
            window.electronAPI.resizeWindow(this.config.window.height + this.panelHeight);
        } else {
            window.electronAPI.resizeWindow(this.config.window.height);
        }

        window.electronAPI.saveConfig(this.config);
    }
}

window.SettingsManager = SettingsManager;
