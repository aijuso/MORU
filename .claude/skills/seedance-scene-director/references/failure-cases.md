# Failure cases

Three real generations that broke, traced from prompt text to rendered artifact. In each, the reported artifact was reproducible from the prompt — none was bad luck.

**The pattern is identical in all three: the model could not satisfy a set of requirements simultaneously, so it silently substituted one of them and rendered.**

| Case | Requirement it could not meet | What it substituted |
|---|---|---|
| 1 | lip-sync on a hidden face | **the acting subject** |
| 2 | cross the room and exit a far door in 3.5s | **the exit** |
| 3 | lip-sync on sixteen students shot from behind | **the eyeline** |

Every lock in all three prompts was obeyed. Locks do not catch this.

---

## Case 1 — the sleeping boy knocks on his own desk

**Reported:** Ren asleep at his desk. Around 2s, an unrequested close-up push. At 4s a cut; a background extra facing away speaks the line while looking somewhere else; the sleeping Ren taps the desk with his eyes shut.

### Artifact A — the unrequested camera move at 2.0s

FORMAT MODE said only:

> Multi-shot sequence, 7 seconds, horizontal cinematic.

No cut times. No `HARD CUT` separator lines. Only the shot headings carried ranges. Every successful prompt in the same production declared cuts three times; this one declared them once.

Into that gap, ACTION placed a timed story event with nothing visible attached:

> At approximately 2.0s a classroom door slides open **off-screen** at the front and a teacher's heels come in across the floor — and the chatter drops away under them, the room going attentive within a beat. **Ren does not stir.**

The event is audible only. The subject is explicitly instructed not to react. Nothing in frame changes at the marked moment — so the model marked it with the camera.

→ **Gate 5** (timed events need visible motion), **Gate 6** (declare cuts three times).

### Artifact B — the extra speaks, the sleeper acts

Three requirements on the same body:

```
DIALOGUE (the boy beside him, whispered, urgent, begins at 4.2s): レン、先生来たぞ。
his face is never given a clear look
keeping his body facing the front
accurate lip-sync
```

A face that is never clearly seen cannot be lip-synced. Compounding it, this speaking character had **no reference token** — he was described inside the classroom geography reference:

> `<<<image_2>>> — classroom geography: wooden desks… Controls the room and the back-row window corner where Ren sits. The boy at the desk beside Ren is an ordinary male student in the same school uniform`

Meanwhile Ren was reference-locked, framed in a tight two-shot, fully visible — and instructed to do nothing for seven seconds.

The model routed **the visible action to the visible body** and **the voice to the body it did not have to show**. Ren knocked. His eyes stayed shut because a separate lock held:

> he only begins to stir at the very end and never lifts his head, **never opens his eyes**, never speaks

Every lock held. The scene still broke.

→ **Gate 1** (speakers need a token, a visible face, and a camera on the mouth side), **Gate 2** (actions need their subject in frame).

### Artifact C — seven seconds of nothing

| time | Ren |
|---|---|
| 0.0–2.0s | asleep |
| 2.0s | door and heels — `Ren does not stir` |
| 2.0–6.5s | still asleep |
| 6.5–7.0s | shoulders shift slightly |

A near-motionless primary subject for the full duration. With nothing to animate, the model animates something.

→ **Gate 9**.

### The version that worked

Same scene, 8 seconds, two shots, `4.0s HARD CUT` declared:

> At approximately 1.8s **a hand reaches in from the side of frame and raps sharply on his desktop** — knuckles on wood, twice. He stirs at the knock: his shoulders shift, his head lifts off the desk, and he comes up blinking, dazed, surfacing from sleep. The hand withdraws out of frame.
>
> **NO DIALOGUE — nobody speaks.**

The anonymous character contributes a hand and a sound, not a line. The visible subject has a real action chain: stir → lift → blink → straighten → notice → react. No contradiction exists to resolve.

---

## Case 2 — she opens the window and walks out into mid-air

**Reported:** Haruka says her line, opens a classroom window, and walks out through it into open space.

### The intended action

SHOT C, **11.5s to 15.0s — 3.5 seconds** — was asked to contain:

1. push the chair back and stand
2. step out from the desk into the aisle
3. walk up the aisle to the front of the room
4. reach the sliding "2-A" door
5. slide it open
6. step into the corridor
7. the door slides shut
8. Mei waves
9. hold on the empty seat

Her desk was in the **second row**; the door was at the **front**. Call it 4–5 m. At 1.2 m/s that walk alone is 3.5–4.0s — the entire shot, with eight other beats unaccounted for.

### The competing opening

LOCATION MAP gave the room two things that open:

> Tall white-curtained windows along the **left wall** — beside her desk
> Sliding "2-A" door at the **FRONT** of the room on the right

And ACTION described the exit in terms true of both:

> **slides it open**, and steps out into the **bright** corridor

Plus LIGHTING: `Bright wash of corridor light through the "2-A" door when it opens.` A bright light beyond a sliding opening — which is also exactly what a sunlit window looks like from inside.

The reachable opening was the window. The model took it. The classroom was upstairs.

### Aggravating factors

**The same exit twice.** Ren already exited through the same 2-A door in SHOT A of the same take.

**Broken geometry locks.** `<<<image_5>>> <<<image_6>>> — classroom geography` put two tokens on one line; `<<<image_1>>>` meant "Ren" in a sibling prompt and "uniforms" here. Screen-left / screen-right binding was weakened exactly where it was needed.

**Upstream overload.** SHOT A held ~7.0s of Mei's dialogue plus Mei's approach, Ren's full aisle crossing and door exit, and a description of the surrounding students — inside 7.5s. Overflow propagated forward.

→ **Gate 3** (time budget), **Gate 4** (unique exit specification, no reuse), **Gate 7** (token integrity).

### The fix

Either give the walk its own shot with real duration, or start SHOT C with her already standing in the aisle. And specify the exit uniquely:

> She exits through the sliding "2-A" door at the FRONT of the room on the right, beside the chalkboard — not through the windows on the left wall, which stay closed throughout.

---

## Case 3 — the whole class turns around and chants at the camera

**Reported:** At ~12s Haruka is at the blackboard facing the class. The students, who had their backs to camera, all turn around to face the *camera* — away from Haruka — and speak in unison.

### The geometry

```
SHOT 4. Wide, 84° lens, from the back of the room looking toward the blackboard.
First frame: the full classroom — the backs of sixteen seated students filling the
midground … Heads lift, faces turn toward the front, and the class speaks together
in an overlapping, uneven, warm chorus:

ようこそ、はるかさん。
```

- Camera: **at the back of the room**
- Students: **backs to camera**
- "Face the front" = turn **further away** from camera
- Requirement: **sixteen visible lip-synced mouths**

Mouths cannot be rendered from behind heads. The only geometry that produces sixteen visible mouths is sixteen students facing camera — the exact opposite of facing Haruka.

The model chose to satisfy the lip-sync requirement. It was the only requirement that could not be faked.

### Compounding

**84° in vertical format.** The widest angle anywhere in the corpus; everything else sits between 29° and 55°. Sixteen faces in a narrow vertical frame at 84° render at a few dozen pixels — the identity references had nothing to attach to.

**Contradictory grade.** This prompt also dropped the production's constant STYLE block and put a self-contradicting grade in LIGHTING:

> hard late-morning sun through the window wall on the left, throwing **visible beams and long warm shadows** … Kodak Vision3 250D, real fine grain, lifted blacks, **low contrast**

Hard beams and long shadows are high contrast. The successful prompts in the same production say `soft, even, slightly milky, no harsh shadows` and carry the unchanged STYLE constant.

**Also failing Gate 3.** Its SHOT 2 gave the 6.2s introduction line a 5.0s shot — see `dialogue-timing.md`.

→ **Gate 1** (no crowd lip-sync), **Gate 8** (no locked faces above 55°).

### The version that worked

Same beat, 55°, horizontal, **no line at all**:

> The seated students turn their heads toward her. Faces open. A smile ripples across the rows, one after another, spreading back through the room. A girl in the second row nudges her neighbour. Someone nods. A boy near the window grins. Every student stays in their chair.
>
> AUDIO — a soft warm rustle spreading across the room, chairs shifting, a quiet murmur of approval, a single quiet laugh.

The warmth is fully delivered. Nothing impossible was requested.

---

## Debugging checklist

Given a reported artifact, find the substitution and work back to the impossible requirement.

| Artifact | Substitution | Check |
|---|---|---|
| Wrong character performs an action | acting subject | Gate 1, Gate 2 |
| Character exits somewhere impossible | the exit | Gate 4, Gate 3 |
| Everyone turns to camera | the eyeline | Gate 1 |
| Speech clipped, rushed, desynced | speech rate | Gate 3 |
| Unrequested camera move or cut | the cut structure | Gate 5, Gate 6 |
| Character becomes someone else | identity resolution | Gate 8, Gate 7 |
| Frozen, masklike faces | liveness | missing `blinks and breathes visibly` |
| Invented motion, drifting limbs | motion source | Gate 9 |
| Prop or environment renders wrong | reference binding | Gate 7 |
