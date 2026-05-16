class VerticalSlider {
    constructor(track, min, max, step, value, onChange) {
        this.track = track;
        this.fill = track.querySelector('.vslider-fill');
        this.thumb = track.querySelector('.vslider-thumb');
        this.min = min;
        this.max = max;
        this.step = step;
        this.value = value;
        this.onChange = onChange;
        this._dragging = false;

        this._render();
        this._bindEvents();
    }

    _valueToPercent(v) {
        return (v - this.min) / (this.max - this.min);
    }

    _percentToValue(p) {
        const raw = p * (this.max - this.min) + this.min;
        const stepped = Math.round(raw / this.step) * this.step;
        return Math.min(this.max, Math.max(this.min, parseFloat(stepped.toFixed(4))));
    }

    _render() {
        const pct = this._valueToPercent(this.value) * 100;
        this.fill.style.height = `${pct}%`;
        this.thumb.style.bottom = `calc(${pct}% - 6px)`;
    }

    _posToValue(clientY) {
        const rect = this.track.getBoundingClientRect();
        const p = 1 - (clientY - rect.top) / rect.height;
        return this._percentToValue(Math.min(1, Math.max(0, p)));
    }

    _bindEvents() {
        this.track.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this._dragging = true;
            this._update(e.clientY);

            const onMove = (ev) => { if (this._dragging) this._update(ev.clientY); };
            const onUp = () => {
                this._dragging = false;
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
            };
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });

        this.track.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY < 0 ? this.step : -this.step;
            this.setValue(parseFloat((this.value + delta).toFixed(4)));
            this.onChange(this.value);
        }, { passive: false });
    }

    _update(clientY) {
        const newVal = this._posToValue(clientY);
        if (newVal !== this.value) {
            this.value = newVal;
            this._render();
            this.onChange(this.value);
        }
    }

    setValue(v) {
        this.value = Math.min(this.max, Math.max(this.min, v));
        this._render();
    }
}

class SettingsManager {
    constructor() {
        this.config = null;
        this.saveTimeout = null;
        this._sliders = [];
        this.init();
    }

    async init() {
        this.config = await window.electronAPI.loadConfig();

        this.populateThemes();
        this.setupEventListeners();
        this.applyConfigToUI();
        this.initCalibrationGrid();
        this.initBandGainsGrid();

        this.updateCalibration();
        this.initBackendStatus();

        window.electronAPI.onConfigUpdated((newConfig) => {
            this.config = newConfig;
            this.applyConfigToUI();
            this.initBandGainsGrid();
        });
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

        if (path === 'audio.bandCount') {
            this.config.audio.bandGains = new Array(value).fill(1.0);
            this.initCalibrationGrid();
            this.initBandGainsGrid();
        }

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
            cell.innerHTML = `<span class="raw-label">B${i+1}</span><span class="raw-value" id="raw-v-${i}">0.000</span>`;
            grid.appendChild(cell);
        }
    }

    initBandGainsGrid() {
        const grid = document.getElementById('band-gains-grid');
        if (!grid) return;
        grid.innerHTML = '';
        this._sliders = [];

        const count = this.config.audio.bandCount;
        if (!this.config.audio.bandGains || this.config.audio.bandGains.length !== count) {
            this.config.audio.bandGains = new Array(count).fill(1.0);
        }
        const gains = this.config.audio.bandGains;

        for (let i = 0; i < count; i++) {
            const val = gains[i];
            const cell = document.createElement('div');
            cell.className = 'gain-cell';
            cell.innerHTML = `
                <span class="gain-label">B${i + 1}</span>
                <div class="vslider-track" data-band="${i}">
                    <div class="vslider-fill" id="gain-fill-${i}"></div>
                    <div class="vslider-thumb" id="gain-thumb-${i}"></div>
                </div>
                <span class="gain-value" id="gain-v-${i}">${val.toFixed(2)}</span>
            `;
            grid.appendChild(cell);

            const track = cell.querySelector('.vslider-track');
            const slider = new VerticalSlider(track, 0, 2, 0.05, val, (newVal) => {
                this.config.audio.bandGains[i] = newVal;
                const label = document.getElementById(`gain-v-${i}`);
                if (label) {
                    label.textContent = newVal.toFixed(2);
                    label.style.color = newVal > 1.05 ? '#00ff88' : newVal < 0.95 ? '#ff5555' : '#e0e0e0';
                }
                this.debouncedSave();
            });
            this._sliders.push(slider);
        }

        const resetBtn = document.getElementById('reset-gains-btn');
        if (resetBtn) {
            const newBtn = resetBtn.cloneNode(true);
            resetBtn.parentNode.replaceChild(newBtn, resetBtn);
            newBtn.addEventListener('click', () => {
                this.config.audio.bandGains = new Array(count).fill(1.0);
                this._sliders.forEach(s => s.setValue(1.0));
                for (let i = 0; i < count; i++) {
                    const label = document.getElementById(`gain-v-${i}`);
                    if (label) {
                        label.textContent = '1.00';
                        label.style.color = '#e0e0e0';
                    }
                }
                this.debouncedSave();
            });
        }
    }

    updateCalibration() {
        window.electronAPI.onBandDataUpdate((bands) => {
            if (!Array.isArray(bands)) return;
            bands.forEach((val, i) => {
                const el = document.getElementById(`raw-v-${i}`);
                if (el) el.textContent = val.toFixed(3);
            });
        });
    }

    async initBackendStatus() {
        const connected = await window.electronAPI.getBackendStatus();
        this.updateStatusUI(connected);
        window.electronAPI.onBackendStatusChanged((status) => this.updateStatusUI(status));
    }

    updateStatusUI(connected) {
        const dot = document.getElementById('status-dot');
        const text = document.getElementById('status-text');
        if (!dot || !text) return;
        if (connected) {
            dot.className = 'connected';
            text.textContent = 'Backend połączony';
        } else {
            dot.className = 'disconnected';
            text.textContent = 'Brak połączenia z backendem';
        }
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
            "settingsWindow": { "width": 480, "height": 650 },
            "audio": {
                "bandCount": 16,
                "sensitivity": 1.0,
                "decayFactor": 0.92,
                "peakIndicators": true,
                "mode": "magnitude",
                "bandGains": new Array(16).fill(1.0)
            },
            "visuals": {
                "theme": "Neon Cyberpunk",
                "glowIntensity": 15,
                "glowSpread": 8,
                "barOpacity": 0.9,
                "mirrorMode": false,
                "oscilloscopeMode": false,
                "beatDetection": true,
                "beatThreshold": 0.7
            },
            "background": { "enabled": false, "color": "#000000", "opacity": 0.5, "borderRadius": 8 },
            "system": { "clickThrough": false, "alwaysOnTop": true, "startMinimized": false }
        };
        this.config = JSON.parse(JSON.stringify(defaults));
        this.applyConfigToUI();
        this.initBandGainsGrid();
        window.electronAPI.saveConfig(this.config);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.settingsManager = new SettingsManager();
});
