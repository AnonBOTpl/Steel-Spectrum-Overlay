# Changelog

Wszystkie istotne zmiany w projekcie Steel-Spectrum-Overlay.

## [1.9.1] - 2025-05-13

### Naprawiono
- Poprawiono błędy wykonania w skryptach VBS przy braku interpreterów w ścieżce PATH.
- Zoptymalizowano korekcję wysokich tonów w celu uniknięcia wizualnego przesterowania.
- Ujednolicono logikę detekcji Pythona we wszystkich skryptach startowych.

## [1.9.0] - 2025-05-13

### Dodano
- Wykładnicza korekcja częstotliwości wysokich tonów, zapewniająca idealny balans wizualny pasm.
- Rozszerzony zakres Equalizera: od 0.0 do 5.0 z nowymi liniami referencyjnymi (punkt neutralny 1.0).
- Inteligentna detekcja Pythona w skryptach startowych (py / python / pythonw).
- Bezpośrednie wywoływanie lokalnego Electrona ze ścieżki bezwzględnej w trybie silent.

### Naprawiono
- Naprawiono problem ze startem backendu w trybie silent na systemach z niestandardowym PATH.
- Poprawiono płynność animacji pasm wysokich.

## [1.8.0] - 2025-05-13

### Dodano
- Okno ustawień jest teraz w pełni resizable z zapamiętywaniem rozmiaru między sesjami.
- Autorski komponent `VerticalSlider` zastępujący natywne suwaki (naprawia wyświetlanie na Windows/Electron).
- Responsywne siatki Equalizera i Kalibracji (dostosowują się do szerokości okna).
- Obsługa scrollowania kółkiem myszy na suwakach equalizera dla precyzyjnej regulacji.
- Plik `.gitignore` chroniący `config.json` i `node_modules`.

### Zmieniono
- Parametr `--sensitivity` w backendzie jest teraz aktywny i wpływa na normalizację sygnału.
- Usunięto przesyłanie pola `peaks` przez WebSocket (optymalizacja pasma, obliczenia po stronie frontendu).
- Przeniesiono `electron` do `devDependencies` w `package.json`.

### Naprawiono
- Naprawiono błąd, w którym przełączanie click-through z zasobnika mogło nadpisywać inne ustawienia.
- Dodano walidację struktury pliku przy imporcie motywu (zabezpieczenie przed uszkodzonymi danymi).

## [1.7.0] - 2025-05-13

### Dodano
- Funkcja Equalizera per-pasmo: indywidualne wzmocnienie każdego pasma (0.0 – 5.0).
- Pełna synchronizacja statusu backendu w oknie ustawień.
- Aktywne odświeżanie sekcji Kalibracja (Raw Values).

## [1.6.0] - 2025-05-13
- Panel ustawień jako osobne okno z normalną ramką Windows (`settings.html`).
- Nowa sekcja: Tło widgetu (konfigurowalny kolor, przezroczystość i zaokrąglenie).
- Przełącznik trybu audio (Magnitude / dB).

## [1.0.0 - 1.5.0]
- Implementacja rdzenia, motywów, efektów, integracji systemowej i serwera audio.
