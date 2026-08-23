# V2V motion transfer, audio-driven lip sync, and fidelity re-render

Three related idioms, all built on Seedance 2.0's multimodal inputs. Verified input
budget (Higgsfield, 2026): **up to 9 images + 3 video clips (≤15s each) + 3 audio
clips (≤15s each) in one generation call.** Videos bind as `<<<video_N>>>`, audio as
`<<<audio_N>>>`, in attachment order. Always wrap them in semantic aliases in
ACTIVE REFERENCES (`@V_CHOKE (<<<video_1>>>)`, `@VOICE (<<<audio_1>>>)`).

---

## 1. Motion source lock (V2V)

Use when the user has real footage of a motion (often exported from their editor —
webcam wipes, stream archive cuts, phone videos) and wants that exact performance
transferred onto a different character / wardrobe / world.

**The prompt opens with a source-lock header, before everything else:**

```
⚠️ MOTION SOURCE LOCK — READ FIRST ⚠️
Build on @V_SOURCE (<<<video_1>>>). KEEP 1:1 from the source, frame-accurate:
[the body choreography — enumerate what you saw: head bobs, arm rises at ~N s,
the final snap] and its EXACT timing. KEEP the source camera: [static / framing /
scale / angle]. Do NOT re-time, re-frame, smooth, or reinterpret any motion.

REPLACE (from the tokens below, never from the source video):
- environment → @LOC ...
- wardrobe and hair → @CHARACTER ...
- lighting on him → [scene light]
```

Rules that came out of real production:

- **Analyze the clip before writing.** Pull frames (ffprobe/OpenCV), note duration,
  fps, what the body does at which second, and where the motion out-point is. The
  KEEP list must enumerate observed motion, not paraphrase it.
- **One clip = one motion**, exported at the target generation duration when
  possible. Cropped so the subject fills the frame.
- **Matted sources**: if the background was keyed out to black, say so explicitly —
  `the source's black matte is removed footage, not a night scene` — or the model
  reads it as night lighting.
- **Selective locks are legal.** You may keep upper-body + mouth from the source and
  add generated motion beneath it (`ADDED MOTION: he is WALKING slowly forward —
  the source shows only his upper body; generate a natural amble beneath the
  source's exact upper-body performance`). State what the source does NOT show.
- **Camera vs. added locomotion:** if you add a walk, a static camera loses the
  subject. Track backward at walking pace, holding the source's framing.
- **Source shorter than the generation:** lock 0→N s to the source, then write the
  continuation explicitly (`3.0s–5.0s — continuation (source ended): ...`), and lock
  the seam: `continues without any pose jump at the seam`.
- **Discard source audio explicitly** (unless using §2):
  `Completely remove and discard ALL original audio from @V_SOURCE — none of the
  source sound may remain.` If the real voice will be laid over in the edit, also
  demand a voice-free SFX bed: `No generated human voice of any kind — no mumbling,
  no breath vocalizations, no crowd speech; the SFX track must contain zero voice.`

---

## 2. Audio input and lip sync (`<<<audio_1>>>`)

Seedance 2.0 accepts audio natively. An uploaded voice clip drives lip sync directly
— **prefer this over generate-then-lipsync-tool pipelines.**

```
ACTIVE REFERENCES
@VOICE (<<<audio_1>>> / attach: line.mp3) — the voice track, N.N s, [language,
one-line character of the audio: "Japanese male speech ending on one sharp shout"].
This is the authoritative source for his lip sync: his mouth articulates this exact
audio, starting at 0.0s; after N.N s he falls silent.
```

- **One mouth authority.** If a motion-source video AND a voice file are both
  attached, declare priority once in the source lock:
  `LIP SYNC PRIORITY: his mouth is driven by @VOICE, not by the source video's
  mouth — where the two conflict, the audio wins.` (When the video and audio are
  the same recording they agree naturally — the ideal case.)
- In AUDIO, build SFX **around** the voice: `Around the voice, generate diegetic
  SFX only, mixed low under the speech ... No other human voice of any kind.`
- Time the ACTION beats to the audio's internal events (the shout syllable lands on
  the arm-raise), and write the post-audio silence explicitly (`his mouth stays
  closed` after the clip ends).
- Never transcribe the line into the prompt as dialogue for the model to perform —
  the audio file is the performance; text would invite reinterpretation.

**Edit-room note block (optional, recommended):** when the audio will be handled in
post, prepend a clearly labeled non-instruction block —
`[AUDIO SPEC — EDIT-ROOM NOTE, NOT AN INSTRUCTION TO THE MODEL]` — with file name,
duration, the line, and the sync map. Keeps prompt files self-documenting.

---

## 3. Credit discipline (verified numbers, Higgsfield 2026)

5-second clip: **480p ≈ 15 cr / 720p ≈ 23 cr / 1080p ≈ 45 cr.** Adding audio costs
**+50–100%.**

Standard workflow: **iterate ("gacha") at 480p, no audio → add audio only once
motion/composition is approved → upscale only the winning takes.** Re-rolling is
selection, not failure — budget for it at the cheapest tier.

---

## 4. Fidelity re-render (upscale-by-regeneration)

Goal: take an approved low-res clip and regenerate it at higher resolution with the
identical content but restored detail. Resolution itself is set in the UI, never in
the prompt.

**Hard-won lesson: an over-locked "reproduce 1:1" prompt reproduces the softness
too.** The source's image quality is part of "the source's look" — if every line
screams *copy*, the model copies the blur. First attempt failed exactly this way:
perfect composition, faithfully soft. The fix is a SHORT prompt that (a) keeps only
content dimensions, (b) explicitly disowns the source's image quality, (c) names the
softness a failure condition, and (d) binds image references as texture ground truth.

Template (keep it this short):

```
=== HIGH-FIDELITY RE-RENDER of <<<video_1>>> ===

<<<video_1>>> is an approved shot generated at low resolution. Re-render it with
dramatically higher detail and sharpness.

KEEP from <<<video_1>>>: the composition, framing, camera movement, all subject
motion, mouth timing, event timing, and the audio — exactly as they are.

DO NOT KEEP the source's image quality. Its softness, blur, and smeared texture are
low-resolution artifacts, not creative choices. Reproducing that softness is a
failure. Every frame of the output must be far sharper than the source.

RESTORE fine detail inside the source's exact forms, using the attached images as
texture ground truth:
@CHARACTER — [face/wardrobe micro-detail to restore]
@LOC — [environment micro-detail to restore]

Add detail only as texture — never new objects, people, light sources, or changed
geometry. Preserve the source audio untouched. No music, no subtitles.

Crisp photoreal texture, fine film grain, razor sharpness. High detail. 4K Ultra HD.
Sharp clarity. Stable lighting. Consistent frame rate. Clean picture.
```

Notes:
- Deliberately omit `lighting and grade` from KEEP — the video itself carries them,
  and locking them in text drags the image quality into the copy.
- If the platform exposes a reference-strength slider, lowering the video reference
  one step helps decouple content from quality.
- **Escalation path** if regeneration still comes back soft: (1) a dedicated video
  upscaler (Higgsfield Video Upscale / Topaz) — zero gacha, default choice;
  (2) hybrid: export the clip's first frame, restore its detail with an image model
  (texture-restoration prompt against the character/location sheets), then
  regenerate with that frame as first-frame + the clip as motion source, declaring
  `the video drives ONLY motion, camera and timing — its softness is an encoding
  artifact and must NOT be reproduced; where the video is soft, the first frame's
  sharpness wins.` Reserve (2) for hero shots.

---

## 5. Failure cases from this idiom's production history

**The 1-second transition / opening wall panels.** A world-transformation was written
as `5.5s–6.5s: THE TRANSFORMATION` — the model obeyed the 1-second window, and
realized the room-to-hilltop change by *opening the wall panels* (cheapest physical
reading of "the padded wall panels become sky"). Fixes: give transitions real time
(3s), call the mechanism (`one slow even cross-dissolve`), and name the failure
shapes: `no wall or panel opens, slides, splits, peels or lifts; no portal, no
shockwave, no light sweep`.

**The 2.5-meter match cut.** A silhouette match cut across a world change was
anchored with `camera 2.5 meters behind the seated figure`. A chair and a boulder
have different physical sizes, so honoring the distance changed the subject's
on-screen size — the match broke. **Physical camera distances and silhouette
matches are incompatible constraints.** Fix: delete distances; define the subject
by screen percentages in a dedicated FRAMING LOCK block, pinned at several
timestamps, with an explicit priority clause: `if any other instruction would
change his size on screen, THIS lock wins.` Also freeze the pose across the
dissolve window — a body in motion cannot be matched.

**Oversized gestures.** `both hands flying up in a shrug then chopping the air` is
strong acting direction; the model performed it. For natural talking, write small:
`relaxed and conversational ... a small nod here, a shift of weight there ...
nothing theatrical, no big arm movements`.
