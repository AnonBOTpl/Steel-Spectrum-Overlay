import asyncio
import json
import argparse
import sys
import signal
import numpy as np
from scipy.signal import windows
import websockets
import time

# Symulacja pyaudiowpatch dla systemów innych niż Windows (np. do testów w sandboxie)
try:
    import pyaudiowpatch as pyaudio
except ImportError:
    pyaudio = None

class AudioServer:
    def __init__(self, bands=16, port=8765, sensitivity=1.0, demo=False, mode='magnitude'):
        self.bands_count = bands
        self.port = port
        self.sensitivity = sensitivity # Używane jako mnożnik normalizacji
        self.demo = demo
        self.mode = mode # 'magnitude' lub 'db'
        self.clients = set()
        self.running = True

        # Inicjalizacja danych
        self.current_bands = np.zeros(self.bands_count)
        self.peaks = np.zeros(self.bands_count)
        self.last_sent_bands = np.zeros(self.bands_count)

        # Parametry detekcji szczytów i przetwarzania
        self.peak_decay = 0.99
        self.delta_threshold = 0.005
        self.min_sum_threshold = 0.05

        # Konfiguracja FFT i logarytmicznych pasm
        self.sample_rate = 44100
        self.chunk_size = 2048
        self.window = windows.hann(self.chunk_size)
        self.freqs = np.fft.rfftfreq(self.chunk_size, 1 / self.sample_rate)
        self.band_indices = self._calculate_log_bands()

    def _calculate_log_bands(self):
        """Oblicza indeksy FFT dla pasm logarytmicznych (20Hz - 20kHz)."""
        min_freq = 20
        max_freq = 20000
        log_limits = np.logspace(np.log10(min_freq), np.log10(max_freq), self.bands_count + 1)

        indices = []
        for i in range(self.bands_count):
            start_freq = log_limits[i]
            end_freq = log_limits[i+1]
            idx = np.where((self.freqs >= start_freq) & (self.freqs < end_freq))[0]
            indices.append(idx)
        return indices

    async def register(self, websocket):
        self.clients.add(websocket)
        try:
            await websocket.wait_closed()
        finally:
            self.clients.remove(websocket)

    async def broadcast(self, data):
        if not self.clients:
            return
        message = json.dumps(data)
        await asyncio.gather(*[client.send(message) for client in self.clients], return_exceptions=True)

    def process_audio_data(self, audio_data):
        """Przetwarza surowe dane audio (FFT, pasma, szczyty)."""
        if len(audio_data) < self.chunk_size:
            return

        windowed_data = audio_data[:self.chunk_size] * self.window
        fft_res = np.abs(np.fft.rfft(windowed_data))

        new_bands = np.zeros(self.bands_count)
        for i, indices in enumerate(self.band_indices):
            if len(indices) > 0:
                raw = np.mean(fft_res[indices])

                if self.mode == 'db':
                    # Tryb dB - poprawna normalizacja
                    # Typowy zakres FFT dla float32 WASAPI to ok. 0-2000
                    normalized_raw = raw / 2000.0
                    normalized_raw = np.clip(normalized_raw, 1e-9, 1.0)
                    db_val = 20 * np.log10(normalized_raw) # zakres: -180 do 0 dB
                    # Mapuj [-60dB, 0dB] -> [0.0, 1.0]
                    val = (db_val + 60.0) / 60.0
                    val = float(np.clip(val, 0.0, 1.0))
                else:
                    # Tryb magnitude - liniowy
                    val = raw / 50.0

                if val < 0.001:
                    val = 0.0
                new_bands[i] = np.clip(val, 0.0, 1.0)

        self.current_bands = new_bands

        # Aktualizacja szczytów (peak detection)
        for i in range(self.bands_count):
            if self.current_bands[i] > self.peaks[i]:
                self.peaks[i] = self.current_bands[i]
            else:
                self.peaks[i] = max(self.current_bands[i], self.peaks[i] * self.peak_decay)

    def generate_demo_data(self):
        """Generuje syntetyczne dane do trybu demo."""
        t = time.time()

        # Symulacja ciszy co 12s
        if int(t) % 12 >= 10:
            self.current_bands = np.zeros(self.bands_count)
        else:
            new_bands = np.zeros(self.bands_count)
            for i in range(self.bands_count):
                val = (np.sin(t * (i + 1) * 2) + 1) / 2.0 * np.random.uniform(0.5, 1.0)
                new_bands[i] = np.clip(val, 0.0, 1.0)
            self.current_bands = new_bands

        # Aktualizacja szczytów
        for i in range(self.bands_count):
            if self.current_bands[i] > self.peaks[i]:
                self.peaks[i] = self.current_bands[i]
            else:
                self.peaks[i] = max(self.current_bands[i], self.peaks[i] * self.peak_decay)

    def should_send_update(self):
        """Sprawdza delta threshold (0.5% zmiany w dowolnym paśmie)."""
        diff = np.abs(self.current_bands - self.last_sent_bands)
        if np.any(diff >= self.delta_threshold):
            return True
        return False

    async def main_loop(self):
        print(f"Serwer uruchomiony na ws://localhost:{self.port}")
        print(f"Liczba pasm: {self.bands_count}, Tryb: {self.mode}, Tryb demo: {self.demo}")

        stream = None
        p = None

        if not self.demo:
            if pyaudio is None:
                print("Błąd: pyaudiowpatch nie jest zainstalowany. Tryb audio wymaga Windows.")
                sys.exit(1)

            p = pyaudio.PyAudio()
            try:
                try:
                    wasapi_info = p.get_host_api_info_by_type(pyaudio.paWASAPI)
                    default_device = p.get_device_info_by_index(wasapi_info["defaultOutputDevice"])
                except Exception:
                    print("Błąd: Nie znaleziono interfejsu WASAPI.")
                    sys.exit(1)

                if not default_device.get("isLoopbackDevice", False):
                    found = False
                    for loopback in p.get_loopback_device_info_generator():
                        if default_device["name"] in loopback["name"]:
                            default_device = loopback
                            found = True
                            break
                    if not found:
                        print("Błąd: Nie znaleziono urządzenia loopback.")
                        sys.exit(1)

                print(f"Przechwytywanie z: {default_device['name']}")

                self.sample_rate = int(default_device["defaultSampleRate"])
                self.freqs = np.fft.rfftfreq(self.chunk_size, 1 / self.sample_rate)
                self.band_indices = self._calculate_log_bands()

                num_channels = default_device["maxInputChannels"]
                stream = p.open(
                    format=pyaudio.paFloat32,
                    channels=num_channels,
                    rate=self.sample_rate,
                    input=True,
                    input_device_index=default_device["index"],
                    frames_per_buffer=self.chunk_size
                )
            except Exception as e:
                print(f"Błąd podczas inicjalizacji audio: {e}")
                sys.exit(1)

        try:
            while self.running:
                start_time = time.time()

                if self.demo:
                    self.generate_demo_data()
                else:
                    try:
                        raw_data = stream.read(self.chunk_size, exception_on_overflow=False)
                        audio_data = np.frombuffer(raw_data, dtype=np.float32)
                        if audio_data.size > self.chunk_size:
                            audio_data = audio_data.reshape(-1, num_channels)[:, 0]

                        self.process_audio_data(audio_data)
                    except Exception as e:
                        print(f"Błąd przechwytywania audio: {e}")
                        break

                if self.should_send_update():
                    data = {
                        "bands": self.current_bands.tolist(),
                        "peaks": self.peaks.tolist(),
                        "band_count": self.bands_count,
                        "mode": self.mode
                    }
                    await self.broadcast(data)
                    self.last_sent_bands = self.current_bands.copy()

                total_sum = np.sum(self.current_bands)
                target_fps = 20 if total_sum < self.min_sum_threshold else 60

                elapsed = time.time() - start_time
                sleep_time = max(0.001, (1.0 / target_fps) - elapsed)
                await asyncio.sleep(sleep_time)
        finally:
            if stream:
                try:
                    stream.stop_stream()
                    stream.close()
                except: pass
            if p:
                try:
                    p.terminate()
                except: pass
            print("Zamykanie pętli głównej.")

    def stop(self):
        self.running = False

def main():
    parser = argparse.ArgumentParser(description="Steel-Spectrum-Overlay Audio Server")
    parser.add_argument("--bands", type=int, choices=[8, 12, 16, 32], default=16, help="Liczba pasm")
    parser.add_argument("--port", type=int, default=8765, help="Port WebSocket")
    parser.add_argument("--sensitivity", type=float, default=1.0, help="Mnożnik czułości")
    parser.add_argument("--mode", choices=["magnitude", "db"], default="magnitude", help="Tryb: magnitude lub db")
    parser.add_argument("--demo", action="store_true", help="Tryb demo")

    args = parser.parse_args()
    server = AudioServer(bands=args.bands, port=args.port, sensitivity=args.sensitivity, mode=args.mode, demo=args.demo)

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, server.stop)
        except (NotImplementedError, ValueError): pass

    async def start_server():
        try:
            async with websockets.serve(server.register, "localhost", args.port):
                await server.main_loop()
        except Exception as e:
            print(f"Błąd serwera: {e}")

    try:
        loop.run_until_complete(start_server())
    except KeyboardInterrupt: pass
    finally:
        loop.close()
        print("Serwer zatrzymany.")

if __name__ == "__main__":
    main()
