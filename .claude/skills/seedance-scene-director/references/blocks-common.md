# Common Blocks — writing guide

The spine shared by every narrative prompt. Order matters: the model reads top to bottom, and later blocks are read as constraints on earlier ones.

## Contents

1. SCENE CONTEXT
2. ACTIVE REFERENCES
3. CHARACTER NOTES
4. LOCATION MAP
5. FIRST FRAME AND SPATIAL BLOCKING
6. FORMAT MODE
7. Shot bodies
8. PHYSICS
9. LIGHTING
10. STYLE
11. AUDIO
12. POSITIVE LOCKS

---

## 1. SCENE CONTEXT

One paragraph. What happens, where, when, in what emotional register. Written as a synopsis, present tense, plain prose.

Its real job is to declare **the dramatic shape** so every later block can be checked against it.

> A Japanese school corridor, late morning, early-2000s film mood. Haruka walks down the hallway carrying a stack of textbooks piled up to just under her chin, her face visible above them. Then, without a word, someone lifts the greater part of the stack away — we don't yet clearly see who. She stares up, stunned, blinking twice. Only then, in the next shot, is it revealed to be Ren.

Note what is already encoded here: the books stop at the chin (so her face stays visible), the lifter is concealed, the reveal is deferred to a specific shot. The context block is where staging intent gets stated before it becomes constraints.

If the take continues from a previous clip, say so in the first line: `Continues seamlessly from <<<video_1>>> — the applause has just settled.`

---

## 2. ACTIVE REFERENCES

One line per reference. Token, subject, description, then `Controls …`.

```
<<<image_2>>> — Haruka: 17, long straight dark hair worn down, navy blazer with silver
buttons, white blouse, red-and-white plaid ribbon bow, grey plaid pleated skirt, white
knee-high socks, black loafers. Controls her face identity, hair, build, and outfit.
```

**Description depth**: enough to survive if the reference is weakly applied. Garment by garment, colour by colour. `navy blazer` is not enough; `navy blazer with silver buttons` is.

**Controls clauses** seen in production:

- `Controls her face, hair, and outfit.`
- `Controls the corridor.`
- `Controls room geometry, furniture placement, materials and warm daylight atmosphere.`
- `Controls the environment only, not the characters.`
- `Controls the seating arrangement of the sixteen students, the room's geography, the light, and the film texture.`

**Negative clauses** — use whenever a reference photo has framing you do not want:

> The reference image's camera angle and framing are not inherited; this shot uses its own camera defined below.

**Timed identity** — for reveals:

> Controls his face, hair, and outfit — his face is kept hidden until Shot C.

**Behavioural clauses** are allowed on a character reference and are often where the performance is really specified:

> He has no wings and flies by smooth wingless levitation. He does not glow or emit any light: a matte, unlit miniature figure lit only by the room's daylight.

**State clauses** carry continuity between takes:

> current state: brooding focus turning to anger, then a hard startled fright, then wary amazement. 100% matches the reference.

**Never** put a person inside a location reference. If a body acts or speaks, it gets its own token — even an unnamed extra.

---

## 3. CHARACTER NOTES

Optional. Include when performance nuance matters more than blocking.

Psychology, not appearance. Appearance belongs in ACTIVE REFERENCES.

> Ms. Tanaka is a warm, anxious people-pleaser — kind, faintly clumsy, incurably optimistic, with no natural authority and no wish for any. She smiles before anyone else does, nods a beat too many times, and scans the students' faces hoping for a friendly reaction.

> Ren is closed, still, and unreadable — he lifts the heavy books effortlessly and shows nothing; feeling everything, showing nothing.

This block is also the right place for **proportion constraints**, which are otherwise easy to lose:

> He is taller than Haruka, but a normal, realistic student height — clearly shorter than the corridor doors and door frames, an ordinary human proportion, never towering or exaggeratedly tall.

---

## 4. LOCATION MAP

The floor plan. Where everything is relative to everything else, in words.

Anchor to **screen-left / screen-right** and restate it per camera angle:

> Front angle (camera at back → board): windows screen-left, "2-A" door screen-right.
> Reverse angle (camera at board → class): windows screen-right, door screen-left, the empty desk reading center-left.

Include: fixed geography, where each character starts, what is off-screen but audible, and — critically for Gate 4 — **every openable thing and its distance**.

> Ren's desk is the BACK-ROW corner hard against that window wall — the window immediately beside him, the chalkboard far off at the front. Another male student sits at the desk directly beside Ren, close enough to reach across and rap on his desktop. The classroom door is far off at the front of the room, off-screen.

That last sentence is doing safety work: it tells the model the door is far, so a "walk to the door" beat gets budgeted.

---

## 5. FIRST FRAME AND SPATIAL BLOCKING

Video models condition hard on frame one. Describe it as a still photograph.

Requirements:

- Everyone's position, posture, and facing
- What is in focus and what is soft
- **Explicitly forbid an establishing frame**: `No empty establishing frame, no frontal opening.`
- **Declare absences with a plan**: `<<<image_3>>> is intentionally absent until 5.5s: he is inside the laptop, bursts out at 5.5s, and dives back into the screen at 10.2s.`
- **Declare the headcount**: `Exactly two characters appear in this shot; the room is otherwise empty.`
- If the project locks level horizons, restate here: `First frame — level, straight, well-composed, flat true horizon:`

If a character is mid-action at frame one, say so — it prevents a dead beat at the head of the clip:

> First frame: <<<image_4>>> mid-action, fist already raised to her mouth, <<<image_3>>> already standing beside her at her right shoulder.

Frame coordinates (`x 40–62%, y 20–65%`) are optional here and are the single-take idiom's specialty — see `idiom-single-take.md`.

---

## 6. FORMAT MODE

Short and declarative.

Multi-shot:
> Multi-shot sequence, 15 seconds, horizontal cinematic. Hard cuts at 5.0s and 9.5s.

Single take:
> SINGLE CONTINUOUS TAKE. Real-time motion. No cuts, no montage, no transition effects.

Include orientation (`horizontal cinematic` / `vertical`) whenever it is not obvious. Vertical format has consequences — see `optics.md`.

---

## 7. Shot bodies

See `idiom-multi-shot.md` (default) or `idiom-single-take.md`.

---

## 8. PHYSICS

Mass, contact, momentum, delay. Written per object and per body, not as a general statement.

> The stack has real, solid weight — it presses into Haruka's arms and shifts with her steps in Shot A. When the figure lifts it, the mass transfers cleanly; the one remaining book is light in her hands. Ren carries the heavy stack with steady, effortless control, no strain.

> Haruka's hair has real weight and delay — it swings forward on the bow, hangs, then falls back a half-beat behind her body as she rises. The bag swings once from its handles and settles, its pearl chain and charms tapping softly against the leather.

Three things this block should always cover:

- **Delay** — hair, fabric, and props settle *after* the body, not with it
- **Contact** — what touches what, and what sound that makes
- **Negative motion** — what must not move: `The cup, lamp and books never move.` `The bag hangs still on the hook — it is not lifted or carried.`

PHYSICS is also where Gate 9 gets solved. If your subject is near-still, name what else is alive:

> Ren is near-still, only the faintest breath in his shoulder; his stillness reads against the small living motions of the rest of the room.

> Curtains stir faintly at the windows.

---

## 9. LIGHTING

Source, direction, quality, and what it does to faces.

> Bright late-morning daylight through the white-curtained windows on screen-left — soft, even, slightly milky, no harsh shadows. Faces gently modeled. The green chalkboard and pale mint dado catch the daylight. Calm, ordinary morning light.

**State exposure priority when a face matters**: `exposure priority is his face.`

**Backlight is a deliberate tool, not a default.** It hides identity. Use it when you want that:

> In Shot B, strong backlight from the window turns the male figure into a dark, rim-lit silhouette with his face in shadow — identity obscured. In Shot C, warm sunlight from the window falls across Ren's face and shoulders as he's revealed.

If you backlight a character whose face a reference is supposed to lock, and you did not intend to hide them, you have broken your own identity lock. Add fill:

> warm bounce from the pale walls and parquet fills his face from the room side, keeping it fully readable with soft shadow rolloff and clear eye catchlights.

**Do not mix incompatible descriptions.** `hard sun, visible beams, long shadows` and `low contrast, lifted blacks, milky` cannot both be true. Pick one.

Practical light emitted inside the scene must be declared and bounded:

> The fairy emits no light and casts no glow; the only emitted light is the laptop display's brief white-green flare at 5.5s and again at 10.2s, each fading within half a second.

---

## 10. STYLE

The project constant. See SKILL.md Step 1.

May be omitted if LIGHTING carries the look. If present, it must not contradict LIGHTING.

---

## 11. AUDIO

Diegetic sound, dialogue, and — importantly — **mouth control**.

> Diegetic sound only. No music, no score, no soundtrack, no background instrumental. SFX and dialogue only.

Music suppression is written in four synonyms deliberately. Models add score.

Break down per shot when the soundscape changes:

> Shot A — careful footsteps on terrazzo, the creak of the shifting book stack, Haruka's strained breaths.
> Shot B — the soft slide of the books lifting away, then two clear soft blink sounds — blink, blink — and a tiny caught breath.
> Shot C — quiet corridor tone, Ren's unhurried footsteps as he walks off, faint wind at the windows.

Always close with the speech contract:

> Only the two scripted Japanese lines are spoken, in order — Mei first, Haruka second; no other dialogue, no ad-libs, no narration. Generate video without subtitles.

And for silent characters:

> Ms. Tanaka does not speak in this take and her lips stay closed.

> @MAN says no words; beyond the single gasp his lips stay still.

Ambient state changes belong here with their timing:

> The take OPENS on a loud room — overlapping student chatter, laughter, chairs scraping. At approximately 2.0s a classroom door slides open off-screen and a teacher's HEELS cross the floor — and the chatter drops away under them to near silence.

---

## 12. POSITIVE LOCKS

The last block and the most load-bearing. Every constraint restated in **affirmative** form.

Why affirmative: negative-only phrasing gives the model no target. `The bat never descends` alone is weak; `the bat stays raised at the top of the windup, never descends, and the laptop remains intact and untouched` gives it a state to hold.

Restate, in this order:

1. **Framing discipline** — `Every shot is level, straight, and well-composed — flat true horizon, no dutch tilt, no crooked framing.`
2. **Per-shot staging** — one sentence per shot naming what that shot must show
3. **Identity and geometry** — `Identities, hair, and outfits match references. Geography stays consistent with <<<image_5>>> — windows screen-left, "2-A" door front screen-right.`
4. **Speech contract** — who speaks, in what order, with lip-sync; who stays silent
5. **Liveness** — `All faces blink and breathe visibly; never frozen or masklike.`
6. **Crowd control** — `Other students stay seated.` `All sixteen students remain seated for the entire 15 seconds.`
7. **Negative events stated as maintained states** — `The strike never happens: the bat stays raised at the top of the windup, never descends, and the laptop remains intact and untouched for the entire shot.`
8. **The technical tail** — `Natural smooth movements. High detail. 4K Ultra HD. Sharp clarity. Stable lighting. Consistent frame rate. Clean picture.`

Full catalogue of lock phrasings by failure mode: `anti-slop-locks.md`.
