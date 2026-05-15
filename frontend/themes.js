const themes = [
    {
        name: "Neon Cyberpunk",
        barGradient: ["#ff00ff", "#00ffff"],
        peakColor: "#ffffff",
        glowColor: "#bf00ff",
        backgroundColor: "rgba(0, 0, 0, 0)"
    },
    {
        name: "Solar Flare",
        barGradient: ["#ff4500", "#ffdd00"],
        peakColor: "#ffffff",
        glowColor: "#ff6600",
        backgroundColor: "rgba(0, 0, 0, 0)"
    },
    {
        name: "Matrix Green",
        barGradient: ["#003300", "#00ff41"],
        peakColor: "#00ff41",
        glowColor: "#00cc33",
        backgroundColor: "rgba(0, 0, 0, 0)"
    },
    {
        name: "Arctic Ice",
        barGradient: ["#004466", "#aaeeff"],
        peakColor: "#ffffff",
        glowColor: "#00aaff",
        backgroundColor: "rgba(0, 0, 0, 0)"
    },
    {
        name: "Synthwave Dusk",
        barGradient: ["#6600ff", "#ff0066", "#ffaa00"],
        peakColor: "#ffaa00",
        glowColor: "#ff0066",
        backgroundColor: "rgba(0, 0, 0, 0)"
    }
];

function getTheme(name) {
    return themes.find(t => t.name === name) || themes[0];
}

window.THEMES = themes;
window.getTheme = getTheme;
