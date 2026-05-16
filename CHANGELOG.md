# Changelog

Wszystkie istotne zmiany w projekcie Steel-Spectrum-Overlay.

## [1.4.0] - 2025-05-13

### Dodano
- Implementacja ręcznego przeciągania okna (Manual Drag) w celu odblokowania menu kontekstowego.
- Mechanizm "Idle Decay" zapewniający płynne wygaszanie wizualizacji przy braku danych z WebSocket.
- Korekcja częstotliwości (Treble Correction) wzmacniająca wysokie tony w wizualizacji.
- Obsługa relatywnego przesuwania okna przez IPC dla lepszej płynności.

### Zmieniono
- Panel ustawień jest teraz otwierany wyłącznie prawym przyciskiem myszy na widgecie.
- Wskaźnik statusu WebSocket został przeniesiony do wewnątrz panelu ustawień.
- Zoptymalizowano pętlę renderowania (EMA smoothing przeniesiony do klatki animacji), co wyeliminowało migotanie słupków.

### Naprawiono
- Naprawiono problem z blokowaniem menu kontekstowego przez natywny region 'drag'.
- Naprawiono skalowanie słupków - teraz wykorzystują 100% wysokości canvas.
- Zapewniono pełną przezroczystość tła widgetu we wszystkich motywach.
- Wyeliminowano problem "pauzowania" animacji blisko zera podczas ciszy.

## [1.3.0] - 2025-05-13

### Dodano
- Zaawansowany system motywów (5 stylów: Cyberpunk, Solar, Matrix, Arctic, Synthwave).
- Efekt Beat Detection: dynamiczne pulsowanie poświaty przy uderzeniach basu.
- Mirror Mode: symetryczna wizualizacja względem osi środkowej ekranu.
- Oscilloscope Mode: alternatywny widok fali z użyciem krzywych Beziera.
- Globalny skrót klawiszowy 'O' do szybkiego przełączania trybu oscyloskopu.
- Rozszerzony import/eksport motywów z walidacją struktury pliku JSON.

## [1.2.0] - 2025-05-13

### Dodano
- Wysuwalny panel ustawień (sekcje: Audio, Wygląd, System, Kalibracja).
- Dynamiczne rozszerzanie okna Electron przy otwieraniu panelu.
- System motywów (podstawowe definicje w `themes.js`).
- Synchronizacja suwaków z inputami numerycznymi i live preview zmian.
- Sekcja kalibracji wyświetlająca wartości surowe (Raw Values) w czasie rzeczywistym.
- Obsługa eksportu i importu motywów do plików JSON.
- Możliwość przenoszenia widgetu między monitorami z poziomu ustawień.
- Przycisk resetowania ustawień do wartości domyślnych.

## [1.1.0] - 2025-05-13

### Dodano
- Implementacja szkieletu Electron (proces główny, preload, renderer).
- Przezroczyste okno bez ramki z obsługą przeciągania.
- Silnik wizualizacji na HTML5 Canvas z wygładzaniem sygnału (EMA) i detekcją szczytów.
- Klient WebSocket z automatycznym wznawianiem połączenia i wskaźnikiem statusu.
- Obsługa trybu "click-through" przełączanego dwuklikiem.
- Dynamiczne wczytywanie i zapisywanie konfiguracji w `config.json`.

## [1.0.0] - 2025-05-13

### Dodano
- Implementacja serwera WebSocket w Pythonie (`backend/audio_server.py`).
- Obsługa przechwytywania audio systemowego przez WASAPI Loopback.
- Przetwarzanie sygnału: Okno Hann, FFT, podział na pasma logarytmiczne.
- Detekcja szczytów (Peak detection) z płynnym decay.
- Adaptacyjny throttling (60 FPS / 20 FPS).
- Tryb demonstracyjny (`--demo`).
