class Visualizer {
    constructor() {
        this.canvas = document.getElementById('visualizer-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');

        this.config = {
            bandCount: 16,
            sensitivity: 1.0,
            decayFactor: 0.92,
            peakIndicators: true,
            glowIntensity: 15,
            glowSpread: 8,
            barOpacity: 0.9,
            mirrorMode: false,
            oscilloscopeMode: false,
            beatDetection: true,
            beatThreshold: 0.7,
            background: { enabled: false, color: "#000000", opacity: 0.5, borderRadius: 8 },
            bandGains: []
        };

        this.currentTheme = null;
        this.targetBands = [];
        this.displayedBands = [];
        this.peaks = [];
        this.peakDecay = 0.992;
        this.barSpacing = 4;

        this.bandCorrection = [];
        this.initDataArrays();
        this.initBandCorrection();

        this.lastBeatTime = 0;
        this.isBeatActive = false;
        this.beatDuration = 80;
        this.beatCooldown = 200;
        this.lastUpdateTime = 0;

        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.canvas.style.willChange = 'transform';
        this.animate();
    }

    initBandCorrection() {
        this.bandCorrection = new Array(this.config.bandCount).fill(0).map((_, i) => {
            const t = i / (this.config.bandCount - 1 || 1);
            return 1.0 + t * 1.5;
        });
    }

    updateConfig(newConfig) {
        if (!newConfig) return;
        const oldBandCount = this.config.bandCount;

        if (newConfig.audio) {
            // Zmiana || na ?? dla obsługi wartości 0
            this.config.bandCount = newConfig.audio.bandCount ?? this.config.bandCount;
            this.config.sensitivity = newConfig.audio.sensitivity ?? this.config.sensitivity;
            this.config.decayFactor = newConfig.audio.decayFactor ?? this.config.decayFactor;
            this.config.peakIndicators = newConfig.audio.peakIndicators !== undefined ? newConfig.audio.peakIndicators : this.config.peakIndicators;

            if (Array.isArray(newConfig.audio.bandGains)) {
                this.config.bandGains = [...newConfig.audio.bandGains];
            }
        }

        if (newConfig.visuals) {
            this.config.glowIntensity = newConfig.visuals.glowIntensity;
            this.config.glowSpread = newConfig.visuals.glowSpread;
            this.config.barOpacity = newConfig.visuals.barOpacity;
            this.config.mirrorMode = newConfig.visuals.mirrorMode;
            this.config.oscilloscopeMode = newConfig.visuals.oscilloscopeMode;
            this.config.beatDetection = newConfig.visuals.beatDetection;
            this.config.beatThreshold = newConfig.visuals.beatThreshold;
            if (window.getTheme) this.currentTheme = window.getTheme(newConfig.visuals.theme);
        }

        if (newConfig.background) {
            this.config.background = { ...newConfig.background };
        }

        if (oldBandCount !== this.config.bandCount) {
            this.initDataArrays();
            this.initBandCorrection();
        }
    }

    initDataArrays() {
        const count = this.config.bandCount;
        this.targetBands = new Array(count).fill(0);
        this.displayedBands = new Array(count).fill(0);
        this.peaks = new Array(count).fill(0);

        // Inicjalizacja gainów jeśli brak
        if (!this.config.bandGains || this.config.bandGains.length !== count) {
            this.config.bandGains = new Array(count).fill(1.0);
        }
    }

    resize() {
        if (!this.canvas) return;
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = this.canvas.clientWidth * dpr;
        this.canvas.height = this.canvas.clientHeight * dpr;
    }

    updateData(bands) {
        if (!bands || !Array.isArray(bands)) return;
        this.lastUpdateTime = Date.now();
        if (this.displayedBands.length !== this.config.bandCount) this.initDataArrays();

        const count = Math.min(bands.length, this.config.bandCount);
        for (let i = 0; i < count; i++) {
            const gain = (this.config.bandGains && this.config.bandGains[i] !== undefined) ? this.config.bandGains[i] : 1.0;
            const rawValue = (bands[i] || 0) * this.config.sensitivity * (this.bandCorrection[i] || 1) * gain;
            this.targetBands[i] = Math.min(Math.max(rawValue, 0), 1);
        }

        if (this.config.beatDetection) {
            const now = Date.now();
            if (now - this.lastBeatTime > this.beatCooldown) {
                const bassAvg = (bands[0] + (bands[1] || bands[0])) / 2;
                if (bassAvg > this.config.beatThreshold) {
                    this.lastBeatTime = now;
                    this.isBeatActive = true;
                    setTimeout(() => this.isBeatActive = false, this.beatDuration);
                }
            }
        }
    }

    updateAnimationStep() {
        const count = this.config.bandCount;
        const df = this.config.decayFactor;
        const now = Date.now();
        const isIdle = (now - this.lastUpdateTime > 200);
        for (let i = 0; i < count; i++) {
            const target = isIdle ? 0 : (this.targetBands[i] || 0);
            if (target > this.displayedBands[i]) this.displayedBands[i] = target;
            else this.displayedBands[i] = (this.displayedBands[i] * df) + (target * (1 - df));
            if (this.displayedBands[i] > this.peaks[i]) this.peaks[i] = this.displayedBands[i];
            else this.peaks[i] *= this.peakDecay;
            if (this.displayedBands[i] < 0.001) this.displayedBands[i] = 0;
            if (this.peaks[i] < 0.001) this.peaks[i] = 0;
        }
    }

    draw() {
        if (!this.canvas || !this.ctx) return;
        const { width, height } = this.canvas;
        const ctx = this.ctx;
        const dpr = window.devicePixelRatio || 1;
        if (!this.currentTheme && window.THEMES) this.currentTheme = window.THEMES[0];

        ctx.clearRect(0, 0, width, height);

        if (this.config.background && this.config.background.enabled) {
            const bg = this.config.background;
            const r = parseInt(bg.color.slice(1, 3), 16);
            const g = parseInt(bg.color.slice(3, 5), 16);
            const b = parseInt(bg.color.slice(5, 7), 16);
            ctx.save();
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${bg.opacity})`;
            if (bg.borderRadius > 0 && ctx.roundRect) {
                ctx.beginPath();
                ctx.roundRect(0, 0, width, height, bg.borderRadius * dpr);
                ctx.fill();
            } else {
                ctx.fillRect(0, 0, width, height);
            }
            ctx.restore();
        }

        const effectiveGlowIntensity = this.isBeatActive ? this.config.glowIntensity * 2.5 : this.config.glowIntensity;
        if (this.config.oscilloscopeMode) this.drawOscilloscope(width, height, dpr, effectiveGlowIntensity);
        else if (this.config.mirrorMode) this.drawMirrorBars(width, height, dpr, effectiveGlowIntensity);
        else this.drawNormalBars(width, height, dpr, effectiveGlowIntensity);
    }

    drawNormalBars(width, height, dpr, glow) {
        const barSpacing = this.barSpacing * dpr;
        const barWidth = (width - (this.config.bandCount - 1) * barSpacing) / this.config.bandCount;
        this.renderBars(0, width, barWidth, barSpacing, this.displayedBands, this.peaks, dpr, glow);
    }

    drawMirrorBars(width, height, dpr, glow) {
        const ctx = this.ctx;
        const centerX = width / 2;
        const barSpacing = (this.barSpacing * dpr) / 2;
        const barWidth = (centerX - (this.config.bandCount - 1) * barSpacing) / this.config.bandCount;
        ctx.save();
        ctx.translate(centerX, 0);
        this.renderBars(0, centerX, barWidth, barSpacing, this.displayedBands, this.peaks, dpr, glow);
        ctx.restore();
        ctx.save();
        ctx.translate(centerX, 0);
        ctx.scale(-1, 1);
        this.renderBars(0, centerX, barWidth, barSpacing, this.displayedBands, this.peaks, dpr, glow);
        ctx.restore();
    }

    renderBars(startX, availableWidth, barWidth, barSpacing, bands, peaks, dpr, glow) {
        const ctx = this.ctx;
        const height = this.canvas.height;
        const cornerRadius = 4 * dpr;
        if (glow > 0) {
            ctx.shadowBlur = this.config.glowSpread * dpr;
            ctx.shadowColor = this.currentTheme ? this.currentTheme.glowColor : '#00ffff';
        }
        for (let i = 0; i < this.config.bandCount; i++) {
            const val = bands[i] || 0;
            if (val <= 0) continue;
            const barHeight = val * height;
            const x = startX + i * (barWidth + barSpacing);
            const y = height - barHeight;
            const gradient = this.getBarGradient(x, height, y);
            ctx.fillStyle = gradient;
            ctx.globalAlpha = this.config.barOpacity;
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(x, y, barWidth, barHeight, [cornerRadius, cornerRadius, 0, 0]);
            else ctx.rect(x, y, barWidth, barHeight);
            ctx.fill();
            if (this.config.peakIndicators && peaks[i] > 0) {
                const peakY = height - (peaks[i] * height);
                const prevShadow = ctx.shadowBlur;
                ctx.shadowBlur = 0;
                ctx.fillStyle = this.currentTheme ? this.currentTheme.peakColor : '#ffffff';
                ctx.globalAlpha = 1.0;
                ctx.fillRect(x, peakY - (2 * dpr), barWidth, 2 * dpr);
                ctx.shadowBlur = prevShadow;
            }
        }
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
    }

    drawOscilloscope(width, height, dpr, glow) {
        const ctx = this.ctx;
        const bands = this.displayedBands;
        const count = bands.length;
        if (count < 2) return;
        const step = width / (count - 1);
        ctx.save();
        if (glow > 0) {
            ctx.shadowBlur = this.config.glowSpread * dpr;
            ctx.shadowColor = this.currentTheme ? this.currentTheme.glowColor : '#00ffff';
        }
        ctx.beginPath();
        ctx.lineWidth = 2 * dpr;
        ctx.strokeStyle = this.currentTheme ? this.currentTheme.barGradient[this.currentTheme.barGradient.length - 1] : '#00ffff';
        for (let i = 0; i < count; i++) {
            const x = i * step;
            const y = height - (bands[i] * height * 0.8) - (height * 0.1);
            if (i === 0) ctx.moveTo(x, y);
            else {
                const prevX = (i - 1) * step;
                const prevY = height - (bands[i-1] * height * 0.8) - (height * 0.1);
                const cpX = (prevX + x) / 2;
                ctx.quadraticCurveTo(prevX, prevY, cpX, (prevY + y) / 2);
            }
        }
        ctx.stroke();
        ctx.restore();
    }

    getBarGradient(x, bottom, top) {
        const ctx = this.ctx;
        const gradient = ctx.createLinearGradient(x, bottom, x, top);
        if (this.currentTheme && this.currentTheme.barGradient) {
            const colors = this.currentTheme.barGradient;
            if (colors.length === 3) {
                gradient.addColorStop(0, colors[0]);
                gradient.addColorStop(0.5, colors[1]);
                gradient.addColorStop(1, colors[2]);
            } else {
                colors.forEach((color, idx) => {
                    gradient.addColorStop(idx / (colors.length - 1), color);
                });
            }
        } else {
            gradient.addColorStop(0, '#ff00ff');
            gradient.addColorStop(1, '#00ffff');
        }
        return gradient;
    }

    animate() {
        this.updateAnimationStep();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}
window.Visualizer = Visualizer;
