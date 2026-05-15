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

## [1.2.0] - 2025-05-13

### Dodano
- Wysuwalny panel ustawień (sekcje: Audio, Wygląd, System, Kalibracja).
- Dynamiczne rozszerzanie okna Electron przy otwieraniu panelu.
- System motywów (5 predefiniowanych motywów w `themes.js`).
- Synchronizacja suwaków z inputami numerycznymi i live preview zmian.
- Sekcja kalibracji wyświetlająca wartości surowe (Raw Values) w czasie rzeczywistym.
- Obsługa eksportu i importu motywów do plików JSON.
- Możliwość przenoszenia widgetu między monitorami z poziomu ustawień.
- Przycisk resetowania ustawień do wartości domyślnych.

## [1.3.0] - 2025-05-13

### Dodano
- Zaawansowany system motywów (5 stylów: Cyberpunk, Solar, Matrix, Arctic, Synthwave).
- Efekt Beat Detection: dynamiczne pulsowanie poświaty przy uderzeniach basu.
- Mirror Mode: symetryczna wizualizacja względem osi środkowej ekranu.
- Oscilloscope Mode: alternatywny widok fali z użyciem krzywych Beziera.
- Globalny skrót klawiszowy 'O' do szybkiego przełączania trybu oscyloskopu.
- Rozszerzony import/eksport motywów z walidacją struktury pliku JSON.

### Naprawiono
- Poprawiono inicjalizację tablic danych w wizualizatorze (eliminacja błędu brakujących pasm przy starcie).
- Ulepszono stabilność połączenia WebSocket i dodano szczegółowe logowanie błędów.
- Poprawiono renderowanie na ekranach o wysokiej gęstości pikseli (DPI).
- Obsługa błędów przy braku interfejsu audio lub niewłaściwym systemie operacyjnym.
