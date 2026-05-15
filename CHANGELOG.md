# Changelog

Wszystkie istotne zmiany w projekcie Steel-Spectrum-Overlay (Backend).

## [1.0.0] - 2025-05-13

### Dodano
- Implementacja serwera WebSocket w Pythonie (`backend/audio_server.py`).
- Obsługa przechwytywania audio systemowego przez WASAPI Loopback (`pyaudiowpatch`).
- Przetwarzanie sygnału: Okno Hann, FFT (NumPy), podział na pasma logarytmiczne (20Hz - 20kHz).
- Detekcja szczytów (Peak detection) z płynnym efektem opadania (decay).
- Adaptacyjny throttling (60 FPS przy muzyce, 20 FPS przy ciszy).
- Mechanizm "delta threshold" - wysyłanie klatki tylko przy zmianie pasma o >= 0.5%.
- Tryb demonstracyjny (`--demo`) generujący syntetyczne dane do testów.
- Obsługa argumentów CLI: `--bands`, `--port`, `--sensitivity`, `--demo`.
- Plik `requirements.txt` z zamrożonymi wersjami bibliotek.

### Zmieniono
- Podstawowy szkielet backendu został rozbudowany o pełną logikę wizualizatora.

## [1.1.0] - 2025-05-13

### Dodano
- Implementacja szkieletu Electron (proces główny, preload, renderer).
- Przezroczyste okno bez ramki z obsługą przeciągania (drag region).
- Silnik wizualizacji na HTML5 Canvas z wygładzaniem sygnału (EMA) i detekcją szczytów.
- Klient WebSocket z automatycznym wznawianiem połączenia i wskaźnikiem statusu.
- Obsługa trybu "click-through" (przezroczystość dla myszy) przełączanego dwuklikiem.
- Dynamiczne wczytywanie i zapisywanie konfiguracji w `config.json`.
- Obsługa wielu monitorów i automatyczne centrowanie okna.

### Naprawiono
- Obsługa błędów przy braku interfejsu audio lub niewłaściwym systemie operacyjnym.
