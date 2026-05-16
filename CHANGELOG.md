# Changelog

Wszystkie istotne zmiany w projekcie Steel-Spectrum-Overlay.

## [1.6.0] - 2025-05-13

### Dodano
- Panel ustawień jako osobne okno z normalną ramką Windows (`settings.html`).
- Nowa sekcja: Tło widgetu (konfigurowalny kolor, przezroczystość i zaokrąglenie).
- Przełącznik trybu audio (Magnitude / dB) w ustawieniach i backendzie.
- Przycisk "Zapisz i zamknij" w oknie ustawień.
- Nowe skrypty startowe dla trybu dB: `start_debug_db.vbs` i `start_silent_db.vbs`.
- Synchronizacja konfiguracji między oknami w czasie rzeczywistym.

### Zmieniono
- Złagodzono korekcję pasm wysokich (Treble Correction) i ustawiono domyślne sensitivity na 1.0.
- Usunięto mnożnik sensitivity z backendu (teraz w całości obsługiwany przez frontend).
- Ikona Tray jest teraz generowana programatycznie z pikseli, co rozwiązuje problem niewidoczności na Windows.

### Naprawiono
- Naprawiono błąd renderowania słupków przy starcie (brak inicjalizacji danych).
- Poprawiono stabilność połączenia i synchronizację statusu w nowym oknie.

## [1.5.0] - 2025-05-13

### Dodano
- Pełna integracja z System Tray (menu kontekstowe, szybkie ukrywanie, statusy).
- Globalne skróty klawiszowe (Ctrl+Shift+E, M, O).
- Obsługa wielu monitorów i zapamiętywanie pozycji okna.
- Implementacja Manual Drag odblokowująca menu kontekstowe.

## [1.4.0] - 2025-05-13

### Dodano
- Mechanizm "Idle Decay" zapewniający płynne wygaszanie vizualizacji.
- Wstępna korekcja częstotliwości wysokich tonów.

## [1.0.0 - 1.3.0]
- Implementacja rdzenia, motywów, efektów i serwera audio.
