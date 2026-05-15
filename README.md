# 🎚️ Steel-Spectrum-Overlay

Zaawansowany, przezroczysty wizualizator audio na pulpit Windows. Widget działa jako overlay — zawsze na wierzchu, bez ramki, z animowanymi słupkami equalizera reagującymi na dźwięk systemowy w czasie rzeczywistym.

![Wersja](https://img.shields.io/badge/wersja-1.0.0-blue)
![Platform](https://img.shields.io/badge/platforma-Windows-lightgrey)
![Python](https://img.shields.io/badge/Python-3.10+-yellow)
![Electron](https://img.shields.io/badge/Electron-LTS-47848f)

---

## 📸 Podgląd

> Widget wyświetla 8, 12, 16 lub 32 pasma częstotliwości w skali logarytmicznej z płynną animacją i konfigurowalną poświatą. Dostępnych jest 5 wbudowanych motywów kolorystycznych oraz możliwość tworzenia własnych.

---

## ✨ Funkcje

### Wizualizacja
- **8 / 12 / 16 / 32 pasma** w skali logarytmicznej (konfigurowalne)
- **Płynny decay** — słupki rosną natychmiastowo, opadają z efektem grawitacji (EMA)
- **Peak indicators** — kreski szczytowe nad słupkami opadające z opóźnieniem
- **Beat detection** — pulsowanie poświaty przy uderzeniach basu
- **Mirror mode** — symetryczna wizualizacja względem środka ekranu
- **Oscilloscope mode** — alternatywny widok fali (przełącznik: klawisz `O`)

### Motywy
| Motyw | Opis |
|---|---|
| 🌆 Neon Cyberpunk | Magenta → Cyan, neonowy fiolet |
| 🌋 Solar Flare | Czerwony → Żółty, pomarańczowy glow |
| 💻 Matrix Green | Retro terminal, zieleń na czerni |
| 🧊 Arctic Ice | Granat → Lodowy błękit |
| 🌇 Synthwave Dusk | Fiolet → Róż → Złoto, 3-kolorowy gradient |

Możesz tworzyć własne motywy i eksportować/importować je jako pliki `.json`.

### System
- **Przezroczyste okno** bez ramki, zawsze na wierzchu
- **Click-through mode** — kliknięcia przechodzą przez widget do aplikacji pod spodem
- **Drag bez ramki** — przeciągnij widget w dowolne miejsce ekranu
- **Multi-monitor** — wybierz monitor w ustawieniach
- **System tray** — ikona w zasobniku z menu kontekstowym
- **Globalne skróty klawiszowe** działające niezależnie od aktywnego okna
- **Persistence** — wszystkie ustawienia i pozycja okna zapisywane automatycznie

---

## ⌨️ Skróty klawiszowe

| Skrót | Akcja |
|---|---|
| `Ctrl+Shift+E` | Pokaż / Ukryj widget |
| `Ctrl+Shift+M` | Toggle click-through mode |
| `Ctrl+Shift+O` | Toggle oscilloscope mode |
| `O` (focus na widgecie) | Toggle oscilloscope mode |
| `Double-click` na widget | Toggle click-through mode |

---

## 🗂️ Struktura projektu

```
steel-spectrum-overlay/
├── backend/
│   └── audio_server.py       # Serwer audio Python (WASAPI + FFT + WebSocket)
├── frontend/
│   ├── main.js               # Główny proces Electrona
│   ├── preload.js            # Bridge IPC (contextBridge)
│   ├── index.html            # Główny widok
│   ├── renderer.js           # Klient WebSocket
│   ├── visualizer.js         # Logika Canvas (słupki, efekty, motywy)
│   ├── settings.js           # Panel ustawień
│   ├── themes.js             # Definicje motywów kolorystycznych
│   ├── styles.css            # Style dark mode
│   └── assets/
│       └── tray-icon.png     # Ikona systemowa 16×16px
├── config.json               # Ustawienia użytkownika (auto-generowany)
├── start_debug.vbs           # Uruchom w trybie debug (widoczne okna CMD)
├── start_silent.vbs          # Uruchom w tle (bez okien CMD)
├── package.json
└── requirements.txt
```

---

## 🔧 Wymagania

- **Windows 10 / 11** (wymagane dla WASAPI Loopback)
- **Python 3.10+** — [python.org](https://www.python.org/downloads/)
- **Node.js 18+ LTS** — [nodejs.org](https://nodejs.org/)
- Karta dźwiękowa z obsługą WASAPI (standardowo w Windows)

---

## 🚀 Instalacja

### 1. Sklonuj repozytorium

```bash
git clone https://github.com/twoja-nazwa/steel-spectrum-overlay.git
cd steel-spectrum-overlay
```

### 2. Zainstaluj zależności Pythona

```bash
pip install -r requirements.txt
```

### 3. Zainstaluj zależności Node.js

```bash
npm install
```

---

## ▶️ Uruchomienie

### Tryb debug (zalecany przy pierwszym uruchomieniu)

Uruchamia backend i frontend w widocznych oknach CMD — łatwo sprawdzić logi błędów.

```
Kliknij dwukrotnie: start_debug.vbs
```

Lub ręcznie w dwóch terminalach:

```bash
# Terminal 1 — backend
python backend/audio_server.py --bands 16

# Terminal 2 — frontend
npm start
```

### Tryb cichy (codzienne użytkowanie)

Uruchamia wszystko w tle bez żadnych widocznych okien CMD.

```
Kliknij dwukrotnie: start_silent.vbs
```

Możesz dodać `start_silent.vbs` do Autostartu Windows (`Win+R` → `shell:startup`).

### Tryb demo (bez muzyki)

Testuje wizualizację z syntetycznymi danymi bez potrzeby odtwarzania dźwięku.

```bash
python backend/audio_server.py --demo
```

---

## ⚙️ Konfiguracja

Kliknij ikonę ⚙️ w prawym górnym rogu widgetu aby otworzyć panel ustawień.

### Panel ustawień

**Audio**
- `Master Sensitivity` — ogólna czułość wizualizatora (0.1 – 5.0)
- `Decay Factor` — szybkość opadania słupków (0.80 = szybko, 0.98 = wolno)
- `Liczba pasm` — 8 / 12 / 16 / 32
- `Peak Indicators` — włącz/wyłącz kreski szczytowe

**Wygląd**
- `Motyw` — wybierz spośród 5 wbudowanych lub własnych
- `Glow Intensity` — intensywność poświaty (0 – 50px)
- `Glow Spread` — rozproszenie poświaty (0 – 30px)
- `Bar Opacity` — przezroczystość słupków (0.3 – 1.0)
- `Wysokość widgetu` — rozmiar canvas (100 – 400px)

**System**
- `Monitor` — wybierz monitor docelowy
- `Click-through mode` — kliknięcia przechodzą przez widget
- `Eksportuj / Importuj motyw` — zapisz lub wczytaj motyw z pliku `.json`
- `Reset do domyślnych` — przywróć wszystkie ustawienia

**Kalibracja**
- Siatka wartości Raw dla każdego pasma w czasie rzeczywistym — pomocne przy ustawianiu czułości

### Argumenty CLI backendu

```bash
python backend/audio_server.py --bands 16 --port 8765 --sensitivity 1.0 --demo
```

| Argument | Opis | Domyślnie |
|---|---|---|
| `--bands` | Liczba pasm: 8, 12, 16 lub 32 | `16` |
| `--port` | Port WebSocket | `8765` |
| `--sensitivity` | Mnożnik czułości | `1.0` |
| `--demo` | Tryb testowy z syntetycznymi danymi | wyłączony |

---

## 🎨 Własne motywy

Możesz stworzyć własny motyw eksportując aktualny przez panel ustawień lub ręcznie tworząc plik `.json`:

```json
{
  "name": "Mój Motyw",
  "barGradient": ["#ff0000", "#ffff00"],
  "peakColor": "#ffffff",
  "glowColor": "#ff4400",
  "backgroundColor": "rgba(10, 0, 0, 0.90)"
}
```

Zaimportuj plik przez panel ustawień → Wygląd → **Importuj motyw**.

---

## 🛠️ Technologie

| Warstwa | Technologia |
|---|---|
| Przechwytywanie audio | `pyaudiowpatch` (WASAPI Loopback) |
| Przetwarzanie sygnału | `numpy` (FFT), `scipy` (okienkowanie Hann) |
| Komunikacja | WebSocket (`websockets`, `asyncio`) |
| Desktop app | Electron (główny proces + renderer) |
| Wizualizacja | HTML5 Canvas + `requestAnimationFrame` |
| Persistence | `config.json` (lokalny plik konfiguracji) |

---

## 🐛 Rozwiązywanie problemów

**Widget nie wykrywa dźwięku**
- Upewnij się że coś gra przez głośniki lub słuchawki podłączone do komputera
- Sprawdź czy domyślne urządzenie wyjściowe w Windows jest ustawione poprawnie
- Uruchom w trybie debug i sprawdź logi backendu

**Błąd `pyaudiowpatch` przy instalacji**
- Zainstaluj [Microsoft Visual C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
- Następnie ponów `pip install -r requirements.txt`

**Widget nie pojawia się na ekranie**
- Usuń `config.json` i uruchom ponownie — widget wyśrodkuje się na ekranie głównym

**Wysokie użycie CPU**
- Zmniejsz liczbę pasm (np. z 32 na 16)
- Zmniejsz wartość Glow Intensity w ustawieniach

---

## 📄 Licencja

MIT License — możesz swobodnie używać, modyfikować i dystrybuować.
