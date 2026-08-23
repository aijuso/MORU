# Multi-shot idiom — the default

Hard cuts inside a single generation. One prompt produces one clip containing several framings.

This is the dominant form in production narrative work. Use it unless the scene specifically needs an unbroken take.

---

## Shape

```
FORMAT MODE
Multi-shot sequence, 15 seconds, horizontal cinematic. Hard cuts at 5.0s and 9.5s.

SHOT A — SHE WALKS WITH THE BOOKS (0.0s to 5.0s)
OPTICS: 45° diagonal field of view, normal lens, camera at eye level, full-body
medium-wide, held level.
ACTION: Haruka walks down the corridor carrying the stack of textbooks piled to just
under her chin, her face visible above them. She takes small, careful, weight-heavy
steps, arms straining around the books, chin tucked slightly over the top of the stack
to keep it steady. The stack shifts a little; she adjusts and keeps moving. She blinks
and breathes with the effort. Sunlight falls across her from the corridor windows.

5.0s HARD CUT

SHOT B — THE BOOKS ARE LIFTED AWAY — IDENTITY HIDDEN (5.0s to 9.5s)
OPTICS: ...
ACTION: ...

9.5s HARD CUT

SHOT C — REVEAL: HE HOLDS THEM, THEN WALKS ON (9.5s to 15.0s)
OPTICS: ...
ACTION: ...
```

**OPTICS and ACTION are nested inside each shot**, immediately adjacent. This is the key structural difference from the single-take idiom, and it exists so that a framing can never be mismatched to the wrong action. Do not hoist them to top level in this idiom.

---

## Shot count and duration

Observed in shipped work:

| Shots | Duration | Content |
|---|---|---|
| 2 | 7s | asleep → woken |
| 2 | 8s | asleep → awake and interested |
| 3 | 15s | walk → books lifted → reveal |
| 3 | 15s | bow → introduction → room warms |
| 3 | 15s | Mei arrives → Haruka remembers → empty seat |
| 5 | 15s | seat assigned → crossing → teacher leaves → gaze travels → the boy |

Five shots in fifteen seconds is fine. Shots as short as 2.0s work when they are a single held image (`SHOT E — THE BOY AT THE WINDOW (13.0s to 15.0s)`).

What does not work is two dramatic beats inside one shot. That is the overload that breaks staging.

---

## Shot titles

State the **function**, in caps, after an em dash. If the shot has a staging secret, put it in the title.

```
SHOT A — THE BOW AND THE REVEAL (0.0s to 3.5s)
SHOT B — THE BOOKS ARE LIFTED AWAY — IDENTITY HIDDEN (5.0s to 9.5s)
SHOT C — REVEAL: HE HOLDS THEM, THEN WALKS ON (9.5s to 15.0s)
SHOT A — WOKEN (0.0s to 4.0s)
SHOT B — AWAKE AND INTERESTED (4.0s to 8.0s)
SHOT D — HER GAZE TRAVELS (11.0s to 13.0s)
SHOT E — THE BOY AT THE WINDOW (13.0s to 15.0s)
SHOT C — THE EMPTY SEAT (11.5s to 15.0s)
```

---

## Triple cut declaration

Every cut is declared three times. This is not redundancy — dropping any one of the three has produced drifting or invented cuts.

1. In FORMAT MODE: `Hard cuts at 5.0s and 9.5s.`
2. As a standalone line between shots: `5.0s HARD CUT`
3. In the shot heading range: `SHOT B — TITLE (5.0s to 9.5s)`

Ranges must be contiguous and must sum to the declared duration. No gaps, no overlaps.

---

## OPTICS line

One line. Field of view in degrees, lens character, camera height, framing size, and stability.

```
OPTICS: 45° diagonal field of view, normal lens, camera at eye level, full-body medium-wide, held level.

OPTICS: 29° diagonal field of view, short telephoto portrait lens character, camera 4 to 5
meters from her. Close framing achieved through lens reach — chest-up on Haruka, her face
razor-sharp, the green chalkboard and the soft shape of Ms. Tanaka behind her compressed
into creamy bokeh.

OPTICS: 40° diagonal field of view, normal lens. Camera positioned LOW and BEHIND the male
figure, shooting past his back and shoulder toward Haruka — so he reads only as a dark,
backlit silhouette in the foreground: the back of a navy blazer, a shoulder, an arm
reaching in. His face and features are NOT visible.

OPTICS: 48° diagonal field of view, normal lens, camera locked off at eye level behind
Haruka's desk — a completely static shot, no pan, no push, no handheld drift.
```

Capitals are used for load-bearing words: `LOW and BEHIND`, `NOT visible`, `MEDIUM CLOSE-UP`. Use sparingly and only where a misread would break the shot.

Camera movement, when it exists, is bounded and small:

```
close-up on Haruka at her desk, chest-up, slow subtle push-in of 3 to 4 centimeters
following Haruka in a slow gentle arc as she moves down the aisle
```

Default is locked. Declare movement explicitly or you will get drift.

---

## ACTION paragraph

Present tense, one beat, physical specifics. Timestamps go inside when an event has to land at a moment:

> At approximately 1.8s a hand reaches in from the side of frame and raps sharply on his desktop — knuckles on wood, twice. He stirs at the knock: his shoulders shift, his head lifts off the desk, and he comes up blinking, dazed, surfacing from sleep. The hand withdraws out of frame.

Performance is written as observable body, never as inner state alone:

> Realization crosses Haruka's face — eyebrows lifting, a small "ah" of memory.

> The sleepy blur drops out of his eyes; his eyebrows lift, his gaze sharpens with real curiosity. He's interested, and in this moment he's not hiding it.

> He looks down at Haruka with a calm, unreadable poker face — no smile, no words, a level gaze — holds it a beat, then turns away and walks off down the corridor with the books, unhurried.

Crowd behaviour is described as a wave with named individuals, not as a mass:

> The seated students turn their heads toward her. Faces open. A smile ripples across the rows, one after another, spreading back through the room. A girl in the second row nudges her neighbour. Someone nods. A boy near the window grins. Every student stays in their chair.

---

## DIALOGUE line

Sits inside the shot, after ACTION or inline where it lands.

```
DIALOGUE (begins at 0.4s): 真ん中に空いてる席があるから、そこに座って。

DIALOGUE (Mei, bright and quick, begins at 0.4s): はるかさん、職員室に教科書を取りに行ってって。
あ、それと、私、メイっていうの。よろしくね。

DIALOGUE (the boy beside him, whispered, urgent, begins at 4.2s): レン、先生来たぞ。
```

Multiple short lines with individual timing and delivery:

```
DIALOGUE (Haruka, spoken aloud):
(0.4s, playful, intrigued) ふーん…
(3.8s, reluctant, unsure, half-groaning) えぇ…こんなに持てるかな…
```

See `dialogue-timing.md` before writing any line.

---

## Continuing from a previous clip

```
<<<video_1>>> — continuity lead-in: the Take 2 clip. Controls the seating arrangement of
the sixteen students, the room's geography, the light, and the early-2000s film texture.
This take continues seamlessly from its final state — same students in the same seats,
same soft milky daylight.
```

Then in FIRST FRAME:

> First frame continues <<<video_1>>>: Ms. Tanaka at the front, turning to Haruka, her open hand already lifting toward the empty desk mid-room.

And in STYLE:

> Matches <<<video_1>>>.

And in POSITIVE LOCKS:

> Continuity flows from <<<video_1>>> — the same sixteen students in the same seats, same room, same light.

Four touchpoints. Continuity across generations is fragile; state it everywhere it applies.
