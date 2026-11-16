/* clips.ts — bundled audio for Playful Worlds.
 *
 * Every clip is an MP3 inlined into the single HTML file as base64 (no fetch, no
 * media URLs), decoded with WebAudio on first use. That works offline and inside
 * a strict artifact CSP. Voice clips obey the Voice switch, sound designs obey the
 * Sound effects switch. If decoding or playback fails, spoken clips fall back to
 * the device voice and the on-screen caption always carries the same words, so a
 * child is never stuck behind a sound they cannot hear.
 */
import manifestJson from "./assets/audio/manifest.json";

type Entry = { kind: string; text?: string; dur: number; source?: string; sound?: string; label?: string };
export const MANIFEST = manifestJson as unknown as Record<string, Entry>;

const FILES = import.meta.glob("./assets/audio/*.mp3", { query: "?inline", import: "default", eager: true }) as Record<string, string>;
const DATA: Record<string, string> = {};
for (const [path, url] of Object.entries(FILES)) DATA[path.replace(/^.*\/(.*)\.mp3$/, "$1")] = url;

export type ClipStatus = "idle" | "ready" | "unavailable";
type Ctx = AudioContext;

let ctx: Ctx | null = null;
let status: ClipStatus = "idle";
let lastError = "";
const buffers = new Map<string, AudioBuffer>();
const failed = new Set<string>();
let voiceOn = true, soundOn = true;
let playing: AudioBufferSourceNode[] = [];
let token = 0;
const listeners = new Set<(e: { id: string; ok: boolean; via: string }) => void>();

export const has = (id: string) => id in DATA;
export const ids = () => Object.keys(DATA);
export const isVoice = (id: string) => /^(word|find|clue|prompt)-/.test(id);
export function setVoice(v: boolean) { voiceOn = v; if (!v) stopKind("voice"); }
export function setSound(v: boolean) { soundOn = v; if (!v) stopKind("sound"); }
export const getStatus = () => ({ status, lastError, decoded: buffers.size, failed: Array.from(failed) });
export function onPlay(f: (e: { id: string; ok: boolean; via: string }) => void) { listeners.add(f); return () => listeners.delete(f); }
const emit = (id: string, ok: boolean, via: string) => listeners.forEach(f => { try { f({ id, ok, via }); } catch { /* listener errors never break audio */ } });

function context(): Ctx | null {
  if (ctx) return ctx;
  try {
    const AC = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    if (!AC) { status = "unavailable"; lastError = "no WebAudio"; return null; }
    ctx = new AC();
    return ctx;
  } catch (e) { status = "unavailable"; lastError = String(e); return null; }
}

function b64ToBuffer(dataUrl: string): ArrayBuffer {
  const b64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

export async function decode(id: string): Promise<AudioBuffer | null> {
  if (buffers.has(id)) return buffers.get(id)!;
  if (failed.has(id) || !DATA[id]) return null;
  const c = context(); if (!c) return null;
  try {
    const buf = await c.decodeAudioData(b64ToBuffer(DATA[id]));
    buffers.set(id, buf); status = "ready";
    return buf;
  } catch (e) { failed.add(id); lastError = id + ": " + String(e); return null; }
}

/** Decode a few clips ahead of time (call on a user gesture). Resolves with readiness. */
export async function prepare(list: string[]): Promise<ClipStatus> {
  const c = context(); if (!c) return status;
  try { if (c.state === "suspended") await c.resume(); } catch { /* resumes on next gesture */ }
  await Promise.all(list.filter(has).map(decode));
  if (list.some(id => buffers.has(id))) status = "ready";
  else if (list.length && list.every(id => failed.has(id) || !has(id))) status = buffers.size ? "ready" : "unavailable";
  return status;
}

function stopKind(kind: "voice" | "sound" | "all") {
  playing = playing.filter(src => {
    const k = (src as unknown as { _kind: string })._kind;
    if (kind === "all" || k === kind) { try { src.stop(); } catch { /* already stopped */ } return false; }
    return true;
  });
  if (kind !== "sound") { try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch { /* none */ } }
}
export function stop() { token++; stopKind("all"); }

function speakFallback(text: string): Promise<boolean> {
  return new Promise(res => {
    try {
      const s = window.speechSynthesis; if (!s || !text) return res(false);
      const u = new SpeechSynthesisUtterance(text); u.rate = 0.88; u.lang = "en-US";
      let done = false; const fin = (ok: boolean) => { if (!done) { done = true; res(ok); } };
      u.onend = () => fin(true); u.onerror = () => fin(false);
      s.speak(u); setTimeout(() => fin(true), Math.max(1500, text.length * 90));
    } catch { res(false); }
  });
}

/** Play one clip. Resolves when it ends (or at once if muted). */
export async function play(id: string, opts: { gain?: number } = {}): Promise<boolean> {
  const voice = isVoice(id);
  if ((voice && !voiceOn) || (!voice && !soundOn)) { emit(id, false, "muted"); return false; }
  const my = token;
  const buf = await decode(id);
  if (my !== token) return false;
  const c = ctx;
  if (!buf || !c) {
    const text = MANIFEST[id] && MANIFEST[id].text;
    if (voice && text) { emit(id, true, "device-voice"); return speakFallback(text); }
    emit(id, false, "failed"); return false;
  }
  try { if (c.state === "suspended") await c.resume(); } catch { /* ignore */ }
  return new Promise(res => {
    try {
      const src = c.createBufferSource(); const g = c.createGain();
      g.gain.value = opts.gain ?? (voice ? 1 : 0.8);
      src.buffer = buf; src.connect(g).connect(c.destination);
      (src as unknown as { _kind: string })._kind = voice ? "voice" : "sound";
      src.onended = () => { playing = playing.filter(p => p !== src); res(true); };
      playing.push(src); src.start();
      emit(id, true, "clip");
      setTimeout(() => res(true), buf.duration * 1000 + 400);
    } catch (e) { lastError = String(e); emit(id, false, "failed"); res(false); }
  });
}

/** Play clips one after another with a gap, e.g. example words for a beginning sound. */
export async function chain(list: string[], gapMs = 350): Promise<void> {
  stop();
  const my = token;
  for (const id of list) {
    if (my !== token) return;
    await play(id);
    if (my !== token) return;
    await new Promise(r => setTimeout(r, gapMs));
  }
}

export const textOf = (id: string) => (MANIFEST[id] && (MANIFEST[id].text || MANIFEST[id].label)) || "";
