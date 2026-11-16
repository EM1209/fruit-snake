# Audio in Snake Explorers — Playful Worlds

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
