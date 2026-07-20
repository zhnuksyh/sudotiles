# Trailer background music

Drop **one** audio file in this folder and the trailer will loop it under the
sound effects automatically — no code change needed.

- Supported names: any file matching `track.*` — e.g. `track.mp3`, `track.ogg`,
  `track.m4a`, `track.wav`. Just rename your file to `track.mp3` (or similar).
- It is imported as a **bundled asset** (hashed URL), so it resolves correctly
  under the `/sudotiles/` GitHub Pages base — don't reference it by a raw path.
- Until you add a file, the trailer plays a soft synthesized bed instead, so it
  never sounds silent.
- Keep it loopable and reasonably short (the trailer runs ~25s); it loops.

That's the whole setup — add `track.mp3` here and rebuild.
