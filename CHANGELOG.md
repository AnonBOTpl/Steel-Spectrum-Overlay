# Changelog

Wszystkie istotne zmiany w projekcie Steel-Spectrum-Overlay.

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
- Poprawiono widoczność suwaków equalizera na silniku Chromium.

## [1.7.0] - 2025-05-13

### Dodano
- Funkcja Equalizera per-pasmo: indywidualne wzmocnienie każdego pasma (0.0 – 2.0).
- Pełna synchronizacja statusu backendu w oknie ustawień.
- Aktywne odświeżanie sekcji Kalibracja (Raw Values).

## [1.0.0 - 1.6.0]
- Implementacja rdzenia, motywów, efektów, integracji systemowej i serwera audio.
