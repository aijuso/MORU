---
name: seedance-scene-director
description: Write production-grade AI video generation prompts in the structured block format (SCENE CONTEXT / ACTIVE REFERENCES / FIRST FRAME / FORMAT MODE / SHOTS / PHYSICS / LIGHTING / STYLE / AUDIO / POSITIVE LOCKS). Use whenever the user wants video generation prompts for Seedance, Higgsfield, or any reference-driven video model. Trigger on "shotlist", "ショットリスト", "動画プロンプト", "プロンプトを作って", any request to turn narrative into shot-by-shot prompts, revising or debugging a prompt, diagnosing a failed generation, transferring motion from real footage onto a generated character (V2V, ワイプ素材, モーション転写), driving lip sync from an uploaded audio file (音声, リップシンク), or regenerating an approved low-res clip at higher resolution (アップスケール, fidelity re-render). Duration is decided by content. Always run the output gates. Every prompt is delivered in English plus a full Japanese version.
---

# Seedance Scene Director

Write video generation prompts that survive contact with the model.

The job is not "describe the scene beautifully." The job is **to never hand the model a set of requirements it cannot satisfy simultaneously.** Everything below exists because of that one principle.

---

## The core principle

**The model does not detect contradictions and stop. It silently substitutes something and renders.**

Observed, from real production failures:

| Impossible requirement | What the model substituted |
|---|---|
| Lip-sync on a character whose face is hidden | **the acting subject** — gave the knock to the sleeping boy, the voice to a faceless extra |
| Cross a classroom and exit a far door in 3.5s | **the exit** — sent her out the nearest window, into mid-air |
| Lip-sync on sixteen students shot from behind | **the eyeline** — turned the whole class around to face camera |

Prohibitions do not prevent this. `no floating`, `never speaks`, `stays seated` were all present and all obeyed — the prompts broke anyway, in the gaps between the locks.

**The only defense is to not create the impossible requirement in the first place.** That is what the gates in Step 5 are for. They are mandatory.

---

## Step 0 — Route the job

**Narrative or asset?**

- **Narrative** — a scene with a location, characters, and story beats. → the block format below. This is the default.
- **Asset** — an isolated element on a chroma key background for later compositing. → read `references/format-asset.md`. Different format entirely (flowing prose, not blocks).

**Motion transfer or fidelity re-render?**

- **V2V motion transfer** — the user supplies real footage (stream wipes, webcam clips, phone video) whose performance must be transferred onto a generated character/world. → read `references/idiom-v2v-motion.md` §1–2. Analyze the clip (duration, fps, what the body does at which second) BEFORE writing.
- **Fidelity re-render** — an approved low-res clip regenerated at higher resolution, identical content, restored detail. → `references/idiom-v2v-motion.md` §4. Warning: over-locked "reproduce 1:1" prompts reproduce the softness too.

**Multi-shot or single take?**

- **Multi-shot** (default) — hard cuts between framings inside one generation. Use whenever the scene has more than one dramatic beat or needs more than one framing. → `references/idiom-multi-shot.md`
- **Single continuous take** — one unbroken camera position, real-time. Use when the value is in the unbroken duration: a physical action chain, an unbroken reaction, a performance that must not be cut. → `references/idiom-single-take.md`

Both idioms share the same block spine. They differ in where OPTICS/CAMERA/ACTION live and how time is written.

---

## Step 1 — Establish project constants

Some blocks are **fixed across every prompt in a project**. Establish them once, then reuse verbatim.

**STYLE** — the look. If the user supplied one, use it exactly. If they supplied reference photos, **read the grade off the photos** and write STYLE to match. Do not import a default.

A real project constant, used unchanged across every prompt in that production:

> Early-2000s Japanese film look — soft natural light, milky low-contrast color, gentle desaturation, fine 35mm grain, quiet stillness. Iwai Shunji / early Kore-eda texture. Naturalistic, unhurried, intimate. Steady, level, well-composed framing throughout — no tilted or crooked horizons.

**POSITIVE LOCKS tail** — the same technical closer on every prompt:

> Natural smooth movements. High detail. 4K Ultra HD. Sharp clarity. Stable lighting. Consistent frame rate. Clean picture.

**STYLE may be absent.** Some productions carry the look entirely in LIGHTING and have no STYLE block. That is valid. What is not valid is inventing a house style the references contradict.

⚠️ **A location reference photo is a style instruction.** A faded, low-contrast film-grade photo means the output is faded and low-contrast. Do not write `8K IMAX photorealistic` over it. The mechanical reason: AI video carries low color bitrate, so post-grading barely works — the grade must be final in the sources and the prompt.

For stronger aesthetic control — theme tag lines, camera-body anchoring (IMAX + Panavision C, Sony VENICE + K-35, etc.), and imperfection-as-realism vocabulary — see `references/style-anchoring.md`. These are optional layers, most valuable in text-driven work with few references.

---


---

## Audio inputs and credit discipline

Seedance 2.0 accepts audio natively: up to **9 images + 3 videos (≤15s) + 3 audio clips (≤15s)** per generation. An uploaded voice clip (`<<<audio_1>>>`, aliased as `@VOICE`) drives lip sync directly — prefer this over generate-then-lipsync pipelines. Declare ONE mouth authority when both a motion-source video and a voice file are attached (`LIP SYNC PRIORITY: the audio wins`). Build SFX around the voice and forbid any other generated human voice. Full patterns: `references/idiom-v2v-motion.md` §2.

Credits (Higgsfield, verified 2026, 5s clip): 480p≈15 / 720p≈23 / 1080p≈45; audio adds +50–100%. **Iterate at 480p without audio; add audio and resolution only to approved takes.**

---

## Delivery language

Present every generation prompt in **English first, then a complete Japanese version** of the same prompt (not a summary). English is the primary version to paste into the model; the Japanese version is for the user's review and archive. This applies to all idioms, including V2V and re-render prompts.

## Step 2 — Bind reference tokens

Every reference gets a token and an explicit statement of **what it controls**.

```
<<<image_2>>> — Haruka: a female student, long straight dark hair worn down, navy blazer,
white blouse, plaid ribbon bow, grey pleated skirt, knee-high socks, loafers.
Controls her face, hair, and outfit.

<<<image_4>>> — school corridor: long upper-floor hallway, tall windows on one side over
green trees, brown wooden sliding "2-A" doors on the other, mint-tiled dado, glossy
terrazzo floor, warm daylight. Controls the corridor.
```

Rules:

- **One token, one subject.** Never two tokens on one line. Never one token defined twice.
- **`Controls …` is mandatory** on every reference. Without it, a location photo leaks its framing and its people into the shot.
- **Say what a reference does NOT control** when it matters: `The reference image's camera angle and framing are not inherited; this shot uses its own camera defined below.`
- **Never describe a person inside a location reference.** Every human who acts or speaks needs their own token.
- **Timed identity** is allowed and useful: `Controls his face, hair, and outfit — his face is kept hidden until Shot C.`
- **Video references** work for continuity: `<<<video_1>>> — continuity lead-in. Controls the seating arrangement, the room's geography, the light, and the film texture. This take continues seamlessly from its final state.`

Semantic aliasing (`@MAN`, `@FAIRY`) is an alternative for long prompts with many appearances — bind once as `@MAN (image 2)`, then use the alias in the body. Reduces number-swap errors. Either convention is fine; do not mix them in one prompt.

**Inspect reference quality before binding.** A reference leaks its *rendering style*, not just its design — a low-res, filtered, anime-styled, or rough-CG reference contaminates the output with that same look. Bind only high-quality, photoreal (or clean-3D) references; for anything below that bar, describe the subject in text instead and let the model render freely. Also avoid first/last-frame conditioning on fast action shots — frame-pinning stiffens motion. Details and the moderation workarounds (blocked IP terms, face-upload filters): `references/style-anchoring.md`.

---

## Step 3 — Break into shots and budget the time

**Duration is decided by content.** Real productions run 7s, 8s, 12s, 15s. Never pad to a round number; never compress to fit one.

Work out the duration from the beats, then assign shot boundaries:

1. List the dramatic beats.
2. For each beat, compute its floor cost (Gate 3 below).
3. A shot holds **one** beat plus its reaction. Two beats in one shot is the overload that pushed a character out of a window.
4. Sum with headroom. That is the take length.

A shot rarely runs under 2s or over 8s. Dialogue shots need the line's full duration plus at least 1s.

---

## Step 4 — Write the blocks

Order, for the default multi-shot idiom:

```
SCENE CONTEXT
ACTIVE REFERENCES
CHARACTER NOTES          (optional — psychology, if performance matters)
LOCATION MAP
FIRST FRAME AND SPATIAL BLOCKING
FORMAT MODE
SHOT A — TITLE (0.0s to 5.0s)
  OPTICS: ...
  ACTION: ...
  DIALOGUE (speaker, delivery, begins at 0.4s): ...
5.0s HARD CUT
SHOT B — TITLE (5.0s to 9.5s)
  ...
PHYSICS
LIGHTING
STYLE
AUDIO
POSITIVE LOCKS
```

Full writing guidance and vocabulary: `references/blocks-common.md`.

Two things that carry disproportionate weight:

**Shot titles state intent, not content.** `SHOT B — THE BOOKS ARE LIFTED AWAY — IDENTITY HIDDEN`, `SHOT C — REVEAL: HE HOLDS THEM, THEN WALKS ON`. The title tells the model what the shot is *for*.

**Dialogue is written in the language actually spoken.** The prompt body is English; the line is Japanese if the character speaks Japanese. Attach a start time and a delivery note:

```
DIALOGUE (Mei, bright and quick, begins at 0.4s): はるかさん、職員室に教科書を取りに行ってって。
(3.8s, reluctant, unsure, half-groaning) えぇ…こんなに持てるかな…
```

---

## Step 5 — RUN THE GATES

**Mandatory. Every shot, every time, before rendering anything.** Each gate exists because a real generation failed without it.

### Gate 1 — Speakers

For every character with a line in this shot:

- [ ] Has their own reference token (not described inside a location reference)
- [ ] Their face is visible in this shot
- [ ] The camera is on the side where the mouth can be seen
- [ ] At most **two** simultaneous speakers

> Three or more speaking at once → **replace with sound.** Rustle, chairs shifting, a murmur of approval, a single laugh, one clap. Never request crowd lip-sync.
> A deliberately hidden or anonymous figure gets **no line.** Give them a knock, a hand, a footstep.

### Gate 2 — Action subjects

- [ ] Every action has its subject inside this shot's frame
- [ ] No character is asked to both hide and perform a visible action

### Gate 3 — Time budget

```
Japanese speech  = mora ÷ 6.5  +  0.4 × (sentences − 1)
English speech   = syllables ÷ 4.0  +  0.4 × (sentences − 1)
Walking          = metres ÷ 1.2
Sit / stand / turn / reach / open a door = 0.5 each
Reaction beat (blink, realize, settle)   = 0.5 each

Sum + 1.0s headroom  ≤  shot duration
```

Worked: 「はるかです。写真と、読書が好きです。みんなと仲良くできたら嬉しいです。」 = 35 mora, 3 sentences → 35 ÷ 6.5 + 0.8 = **6.2s**. It succeeded in a 7.5s shot. It failed in a 5.0s shot.

- [ ] Every shot passes. If not: extend the shot, cut the line, or move a beat out.

### Gate 4 — Paths and exits

- [ ] If the space has more than one openable thing (doors, windows, gates), the one being used is **uniquely specified**: which side, how far, and what is beyond it
- [ ] Openings that must not be used are excluded in POSITIVE LOCKS
- [ ] The same exit is not used twice in one take
- [ ] Travel distance passes Gate 3

> This gate exists because a girl walked out a second-floor window into mid-air. The prompt said `slides it open, steps out into the bright light` — true of the near window as well as the far door, and only the window was reachable in the time given.

### Gate 5 — Timed events

- [ ] Every `At approximately Xs` has something **visibly moving on screen** at that moment

> If a story event happens off-screen and nothing on screen moves, the model invents a camera move to mark it. Either put something in frame that reacts, or drop the timestamp.

### Gate 6 — Cut declarations

- [ ] FORMAT MODE lists every cut time: `Hard cuts at 5.0s and 9.5s.`
- [ ] A standalone separator line sits between shots: `5.0s HARD CUT`
- [ ] Each shot heading carries its range: `SHOT B — TITLE (5.0s to 9.5s)`

All three. Declared once, cuts drift.

### Gate 7 — Token integrity

- [ ] Every token used in the body is defined in ACTIVE REFERENCES
- [ ] No token is defined twice
- [ ] No token is defined and then never used
- [ ] No line carries two tokens
- [ ] No location reference contains a person
- [ ] Wardrobe, height, and props agree across every block

> Real bugs found in shipped prompts: a boy described as `navy blazer` in one block and `black gakuran` in another; `<<<image_5>>>` bound to both a bag and a wall; a reference sentence with its token missing entirely, leaving `Geography stays consistent with and <<<image_5>>>`.

### Gate 8 — Optics vs identity

- [ ] No shot wider than **55°** contains a face that a reference is supposed to lock
- [ ] Vertical format shots are tighter still — the frame is narrow

> An 84° wide of sixteen students in vertical format renders faces at a few dozen pixels. Identity locks cannot work at that size.

### Gate 9 — Stillness

- [ ] No subject is near-motionless for more than ~3s without something else moving in frame

> With nothing to animate, the model invents motion. Give it curtains, classmates, dust, a breath, a hand.

### Gate 10 — Cross-clip continuity (only when this prompt joins others in a sequence)

- [ ] State continuity carried by a `<<<video_1>>>` reference where seats, light, and texture must persist
- [ ] **Motion direction matched across the cut**: if a subject exits the previous clip screen-left, this clip's FIRST FRAME has them entering from screen-left with the same momentum — stated in both prompts

**If a gate fails, fix the prompt. Do not note the risk and proceed.**

---

## Step 6 — Render the HTML shotlist

Copy `assets/shotlist-template.html`, fill it, save to `/mnt/user-data/outputs/shotlist.html`, and present it.

Structure:

- Title bar — project name
- Project constants block, collapsible — STYLE and the LOCKS tail, shown once
- One card per generation, each with:
  - a checkbox (state persisted in `localStorage` under `shotlist-scene-{n}-done`)
  - a heading: number, one-line description, duration, shot count
  - the **full prompt** in a `<pre>` with a Copy button
- A usage note in the user's language

**One prompt = one generation = one clip.** Multiple shots live *inside* one prompt as `SHOT A / B / C`. Do not split a scene into `1a / 1b / 1c` separate prompts unless a single generation genuinely cannot hold it — five shots in fifteen seconds is normal.

Everything the model needs must be inside the copied text: all blocks, top to bottom. The user copies one block and pastes it.

---

## Revisions

When asked to change a shot, add an insert, swap wardrobe, or extend a scene: **regenerate the HTML and present the updated file.** Do not explain the change in chat and leave the file stale. Keep scene numbers stable so checkbox state survives. Keep project constants unless the change is to them.

**Re-run the gates after every revision.** Extending a line or adding a beat is exactly how a passing shot starts failing Gate 3.

---

## Debugging a failed generation

When the user reports what went wrong, work backwards: the artifact names the substitution, and the substitution names the impossible requirement.

| Symptom | Look at |
|---|---|
| Wrong character performs an action | Gate 1, Gate 2 — a hidden speaker |
| Character exits somewhere impossible | Gate 4, Gate 3 — no time to reach the intended exit |
| Everyone turns to camera | Gate 1 — crowd lip-sync |
| Speech clipped, rushed, or desynced | Gate 3 |
| Unrequested camera move or cut | Gate 5, Gate 6 |
| Character becomes someone else | Gate 8, Gate 7 |
| Faces frozen / masklike | missing `blinks and breathes visibly — never frozen or masklike` |
| Invented motion, drifting limbs | Gate 9 |

Worked examples with full causal chains: `references/failure-cases.md`.

**Distinguish systematic from stochastic before editing anything.** Systematic failure is reproducible — the same wrongness across re-rolls — and means the prompt is broken: use the table above. Stochastic failure shows different defects each roll: **re-roll, do not edit.** Once every gate passes, 2–20+ generations per shot is the normal selection range, and further prompt-polishing has worse expected value than rolling again. An accidental one-roll masterpiece is not reproducible either — keep the clip, not the belief that the prompt caused it. (`references/style-anchoring.md` §8)

---

## Reference files

Read the one that matches the job. Do not read all of them.

| File | When |
|---|---|
| `references/blocks-common.md` | Writing any narrative prompt — block-by-block guidance and vocabulary |
| `references/idiom-multi-shot.md` | Default. Hard cuts, SHOT nesting, per-shot OPTICS |
| `references/idiom-single-take.md` | One unbroken take — top-level CAMERA/OPTICS/ACTION TIMING, frame coordinates, handheld texture |
| `references/format-asset.md` | Chroma key elements for compositing — prose format, not blocks |
| `references/optics.md` | Choosing field of view; telephoto; format and identity constraints |
| `references/dialogue-timing.md` | Speech duration, multilingual lines, mouth control |
| `references/anti-slop-locks.md` | Failure mode → lock phrasing, the full catalogue |
| `references/style-anchoring.md` | Theme tags, camera-body anchoring, imperfection vocabulary, reference contamination, moderation workarounds, re-roll discipline (Mx-Shell methodology) |
| `references/idiom-v2v-motion.md` | V2V motion transfer from real footage, audio-driven lip sync, credit discipline, fidelity re-render |
| `references/failure-cases.md` | Three real failures traced from prompt to artifact |
| `references/examples/` | Complete production prompts, annotated |
