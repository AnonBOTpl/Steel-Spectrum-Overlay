# Changelog

Wszystkie istotne zmiany w projekcie Steel-Spectrum-Overlay.

## [1.7.0] - 2025-05-13

### Dodano
- Funkcja Equalizera per-pasmo: indywidualne wzmocnienie każdego pasma (0.0 – 2.0).
- Dynamiczna generacja pionowych suwaków wzmocnienia w oknie ustawień.
- Pełna synchronizacja statusu backendu w oknie ustawień (Bug 2).
- Aktywne odświeżanie sekcji Kalibracja (Raw Values) danymi audio (Bug 4).
- Nowy kanał komunikacji IPC dla danych pasm audio z throttlingiem (5Hz).

### Naprawiono
- Naprawiono błąd resetowania ustawień przy przełączaniu click-through z zasobnika (Bug 1).
- Poprawiono normalizację trybu dB w backendzie (słupki nie są już stale na max, Bug 3).
- Poprawiono obsługę zapisu konfiguracji (zabezpieczenie przed uszkodzeniem pliku).
- Zmieniono operator `||` na `??` w konfiguracji wizualizatora, co umożliwia poprawne ustawianie wartości 0.

## [1.6.0] - 2025-05-13

### Dodano
- Panel ustawień jako osobne okno z normalną ramką Windows (`settings.html`).
- Nowa sekcja: Tło widgetu (konfigurowalny kolor, przezroczystość i zaokrąglenie).
- Przełącznik trybu audio (Magnitude / dB).

## [1.0.0 - 1.5.0]
- Implementacja rdzenia, motywów, efektów, integracji systemowej i serwera audio.
