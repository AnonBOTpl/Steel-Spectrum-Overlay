const themes = [
    {
        name: "Neon Cyberpunk",
        barGradient: ["#ff00ff", "#00ffff"],
        peakColor: "#ffffff",
        glowColor: "#ff00ff",
        backgroundColor: "rgba(10, 0, 10, 0.90)"
    },
    {
        name: "Solar Flare",
        barGradient: ["#ff0000", "#ffaa00"],
        peakColor: "#ffff00",
        glowColor: "#ff4400",
        backgroundColor: "rgba(20, 5, 0, 0.90)"
    },
    {
        name: "Matrix Green",
        barGradient: ["#003300", "#00ff00"],
        peakColor: "#ccffcc",
        glowColor: "#00ff00",
        backgroundColor: "rgba(0, 5, 0, 0.95)"
    },
    {
        name: "Arctic Ice",
        barGradient: ["#000080", "#00ffff"],
        peakColor: "#ffffff",
        glowColor: "#00ccff",
        backgroundColor: "rgba(0, 5, 15, 0.90)"
    },
    {
        name: "Synthwave Dusk",
        barGradient: ["#6600ff", "#ff0066", "#ffcc00"],
        peakColor: "#ffffff",
        glowColor: "#ff0066",
        backgroundColor: "rgba(15, 0, 20, 0.90)"
    }
];

// Eksport do okna globalnego dla prostoty w Vanilla JS
window.THEMES = themes;
