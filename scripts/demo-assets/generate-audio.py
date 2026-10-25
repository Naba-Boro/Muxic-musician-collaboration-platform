#!/usr/bin/env python3
"""Generate short, original synthetic audio placeholders for the demo profiles."""

from array import array
import math
from pathlib import Path
import subprocess
import tempfile
import wave


RATE = 22050
OUT = Path(__file__).parent / "audio"

CLIPS = [
    ("ananya_alaap_texture", 220.00, "pad", [0, 2, 4, 5, 7, 9, 11]),
    ("ananya_indie_hook", 246.94, "voice", [0, 2, 4, 7, 9, 11, 12]),
    ("kabir_bass_groove", 110.00, "bass", [0, 3, 5, 7, 10, 12]),
    ("kabir_live_room_take", 123.47, "pluck", [0, 2, 3, 7, 9, 10, 12]),
    ("meera_ambient_pad", 164.81, "pad", [0, 2, 5, 7, 9, 12]),
    ("meera_mix_reference", 146.83, "pluck", [0, 3, 5, 7, 10, 12]),
    ("dhruv_acoustic_riff", 196.00, "pluck", [0, 2, 4, 7, 9, 12]),
    ("dhruv_songwriter_demo", 174.61, "voice", [0, 2, 3, 5, 7, 10, 12]),
    ("raghav_indie_production", 130.81, "pad", [0, 2, 4, 7, 9, 11, 12]),
    ("raghav_mix_print", 146.83, "bass", [0, 3, 5, 7, 10, 12]),
]


def make_clip(name: str, root: float, style: str, scale: list[int]) -> None:
    seconds = 10
    total = RATE * seconds
    frames = array("h")
    for n in range(total):
        t = n / RATE
        beat = t % 2.5
        chord_index = int(t / 2.5) % 4
        chord_shift = [0, 5, 3, 4][chord_index]
        note_index = int(beat / 0.5) % len(scale)
        semitone = scale[note_index] + chord_shift
        note = root * (2 ** (semitone / 12))

        # A soft drone and pulsing bass anchor each sample; the lead changes by profile.
        drone = math.sin(2 * math.pi * root * 0.5 * t) * 0.09
        bass_phase = (t % 0.5) / 0.5
        bass_env = math.exp(-bass_phase * (7 if style != "pad" else 3))
        bass = math.sin(2 * math.pi * root * 0.5 * t) * bass_env * 0.16
        note_phase = (t % 0.5) / 0.5
        if style in ("pluck", "bass"):
            env = math.exp(-note_phase * (5.5 if style == "pluck" else 3.0))
        else:
            env = min(1.0, note_phase * 7) * min(1.0, (0.5 - note_phase) * 5 + 0.15)
        vibrato = 1 + 0.003 * math.sin(2 * math.pi * 5.2 * t)
        lead = (
            math.sin(2 * math.pi * note * vibrato * t)
            + 0.28 * math.sin(2 * math.pi * note * 2 * vibrato * t)
            + 0.10 * math.sin(2 * math.pi * note * 3 * vibrato * t)
        ) * env * 0.32
        if style == "bass":
            lead *= 0.55
        value = (drone + bass + lead) * min(1.0, t / 0.1) * min(1.0, (seconds - t) / 0.5)
        sample = max(-1.0, min(1.0, value))
        pcm = int(sample * 32767)
        frames.extend((pcm, int(pcm * 0.96)))

    with tempfile.TemporaryDirectory(prefix="muxics-demo-") as temp_dir:
        wav_path = Path(temp_dir) / f"{name}.wav"
        m4a_path = OUT / f"{name}.m4a"
        with wave.open(str(wav_path), "wb") as wav:
            wav.setnchannels(2)
            wav.setsampwidth(2)
            wav.setframerate(RATE)
            wav.writeframes(frames.tobytes())
        subprocess.run(
            ["/usr/bin/afconvert", "-f", "m4af", "-d", "aac", "-b", "96000", str(wav_path), str(m4a_path)],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
        )


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for clip in CLIPS:
        make_clip(*clip)
    print(f"Generated {len(CLIPS)} synthetic M4A samples in {OUT}")


if __name__ == "__main__":
    main()
