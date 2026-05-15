class Visualizer {
    constructor() {
        this.canvas = document.getElementById('visualizer-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');

        this.config = {
            bandCount: 16,
            sensitivity: 1.5,
            decayFactor: 0.92,
            peakIndicators: true,
            glowIntensity: 15,
            glowSpread: 8,
            barOpacity: 0.9
        };

        this.currentTheme = null;
        this.displayedBands = [];
        this.peaks = [];
        this.peakDecay = 0.99;
        this.barSpacing = 4;

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.canvas.style.willChange = 'transform';
        this.animate();
    }

    updateConfig(newConfig) {
        if (!newConfig) return;

        const oldBandCount = this.config.bandCount;

        if (newConfig.audio) {
            this.config.bandCount = newConfig.audio.bandCount || this.config.bandCount;
            this.config.sensitivity = newConfig.audio.sensitivity || this.config.sensitivity;
            this.config.decayFactor = newConfig.audio.decayFactor || this.config.decayFactor;
            this.config.peakIndicators = newConfig.audio.peakIndicators !== undefined ? newConfig.audio.peakIndicators : this.config.peakIndicators;
        }

        if (newConfig.visuals) {
            this.config.glowIntensity = newConfig.visuals.glowIntensity;
            this.config.glowSpread = newConfig.visuals.glowSpread;
            this.config.barOpacity = newConfig.visuals.barOpacity;

            // Wybór motywu
            if (window.THEMES) {
                const foundTheme = window.THEMES.find(t => t.name === newConfig.visuals.theme);
                if (foundTheme) {
                    this.currentTheme = foundTheme;
                }
            }
        }

        if (oldBandCount !== this.config.bandCount) {
            this.initDataArrays();
        }
    }

    initDataArrays() {
        this.displayedBands = new Array(this.config.bandCount).fill(0);
        this.peaks = new Array(this.config.bandCount).fill(0);
    }

    resize() {
        if (!this.canvas) return;
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = this.canvas.clientWidth * dpr;
        this.canvas.height = this.canvas.clientHeight * dpr;
    }

    updateData(bands) {
        if (!bands || !Array.isArray(bands)) return;

        if (this.displayedBands.length !== this.config.bandCount) {
            this.initDataArrays();
        }

        const count = Math.min(bands.length, this.config.bandCount);
        for (let i = 0; i < count; i++) {
            const rawValue = (bands[i] || 0) * this.config.sensitivity;
            const clampedValue = Math.min(Math.max(rawValue, 0), 1);

            if (clampedValue > this.displayedBands[i]) {
                this.displayedBands[i] = clampedValue;
            } else {
                const df = this.config.decayFactor;
                this.displayedBands[i] = (this.displayedBands[i] * df) + (clampedValue * (1 - df));
            }

            if (this.displayedBands[i] > this.peaks[i]) {
                this.peaks[i] = this.displayedBands[i];
            } else {
                this.peaks[i] = Math.max(0, this.peaks[i] * this.peakDecay);
            }
        }
    }

    draw() {
        if (!this.canvas || !this.ctx) return;
        const { width, height } = this.canvas;
        const ctx = this.ctx;
        const dpr = window.devicePixelRatio || 1;

        ctx.clearRect(0, 0, width, height);

        if (!this.currentTheme && window.THEMES) {
            this.currentTheme = window.THEMES[0];
        }

        const barSpacing = this.barSpacing * dpr;
        const barWidth = (width - (this.config.bandCount - 1) * barSpacing) / this.config.bandCount;
        const cornerRadius = 4 * dpr;

        // Efekty Glow
        if (this.config.glowIntensity > 0) {
            ctx.shadowBlur = this.config.glowSpread * dpr;
            ctx.shadowColor = this.currentTheme ? this.currentTheme.glowColor : '#00ffff';
        } else {
            ctx.shadowBlur = 0;
        }

        for (let i = 0; i < this.config.bandCount; i++) {
            const val = this.displayedBands[i] || 0;
            const barHeight = val * height;
            const x = i * (barWidth + barSpacing);
            const y = height - barHeight;

            if (barHeight < 1) continue;

            // Rysowanie słupka
            const gradient = ctx.createLinearGradient(x, height, x, y);
            if (this.currentTheme && this.currentTheme.barGradient) {
                const colors = this.currentTheme.barGradient;
                colors.forEach((color, idx) => {
                    gradient.addColorStop(idx / (colors.length - 1), color);
                });
            } else {
                gradient.addColorStop(0, '#ff00ff');
                gradient.addColorStop(1, '#00ffff');
            }

            ctx.fillStyle = gradient;
            ctx.globalAlpha = this.config.barOpacity;

            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(x, y, barWidth, barHeight, [cornerRadius, cornerRadius, 0, 0]);
            } else {
                ctx.rect(x, y, barWidth, barHeight);
            }
            ctx.fill();

            // Szczyty
            if (this.config.peakIndicators && this.peaks[i] > 0.01) {
                const peakY = height - (this.peaks[i] * height);
                ctx.shadowBlur = 0; // Wyłączamy glow dla szczytów
                ctx.fillStyle = this.currentTheme ? this.currentTheme.peakColor : '#ffffff';
                ctx.globalAlpha = 1.0;
                ctx.fillRect(x, peakY - (2 * dpr), barWidth, 2 * dpr);

                // Przywracamy glow dla następnego słupka
                if (this.config.glowIntensity > 0) {
                    ctx.shadowBlur = this.config.glowSpread * dpr;
                    ctx.shadowColor = this.currentTheme ? this.currentTheme.glowColor : '#00ffff';
                }
            }
        }
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
    }

    animate() {
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

window.Visualizer = Visualizer;
