#!/usr/bin/env python3
"""Build every Playful Worlds audio asset from src/data/audio-spec.json.

  python3 tools/audio/build_audio.py          (run from explorers/)

Outputs src/assets/audio/*.mp3, src/assets/audio/manifest.json and
src/assets/audio/ATTRIBUTION.md.

Sources (all usable commercially, all created here; nothing downloaded):
  * Speech: SVOX Pico TTS (pico2wave, Apache-2.0), voice en-US, rendered offline.
  * Phonemes: the steady middle of the first consonant cut from a Pico word
    (e.g. the /m/ of "moon"), looped smoothly — a real sound, never a letter name.
  * Animal & environment sounds: synthesized by this script (source-filter and
    noise models). They are sound *designs*, not field recordings.

Automatic checks (results saved in the manifest):
  * every spoken word / prompt is recognized by an offline speech recognizer
    (pocketsphinx, constrained to the game vocabulary) — an intelligibility check;
  * phonemes and sound effects pass spectral sanity tests (e.g. /s/ is a high
    hiss, /m/ is a low voiced hum, rain is broadband noise).
These checks do NOT replace human listening; that limitation is documented.
Requires: pico2wave, ffmpeg, python packages numpy, scipy, pocketsphinx.
"""
import json, os, subprocess, sys, tempfile, hashlib, re
import numpy as np
from scipy import signal
from scipy.io import wavfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
SPEC = json.load(open(os.path.join(ROOT, "src", "data", "audio-spec.json")))
OUT = os.path.join(ROOT, "src", "assets", "audio")
os.makedirs(OUT, exist_ok=True)
SR_FX = 22050
RNG = np.random.default_rng(20261116)   # deterministic synthesis

# ----------------------------------------------------------------- helpers
def to_mp3(x, sr, name, kbps):
    x = np.asarray(x, dtype=np.float64)
    peak = np.max(np.abs(x)) or 1.0
    x = x / peak * 0.89
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as t:
        wavfile.write(t.name, sr, (x * 32767).astype(np.int16))
        path = os.path.join(OUT, name + ".mp3")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", t.name, "-ac", "1", "-ar", str(sr), "-codec:a", "libmp3lame",
                        "-b:a", f"{kbps}k", "-map_metadata", "-1", "-id3v2_version", "0", "-write_xing", "0", path], check=True)
        os.unlink(t.name)
    return path

def env(n, a, r, sr):
    e = np.ones(n)
    na, nr = int(a * sr), int(r * sr)
    if na: e[:na] = np.linspace(0, 1, na) ** 1.5
    if nr: e[-nr:] *= np.linspace(1, 0, nr) ** 1.5
    return e

def harmonic_source(f0, sr, rough=0.0, tilt=1.0):
    """Band-limited glottal-like source following an f0 contour (array, Hz)."""
    phase = 2 * np.pi * np.cumsum(f0) / sr
    out = np.zeros_like(f0)
    kmax = int((sr / 2) / max(60, np.min(f0)))
    for k in range(1, min(kmax, 60) + 1):
        amp = 1.0 / (k ** tilt)
        mask = (k * f0) < sr / 2 - 200
        out += mask * amp * np.sin(k * phase + RNG.uniform(0, 0.3))
    if rough:
        out *= 1 + rough * RNG.standard_normal(len(out))
    return out

def formants(x, sr, fs, bws, gains):
    """Parallel resonators. fs/bws/gains: lists of scalars or arrays (time-varying via segments)."""
    y = np.zeros_like(x)
    for f, bw, g in zip(fs, bws, gains):
        if np.isscalar(f):
            b, a = signal.iirpeak(f / (sr / 2), max(1.0, f / bw))
            y += g * signal.lfilter(b, a, x)
        else:   # time-varying: process in short blocks
            blk = 256; z = None
            out = np.zeros_like(x)
            for i in range(0, len(x), blk):
                fc = float(np.mean(f[i:i + blk]))
                b, a = signal.iirpeak(min(fc, sr / 2 - 100) / (sr / 2), max(1.0, fc / bw))
                if z is None: z = signal.lfilter_zi(b, a) * 0
                out[i:i + blk], z = signal.lfilter(b, a, x[i:i + blk], zi=z)
            y += g * out
    return y

def bandnoise(n, sr, lo, hi, order=4):
    w = RNG.standard_normal(n)
    sos = signal.butter(order, [lo / (sr / 2), min(hi, sr / 2 - 50) / (sr / 2)], btype="band", output="sos")
    return signal.sosfilt(sos, w)

def lowpass(x, sr, fc, order=4):
    return signal.sosfilt(signal.butter(order, fc / (sr / 2), output="sos"), x)

def highpass(x, sr, fc, order=4):
    return signal.sosfilt(signal.butter(order, fc / (sr / 2), btype="high", output="sos"), x)

def glide(n, pts):
    """Piecewise-linear contour: pts = [(t0..1, value), ...]."""
    t = np.linspace(0, 1, n)
    xs, ys = zip(*pts)
    return np.interp(t, xs, ys)

def silence(sec, sr=SR_FX): return np.zeros(int(sec * sr))

def vibrato(n, sr, rate, depth):
    return 1 + depth * np.sin(2 * np.pi * rate * np.arange(n) / sr)

# ----------------------------------------------------------------- sound designs
def s_cow():
    sr = SR_FX; d = 1.5; n = int(d * sr)
    f0 = glide(n, [(0, 118), (0.15, 132), (0.6, 124), (1, 104)]) * vibrato(n, sr, 5, 0.01)
    src = harmonic_source(f0, sr, rough=0.04, tilt=1.1)
    f1 = glide(n, [(0, 260), (0.18, 300), (0.4, 420), (1, 380)])
    f2 = glide(n, [(0, 700), (0.18, 760), (0.4, 900), (1, 820)])
    y = formants(src, sr, [f1, f2, 2500], [80, 120, 300], [1.0, 0.55, 0.08])
    y += 0.02 * bandnoise(n, sr, 300, 3000)
    return y * env(n, 0.18, 0.35, sr)

def s_sheep():
    sr = SR_FX; d = 1.1; n = int(d * sr)
    f0 = glide(n, [(0, 300), (0.2, 330), (1, 280)]) * vibrato(n, sr, 8.5, 0.035)
    src = harmonic_source(f0, sr, rough=0.06, tilt=0.9)
    y = formants(src, sr, [650, 1750, 2600], [110, 150, 250], [1.0, 0.6, 0.2])
    am = 0.55 + 0.45 * np.abs(np.sin(np.pi * 8.5 * np.arange(n) / sr))
    y = y * am
    pre = silence(0.03); return np.concatenate([pre, y * env(n, 0.04, 0.3, sr)])

def s_cat():
    sr = SR_FX; d = 0.95; n = int(d * sr)
    f0 = glide(n, [(0, 430), (0.35, 760), (0.7, 620), (1, 430)])
    src = harmonic_source(f0, sr, rough=0.02, tilt=1.0)
    f1 = glide(n, [(0, 300), (0.15, 320), (0.4, 850), (0.75, 700), (1, 420)])
    f2 = glide(n, [(0, 1900), (0.15, 2300), (0.4, 1500), (0.75, 1100), (1, 850)])
    y = formants(src, sr, [f1, f2, 3200], [90, 150, 300], [1.0, 0.7, 0.1])
    return y * env(n, 0.07, 0.25, sr)

def s_dog():
    sr = SR_FX
    def bark(d=0.2):
        n = int(d * sr)
        f0 = glide(n, [(0, 520), (0.25, 600), (1, 330)])
        src = harmonic_source(f0, sr, rough=0.25, tilt=0.8) + 0.6 * bandnoise(n, sr, 400, 4000)
        y = formants(src, sr, [750, 1350, 2700], [180, 220, 400], [1.0, 0.8, 0.3])
        e = np.exp(-np.linspace(0, 5, n)); e[:int(0.008 * sr)] *= np.linspace(0, 1, int(0.008 * sr))
        return y * e
    return np.concatenate([bark(), silence(0.22), bark(0.22), silence(0.1)])

def s_duck():
    sr = SR_FX
    def quack(d=0.24):
        n = int(d * sr)
        f0 = glide(n, [(0, 240), (0.3, 260), (1, 200)]) * (1 + 0.04 * RNG.standard_normal(n))
        src = harmonic_source(np.abs(f0), sr, rough=0.3, tilt=0.6)
        src *= 0.7 + 0.3 * np.sign(np.sin(2 * np.pi * 45 * np.arange(n) / sr))   # buzzy roughness
        y = formants(src, sr, [900, 1600, 2400], [250, 300, 350], [1.0, 0.9, 0.5])
        return y * env(n, 0.015, 0.12, sr)
    return np.concatenate([quack(), silence(0.12), quack(0.26), silence(0.1)])

def s_owl():
    sr = SR_FX
    def hoot(d, f):
        n = int(d * sr)
        f0 = glide(n, [(0, f * 1.02), (1, f * 0.95)])
        ph = 2 * np.pi * np.cumsum(f0) / sr
        y = np.sin(ph) + 0.12 * np.sin(2 * ph) + 0.015 * bandnoise(n, sr, 200, 1200)
        return y * env(n, 0.09, 0.16, sr)
    return np.concatenate([hoot(0.55, 360), silence(0.32), hoot(0.22, 380), silence(0.08), hoot(0.4, 350), silence(0.1)])

def s_frog():
    sr = SR_FX
    def syll(d, rate, fc):
        n = int(d * sr); t = np.arange(n) / sr; y = np.zeros(n)
        for k in range(int(d * rate)):
            start = int(k / rate * sr); m = min(n - start, int(0.025 * sr))
            tt = np.arange(m) / sr
            y[start:start + m] += np.sin(2 * np.pi * fc * tt) * np.exp(-tt * 140) + 0.5 * np.sin(2 * np.pi * fc * 1.9 * tt) * np.exp(-tt * 180)
        return y * env(n, 0.01, 0.03, sr)
    return np.concatenate([syll(0.14, 32, 650), silence(0.05), syll(0.1, 38, 900), silence(0.35), syll(0.14, 32, 650), silence(0.05), syll(0.1, 38, 900), silence(0.1)])

def s_bee():
    sr = SR_FX; d = 1.6; n = int(d * sr)
    f0 = 215 * (1 + 0.04 * np.sin(2 * np.pi * 6.5 * np.arange(n) / sr)) * glide(n, [(0, 0.97), (0.5, 1.04), (1, 0.98)])
    src = harmonic_source(f0, sr, tilt=0.7)
    y = formants(src, sr, [450, 1200, 2600], [300, 500, 800], [1.0, 0.8, 0.4])
    am = 0.8 + 0.2 * np.sin(2 * np.pi * 3 * np.arange(n) / sr)
    return y * am * glide(n, [(0, 0), (0.15, 0.8), (0.5, 1), (0.85, 0.8), (1, 0)])

def s_bird():
    sr = SR_FX; parts = []
    for k, (a, b, d) in enumerate([(4200, 3000, 0.09), (4400, 3100, 0.09), (3600, 4800, 0.07), (4800, 3400, 0.11)]):
        n = int(d * sr); f = glide(n, [(0, a), (1, b)])
        ph = 2 * np.pi * np.cumsum(f) / sr
        parts += [(np.sin(ph) + 0.2 * np.sin(2 * ph)) * env(n, 0.01, 0.03, sr), silence(0.07 if k < 3 else 0.12)]
    # a short trill
    n = int(0.35 * sr); f = 3800 + 600 * np.sin(2 * np.pi * 22 * np.arange(n) / sr)
    parts.append(np.sin(2 * np.pi * np.cumsum(f) / sr) * env(n, 0.02, 0.1, sr))
    return np.concatenate(parts)

def s_pig():
    sr = SR_FX
    def oink(d=0.28):
        n = int(d * sr)
        f0 = glide(n, [(0, 120), (0.3, 135), (1, 95)])
        src = harmonic_source(f0, sr, rough=0.35, tilt=0.8)
        src *= 0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 30 * np.arange(n) / sr))
        y = formants(src, sr, [380, 1000, 2400], [150, 250, 400], [1.0, 0.6, 0.15])
        return y * env(n, 0.03, 0.12, sr)
    return np.concatenate([oink(), silence(0.18), oink(0.32), silence(0.1)])

def s_hen():
    sr = SR_FX; parts = []
    for d in (0.07, 0.07, 0.07):
        n = int(d * sr); f0 = glide(n, [(0, 520), (1, 430)])
        src = harmonic_source(f0, sr, rough=0.3, tilt=0.7)
        parts += [formants(src, sr, [800, 1800, 3000], [200, 300, 400], [1, 0.8, 0.3]) * env(n, 0.005, 0.04, sr), silence(0.12)]
    n = int(0.35 * sr); f0 = glide(n, [(0, 500), (0.4, 820), (1, 600)])
    src = harmonic_source(f0, sr, rough=0.3, tilt=0.7)
    parts.append(formants(src, sr, [900, 1700, 3000], [220, 320, 400], [1, 0.8, 0.3]) * env(n, 0.02, 0.15, sr))
    return np.concatenate(parts + [silence(0.1)])

def s_snake():
    sr = SR_FX; d = 1.4; n = int(d * sr)
    y = bandnoise(n, sr, 3500, 10000, order=6)
    return y * glide(n, [(0, 0), (0.2, 1), (0.75, 0.9), (1, 0)])

def s_mouse():
    sr = SR_FX; parts = []
    for d in (0.08, 0.06, 0.1):
        n = int(d * sr); f = glide(n, [(0, 3200), (0.5, 3900), (1, 3400)]) * vibrato(n, sr, 40, 0.02)
        parts += [np.sin(2 * np.pi * np.cumsum(f) / sr) * env(n, 0.01, 0.03, sr), silence(0.09)]
    return np.concatenate(parts)

def s_whale():
    sr = SR_FX; d = 2.2; n = int(d * sr)
    f0 = glide(n, [(0, 180), (0.4, 380), (0.7, 330), (1, 220)])
    ph = 2 * np.pi * np.cumsum(f0) / sr
    y = np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.12 * np.sin(3 * ph)
    y = lowpass(y, sr, 1500)
    return y * env(n, 0.35, 0.6, sr)

def s_rain():
    sr = SR_FX; d = 2.2; n = int(d * sr)
    bed = lowpass(highpass(RNG.standard_normal(n), sr, 400), sr, 6000) * 0.25
    drops = np.zeros(n)
    for _ in range(260):
        p = RNG.integers(0, n - 400); m = 300; tt = np.arange(m) / sr
        f = RNG.uniform(2000, 5500)
        drops[p:p + m] += RNG.uniform(0.2, 1) * np.sin(2 * np.pi * f * tt) * np.exp(-tt * 300)
    return (bed + drops) * env(n, 0.3, 0.4, sr)

def s_thunder():
    sr = SR_FX; d = 2.8; n = int(d * sr)
    crack = highpass(RNG.standard_normal(n), sr, 800) * np.exp(-np.arange(n) / sr * 9) * 0.6
    brown = np.cumsum(RNG.standard_normal(n)); brown -= np.convolve(brown, np.ones(2000) / 2000, mode="same")
    rumble = lowpass(brown, sr, 180) * glide(n, [(0, 0.2), (0.1, 1), (0.35, 0.7), (0.55, 0.9), (1, 0)])
    rumble /= np.max(np.abs(rumble)) or 1
    return crack + rumble

def s_waves():
    sr = SR_FX; d = 2.8; n = int(d * sr)
    pink = signal.lfilter([0.049922035, -0.095993537, 0.050612699, -0.004408786], [1, -2.494956002, 2.017265875, -0.522189400], RNG.standard_normal(n))
    swell = glide(n, [(0, 0.05), (0.45, 1), (0.6, 0.85), (1, 0)])
    y = np.zeros(n); blk = 512
    for i in range(0, n, blk):   # brighter at the crest of the wave
        fc = 400 + 3200 * swell[i]
        y[i:i + blk] = lowpass(pink[max(0, i - 2048):i + blk], sr, fc)[-len(pink[i:i + blk]):]
    return y * swell

def s_wind():
    sr = SR_FX; d = 2.4; n = int(d * sr)
    w = RNG.standard_normal(n); y = np.zeros(n); blk = 256
    fc = glide(n, [(0, 380), (0.35, 900), (0.7, 600), (1, 450)])
    zi = None
    for i in range(0, n, blk):
        b, a = signal.iirpeak(fc[i] / (sr / 2), 6)
        if zi is None: zi = signal.lfilter_zi(b, a) * 0
        y[i:i + blk], zi = signal.lfilter(b, a, w[i:i + blk], zi=zi)
    y += 0.25 * lowpass(w, sr, 700)
    return y * glide(n, [(0, 0), (0.3, 0.9), (0.6, 1), (1, 0)])

def s_clock():
    sr = SR_FX; parts = []
    for k in range(4):
        m = int(0.03 * sr); tt = np.arange(m) / sr; f = 2300 if k % 2 == 0 else 1600
        click = (np.sin(2 * np.pi * f * tt) + 0.5 * np.sin(2 * np.pi * f * 2.7 * tt)) * np.exp(-tt * 260)
        parts += [click, silence(0.47)]
    return np.concatenate(parts)

def s_tap():
    sr = SR_FX; d = 2.0; n = int(d * sr)
    y = bandnoise(n, sr, 500, 5000) * 0.5
    for _ in range(70):
        p = RNG.integers(0, n - 1200); m = int(RNG.uniform(0.02, 0.05) * sr); tt = np.arange(m) / sr
        f0 = RNG.uniform(700, 1400); f = f0 * (1 + 2.5 * tt / tt[-1])
        y[p:p + m] += 0.5 * np.sin(2 * np.pi * np.cumsum(f) / sr) * np.exp(-tt * 60)
    return y * env(n, 0.15, 0.3, sr)

SFX = {"cow": s_cow, "sheep": s_sheep, "cat": s_cat, "dog": s_dog, "duck": s_duck, "owl": s_owl, "frog": s_frog, "bee": s_bee,
       "bird": s_bird, "pig": s_pig, "hen": s_hen, "snake": s_snake, "mouse": s_mouse, "whale": s_whale, "rain": s_rain,
       "thunder": s_thunder, "waves": s_waves, "wind": s_wind, "clock": s_clock, "tap": s_tap}

def spectral(x, sr):
    f, p = signal.welch(x, sr, nperseg=1024)
    p = p / (np.sum(p) or 1)
    centroid = float(np.sum(f * p))
    flat = float(np.exp(np.mean(np.log(p + 1e-12))) / (np.mean(p) + 1e-12))
    lowfrac = float(np.sum(p[f < 500]))
    return {"centroid": round(centroid), "flatness": round(flat, 3), "low500": round(lowfrac, 3)}

# expected spectral character of each design (a sanity net, not a listening test)
SFX_EXPECT = {
    "snake": lambda s: s["centroid"] > 4000, "rain": lambda s: s["flatness"] > 0.05 and s["centroid"] > 1500,
    "thunder": lambda s: s["low500"] > 0.5, "whale": lambda s: s["centroid"] < 900, "owl": lambda s: s["centroid"] < 700,
    "bird": lambda s: s["centroid"] > 2800, "mouse": lambda s: s["centroid"] > 2800, "cow": lambda s: s["centroid"] < 1200,
    "wind": lambda s: s["centroid"] < 1800, "clock": lambda s: s["centroid"] > 1200,
}

# ----------------------------------------------------------------- speech
def pico(text, speed=None):
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as t:
        markup = f"<speed level='{speed}'>{text}</speed>" if speed else text
        subprocess.run(["pico2wave", "-l", "en-US", "-w", t.name, markup], check=True)
        sr, x = wavfile.read(t.name); os.unlink(t.name)
    x = x.astype(np.float64) / 32768
    # trim leading/trailing silence
    e = np.convolve(np.abs(x), np.ones(160) / 160, mode="same")
    idx = np.where(e > 0.01)[0]
    if len(idx): x = x[max(0, idx[0] - 400): idx[-1] + 800]
    return sr, x

def extract_phoneme(sym, cfg):
    """Return (sr, samples, info) for a held speech sound. Never a letter name."""
    hold = cfg["hold"]
    if cfg["mode"] == "synth-f":
        # /f/ is soft, broadband friction noise (labiodental). Pico's /f/ is too faint to cut out cleanly.
        sr = 16000; n = int(hold * sr)
        y = bandnoise(n, sr, 1200, 7800, order=4) * 0.35 + bandnoise(n, sr, 3000, 7800, order=2) * 0.15
        return sr, y * env(n, 0.05, 0.12, sr), {"segment_ms": None, "method": "synthesized labiodental friction noise"}
    sr, x = pico(cfg["src"])
    hop = 80; win = 256
    fr = []
    for i in range(0, len(x) - win, hop):
        f = x[i:i + win]; e = np.sqrt(np.mean(f ** 2)); z = np.mean(np.abs(np.diff(np.sign(f)))) / 2
        sp = np.abs(np.fft.rfft(f * np.hanning(win))); fq = np.fft.rfftfreq(win, 1 / sr); c = np.sum(fq * sp) / (np.sum(sp) or 1)
        fr.append((e, z, c))
    n = len(fr); peak = max(e for e, _, _ in fr)
    onset = next(i for i, (e, _, _) in enumerate(fr) if e > 0.05 * peak)
    if cfg["mode"] == "sonorant-start":            # e.g. the /m/ of "moon": low-centroid voiced hum before the vowel
        a = onset
        while a < n and fr[a][2] >= 380 and a < onset + 12: a += 1   # skip the breathy attack
        k = a
        while k < n and fr[k][2] < 380: k += 1
        a, b = a, k
    elif cfg["mode"] == "fixed-start":             # e.g. the /l/ of "leaf": first ~50 ms of voicing
        a, b = onset + 3, onset + 13
    elif cfg["mode"] == "fric-end":                # e.g. the /s/ of "bus", the /sh/ of "wish"
        k = n - 1
        while k > 0 and fr[k][1] < 0.3: k -= 1     # skip trailing silence
        end = k
        while k > 0 and fr[k][1] > 0.3: k -= 1
        a, b = k + 1, end
    else:
        raise ValueError(cfg["mode"])
    s0, s1 = a * hop, b * hop + win
    core = x[s0:s1]
    m = len(core); core = core[int(m * 0.2): int(m * 0.85)]
    if len(core) < int(0.03 * sr): raise RuntimeError(f"phoneme {sym}: segment too short ({len(core)} samples)")
    target = int(hold * sr); fade = min(int(0.012 * sr), len(core) // 4)
    w = np.ones(len(core)); w[:fade] = np.linspace(0, 1, fade); w[-fade:] = np.linspace(1, 0, fade)
    out = np.zeros(target + len(core)); pos = 0
    while pos < target:
        out[pos:pos + len(core)] += core * w
        pos += len(core) - fade
    out = out[:target] * env(target, 0.04, 0.1, sr)
    if sym == "sh":   # /sh/ friction peaks around 2.5-4.5 kHz; Pico's is bright, so emphasize that band a little
        b, a_ = signal.iirpeak(3200 / (sr / 2), 1.2)
        out = 0.6 * lowpass(out, sr, 6000) + 1.4 * signal.lfilter(b, a_, out)
    return sr, out, {"segment_ms": [round(s0 / sr * 1000), round(s1 / sr * 1000)], "method": f"steady part cut from Pico saying '{cfg['src']}', looped"}

PHONEME_EXPECT = {   # spectral identity of each sound (sh is also checked to sit below s)
    "s": lambda s: s["centroid"] > 4500, "sh": lambda s: 2500 < s["centroid"] < 5000, "f": lambda s: s["centroid"] > 2500 and s["flatness"] > 0.1,
    "m": lambda s: s["centroid"] < 700 and s["low500"] > 0.5, "l": lambda s: s["centroid"] < 1200 and s["low500"] > 0.25,
}

# ----------------------------------------------------------------- ASR intelligibility check
def norm_text(t):
    return re.sub(r"\s+", " ", re.sub(r"[^a-z' ]", " ", t.lower().replace("-", " "))).strip()

def asr_check(items):
    """items: [(id, wav path, expected text)] -> {id: (recognized, ok)} using a grammar of all game phrases."""
    from pocketsphinx import Decoder
    alts = " | ".join(sorted({norm_text(t) for _, _, t in items}))
    gram = "#JSGF V1.0;\ngrammar g;\npublic <s> = " + alts + " ;\n"
    gpath = os.path.join(tempfile.gettempdir(), "explorers.gram"); open(gpath, "w").write(gram)
    dec = Decoder(jsgf=gpath, samprate=16000, logfn=os.devnull)
    out = {}
    for iid, path, expect in items:
        sr, x = wavfile.read(path)
        dec.start_utt(); dec.process_raw(x.astype(np.int16).tobytes(), full_utt=True); dec.end_utt()
        hyp = dec.hyp().hypstr if dec.hyp() else ""
        out[iid] = (hyp, hyp.strip() == norm_text(expect))
    return out

# ----------------------------------------------------------------- main
def main():
    manifest = {}
    asr_items = []
    tmpdir = tempfile.mkdtemp()
    def speech(iid, text, kind):
        sr, x = pico(text, speed=85 if kind == "word" else 92)
        to_mp3(x, sr, iid, 40)
        p = os.path.join(tmpdir, iid + ".wav"); wavfile.write(p, sr, (x / (np.max(np.abs(x)) or 1) * 0.9 * 32767).astype(np.int16))
        asr_items.append((iid, p, text))
        manifest[iid] = {"kind": kind, "text": text, "dur": round(len(x) / sr, 2), "source": "SVOX Pico TTS (en-US), offline"}
    for k, name in SPEC["vocab"].items():
        speech("word-" + k, name, "word")
        speech("find-" + k, f"Find the {name}.", "find")
    for k, text in SPEC["clues"].items(): speech("clue-" + k, text, "clue")
    for k, text in SPEC["prompts"].items(): speech("prompt-" + k, text, "prompt")
    for sym, cfg in SPEC["phonemes"].items():
        sr, x, info = extract_phoneme(sym, cfg)
        st = spectral(x, sr); ok = PHONEME_EXPECT[sym](st)
        to_mp3(x, sr, "phoneme-" + sym, 48)
        manifest["phoneme-" + sym] = {"kind": "phoneme", "sound": sym, "dur": round(len(x) / sr, 2), "spectral": st, "spectral_ok": ok,
                                      "source": info.pop("method"), **info}
    if manifest["phoneme-sh"]["spectral"]["centroid"] > manifest["phoneme-s"]["spectral"]["centroid"] - 1200:
        manifest["phoneme-sh"]["spectral_ok"] = False   # /sh/ must sound lower than /s/
    for k, fn in SFX.items():
        x = fn(); st = spectral(x, SR_FX)
        ok = SFX_EXPECT.get(k, lambda s: True)(st)
        to_mp3(x, SR_FX, "sfx-" + k, 48)
        manifest["sfx-" + k] = {"kind": "sfx", "label": SPEC["sfx"][k]["label"], "dur": round(len(x) / SR_FX, 2), "spectral": st, "spectral_ok": ok,
                                "source": "synthesized by tools/audio/build_audio.py (sound design, not a field recording)"}
    res = asr_check([i for i in asr_items if i[0].startswith("word-")])
    res.update(asr_check([i for i in asr_items if not i[0].startswith("word-")]))
    for iid, (hyp, ok) in res.items(): manifest[iid]["asr"] = hyp; manifest[iid]["asr_ok"] = ok
    for iid in manifest:
        path = os.path.join(OUT, iid + ".mp3")
        manifest[iid]["bytes"] = os.path.getsize(path)
        manifest[iid]["sha1"] = hashlib.sha1(open(path, "rb").read()).hexdigest()[:12]
    json.dump(manifest, open(os.path.join(OUT, "manifest.json"), "w"), indent=1, sort_keys=True)
    speech_n = sum(1 for m in manifest.values() if "asr_ok" in m)
    asr_bad = [k for k, m in manifest.items() if "asr_ok" in m and not m["asr_ok"]]
    spec_bad = [k for k, m in manifest.items() if m.get("spectral_ok") is False]
    total = sum(m["bytes"] for m in manifest.values())
    print(f"{len(manifest)} files, {total/1024:.0f} KB. speech recognized {speech_n-len(asr_bad)}/{speech_n}. spectral checks failed: {spec_bad}")
    if asr_bad: print("ASR mismatches:", [(k, manifest[k]["text"], manifest[k]["asr"]) for k in asr_bad])
    open(os.path.join(OUT, "ATTRIBUTION.md"), "w").write(ATTRIBUTION)
    return 0 if not spec_bad else 1

ATTRIBUTION = """# Audio in Snake Explorers — Playful Worlds

All audio here was created for this project by `tools/audio/build_audio.py`; nothing was downloaded.

* **Spoken words, prompts and clues** — rendered offline with SVOX Pico TTS (`pico2wave`, en-US voice),
  Copyright 2008-2009 SVOX AG and The Android Open Source Project, Apache License 2.0.
* **Speech sounds** — /m/, /l/, /s/ and /sh/ are the steady part of that sound cut from a Pico word
  ("moon", "leaf", "bus", "wish") and looped by the script. /f/ is synthesized friction noise, because
  Pico's /f/ is too faint to cut out cleanly. Other beginning sounds
  (b, p, k, r, d) can't be held on their own without adding a vowel, so the game plays example words
  instead (e.g. "ball, bat, bee").
* **Animal and environment sounds** — synthesized by the script from simple source-filter and noise models.
  They are sound designs meant to suggest the real thing, not recordings of animals.

* **Checks** — automatic speech recognition (pocketsphinx, constrained grammar) and spectral checks only.
  These do not prove a child can recognise a sound. **No clip has been listened to by a person yet.**

Released with the rest of this project under the MIT licence.
"""

if __name__ == "__main__":
    sys.exit(main())
