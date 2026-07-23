# Learn-trailer background music

**By default this folder is empty and `/trailer2/` scores to the same track as
`/trailer/`** — `audio.ts` falls back to `../trailer/music/track.*`, importing it
so both pages share one hashed asset instead of shipping the file twice.

To give this trailer its **own** music, drop **one** audio file here and it wins
over the shared one automatically — no code change needed.

- Supported names: any file matching `track.*` — e.g. `track.mp3`, `track.ogg`,
  `track.m4a`, `track.wav`. Just rename your file to `track.mp3` (or similar).
- It is imported as a **bundled asset** (hashed URL), so it resolves correctly
  under the `/sudotiles/` GitHub Pages base — don't reference it by a raw path.
- With neither this folder nor `trailer/music/` populated, the trailer plays a
  soft synthesized bed instead, so it never sounds silent.
- This trailer is a teaching piece — pick something unobtrusive that the
  narration reads over.

That's the whole setup — add `track.mp3` here and rebuild.
