class Visualizer {
    constructor() {
        this.canvas = document.getElementById('visualizer-canvas');
        this.ctx = this.canvas.getContext('2d');

        // Konfiguracja (wartości domyślne zostaną nadpisane przez config.json)
        this.config = {
            bandCount: 16,
            sensitivity: 1.5,
            decayFactor: 0.92,
            peakIndicators: true
        };

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
        this.config = { ...this.config, ...newConfig.audio };
        this.initDataArrays();
    }

    initDataArrays() {
        if (this.displayedBands.length !== this.config.bandCount) {
            this.displayedBands = new Array(this.config.bandCount).fill(0);
            this.peaks = new Array(this.config.bandCount).fill(0);
        }
    }

    resize() {
        // Ustawienie rozdzielczości wewnętrznej canvasu
        this.canvas.width = this.canvas.clientWidth * window.devicePixelRatio;
        this.canvas.height = this.canvas.clientHeight * window.devicePixelRatio;
    }

    updateData(bands) {
        if (!bands || bands.length === 0) return;

        this.initDataArrays();

        for (let i = 0; i < this.config.bandCount; i++) {
            const rawValue = (bands[i] || 0) * this.config.sensitivity;
            const clampedValue = Math.min(Math.max(rawValue, 0), 1);

            // EMA Smoothing / Decay
            if (clampedValue > this.displayedBands[i]) {
                // Natychmiastowy wzrost
                this.displayedBands[i] = clampedValue;
            } else {
                // Płynne opadanie
                this.displayedBands[i] = (this.displayedBands[i] * this.config.decayFactor) +
                                       (clampedValue * (1 - this.config.decayFactor));
            }

            // Peak detection (opadanie szczytów)
            if (this.displayedBands[i] > this.peaks[i]) {
                this.peaks[i] = this.displayedBands[i];
            } else {
                this.peaks[i] = Math.max(0, this.peaks[i] * this.peakDecay);
            }
        }
    }

    draw() {
        const { width, height } = this.canvas;
        const ctx = this.ctx;

        // Czyszczenie bez resetowania stanu GPU
        ctx.clearRect(0, 0, width, height);

        const barWidth = (width - (this.config.bandCount - 1) * this.barSpacing) / this.config.bandCount;
        const cornerRadius = 4;

        for (let i = 0; i < this.config.bandCount; i++) {
            const val = this.displayedBands[i];
            const barHeight = val * height;
            const x = i * (barWidth + this.barSpacing);
            const y = height - barHeight;

            // Rysowanie słupka (gradient)
            const gradient = ctx.createLinearGradient(x, height, x, y);
            gradient.addColorStop(0, '#ff00ff'); // Magenta
            gradient.addColorStop(1, '#00ffff'); // Cyan

            ctx.fillStyle = gradient;

            // Zaokrąglony słupek
            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(x, y, barWidth, barHeight, [cornerRadius, cornerRadius, 0, 0]);
            } else {
                // Fallback dla starszych silników
                ctx.rect(x, y, barWidth, barHeight);
            }
            ctx.fill();

            // Rysowanie szczytów (Peaks)
            if (this.config.peakIndicators && this.peaks[i] > 0.01) {
                const peakY = height - (this.peaks[i] * height);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(x, peakY - 2, barWidth, 2);
            }
        }
    }

    animate() {
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

// Eksportujemy klasę do użycia w renderer.js
window.Visualizer = Visualizer;
