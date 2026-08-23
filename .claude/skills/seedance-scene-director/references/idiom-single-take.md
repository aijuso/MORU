# Single continuous take idiom

One unbroken camera position, real time, no cuts. A different structure from the multi-shot idiom — and worth reaching for when the drama lives in *not* cutting.

## When to use it

- A physical action chain that must read as continuous: reach → lift → rise → coil
- An unbroken reaction, where a cut would let the model reset the performance
- A single space with a single event, where cutting would only add risk
- Anything where "we watched this happen" is the point

Do **not** use it just because the clip is short. A 7s clip with two beats is still multi-shot.

---

## Shape

The distinguishing feature: **OPTICS, CAMERA and ACTION TIMING are top-level blocks**, not nested inside shots. There are no shots.

```
SCENE CONTEXT
ACTIVE REFERENCES
LOCATION MAP
FIRST FRAME AND SPATIAL BLOCKING
FORMAT MODE
OPTICS
CAMERA
ACTION TIMING
PHYSICS
LIGHTING
AUDIO
POSITIVE LOCKS
```

STYLE is frequently absent in this idiom — the look is carried in LIGHTING's closing sentences:

> Warm filmic color, gentle grain, soft naturalistic ad-photo texture matching the location reference.

---

## FORMAT MODE

> SINGLE CONTINUOUS TAKE. Real-time motion. No cuts, no montage, no transition effects.

All caps on the first phrase. Three separate denials, because models insert cuts.

---

## OPTICS

Field of view, lens character, **physical camera distance**, depth of field, and a lens lock.

> 47° diagonal field of view, standard normal lens character, natural human-eye perspective, zero distortion. Camera sits about 1 meter behind the laptop and 1.5 meters from @MAN's face, holding that distance for the whole take — close enough that his expressions and the 3 cm fairy read large and sharp. Shallow comfortable depth of field: the laptop lid edge, the man and the fairy sharp; the room behind him melts into soft warm bokeh. **LENS LOCK 47°, no drift, no zoom, no push-in.**

The distance statement does real work: it fixes scale, which is what keeps a 3 cm character 3 cm.

---

## CAMERA

Its own block, and this is where the idiom earns its keep. Describe the operator, not just the rig.

> Handheld camera positioned behind the laptop, slightly above desk height, framing @MAN frontally over the lid. It stays in this one position for the whole take, alive with light handheld shake — natural breath sway, micro-settling, tiny weight shifts, small human corrections — never digital jitter. At 3.0s the operator tilts down briefly as @MAN leans under the desk, then tilts up from the same spot to keep his head and the raised bat in frame as he rises into the windup, the laptop lid staying anchored at the bottom of frame. At 5.5s the camera gives one tiny startled jolt as the fairy shoots up from behind the lid, then breathes quietly in place through the dialogue, easing a few degrees down at 10.2s as the fairy dives back behind the lid. No arcs, no tracking, no reframing beyond these small in-place moves.

Two techniques worth stealing into any idiom:

**Handheld texture defined by what it is not.** `natural breath sway, micro-settling, tiny weight shifts, small human corrections — never digital jitter.` Without the negative, models produce mechanical noise.

**An exhaustive whitelist of permitted moves.** Every camera motion is enumerated with its timestamp and motivation, then closed: `nothing more.` Anything not listed is forbidden by omission — and the closing sentence makes that explicit.

---

## ACTION TIMING

A single continuous timeline. Ranges with a colon, contiguous, covering the full duration.

```
0.0s–2.0s: frontal over the lid. @MAN stares at the screen in brooding thought — still
hands, slow blink, thumb pressed against his lips, eyes down on the display.

2.0s–3.0s: the thought curdles into anger: jaw tightens, nostrils flare, eyes narrow, one
hard exhale; his hand slides off his lips into a fist.

3.0s–4.2s: he leans down out of frame center, pulls @BAT out from under the desk by the
handle with his right hand, wraps both hands around it and springs up out of the chair;
the swivel chair rolls back half a meter on the parquet and settles.

4.2s–5.5s: standing over the desk, he coils into a full windup — bat raised high past his
shoulder, knuckles whitening, torso loaded, eyes locked down on the screen, one sharp
inhale. The swing itself never begins; the bat never descends.
```

Granularity runs to 0.1s. Ranges are as short as 0.7s for a single physical beat.

---

## Frame coordinates

This idiom's signature tool. Percentage positions inside the frame, used in FIRST FRAME and at key moments in ACTION TIMING.

> the open laptop large in the lower-left foreground, x 30%, y 55–90%, its lid edge crossing the frame; @MAN in profile just behind it, framed chest-up in the right half, x 60–78%, y 25–85%; the small cup and books between them around x 45%, y 75%; @BAT partly visible under the desk in the lower-right corner, x 85%, y 88–100%.

> @FAIRY holds the air between the lid's top edge and @MAN's face, about 40 cm from his eyes, around x 50%, y 42%.

Use when: composition is load-bearing, an object must not drift, or a small element must stay findable. Skip when the framing is conventional — coordinates on a normal medium shot are noise.

---

## Semantic aliasing

Long single-take prompts repeat their subjects dozens of times. Bind an alias once and use it throughout:

```
@MAN (image 2): mid-20s lean man, shoulder-length light-brown hair, light stubble, pale
yellow chore jacket over white t-shirt, cream trousers. 100% matches the reference.
@FAIRY (image 3): elderly gentleman fairy exactly 3 cm tall — ...
@BAT (image 4): wooden baseball bat, amber handle fading into a dark green barrel.
```

Then: `@MAN startles hard`, `@FAIRY holds the air`, `he pulls @BAT out from under the desk`.

Far safer than `<<<image_2>>> startles hard` — a number swap is invisible, an alias swap is obvious. Bind aliases to slots exactly once, and never mix aliasing with raw tokens in the same prompt.

---

## Absence with a plan

When a character appears partway through, state the absence, the mechanism, and both timestamps:

> @FAIRY is intentionally absent until 5.5s: he is inside the laptop, shoots up from behind the lid at 5.5s, and dives back down behind it at 10.2s.

---

## Camera position drives everything downstream

Two production prompts covered the same scene with the camera moved. Almost every other block changed as a consequence. Use this as a checklist whenever you reposition:

| | Side camera | Frontal camera |
|---|---|---|
| Camera | near corner of desk, desk height | behind the laptop, above desk height |
| Subject facing | profile, facing screen-left | frontal to camera, eyes down to screen |
| Window | behind the man | behind the camera |
| Lighting | backlit rim + room bounce fills the face | window falls frontally onto his face |
| Fairy entrance | bursts out of the visible display | rises from behind the lid's top edge |
| Fairy exit | dives into the screen | drops down behind the lid |
| Screen flare | seen directly | seen as a wash on his face and a glow over the lid edge |

**Moving the camera is not a framing change. It is a rewrite of LIGHTING, blocking, entrances, exits, and every visibility claim.** Re-derive them mechanically, then re-run the gates.

---

## Actions that must not complete

The single-take idiom often stages a windup with no swing, a raised hand with no strike. Models complete gestures. Deny the completion three times — in ACTION TIMING, in FIRST FRAME or CAMERA, and in POSITIVE LOCKS:

> The swing itself never begins; the bat never descends.

> The strike never happens: the bat stays raised at the top of the windup, never descends, and the laptop remains intact and untouched for the entire shot; there is no desk hit anywhere.

Phrase it as a **maintained state** (`stays raised`), not only as a prohibition (`never descends`).
