# Style anchoring — aesthetic control techniques

Distilled from the Mx-Shell methodology (`jnMetaCode/ai-shortfilm-prompts`, the workflow behind *Zombie Scavenger*). These are optional techniques layered on top of the block format — none of them appears in the reference-drama corpus, so none is part of the default. Reach for them when the look needs stronger anchoring than STYLE + LIGHTING alone provide, especially in text-driven work with few or no reference images.

---

## 1. The theme tag line

A single line of 3–6 tags, separated by `|`, placed at the very top of the prompt (before SCENE CONTEXT). It gives the model one aesthetic anchor before any detail arrives.

Build the tags in escalating layers — image type → genre → aesthetic → mood:

```
Core theme: photoreal dark tokusatsu | shattered flesh | battle-damaged transformation | apocalyptic battlefield
Core theme: atompunk | zombie apocalypse | cinematic texture | hyperreal | no game-CG feel
Core theme: realist tech | sci-fi mecha | epic scale | heavy-industrial machine aesthetic | live-action performance
```

Tag vocabulary by function:

| Function | Tags |
|---|---|
| Realism anchor | cinematic texture · hyperreal · live-action location shoot · no game-CG feel · anamorphic widescreen film texture |
| Aesthetic | dark realism · atompunk · steampunk · cyberpunk · wasteland industrial · retro Hong Kong |
| Genre | tokusatsu · apocalypse survival · lone hero · mechanical wuxia · heavy mecha |
| Mood | shattered flesh · battle-damaged · desolate · epic · oppressive and heavy |

Negative aesthetics work inside the tag line: `no game-CG feel` is itself a tag.

**When to use**: text-driven prompts where no location photo carries the look. **When not to**: a production whose STYLE constant already does this job — do not stack two competing anchors.

---

## 2. Camera-body anchoring

Training data binds cinematography language to real camera and lens names. Naming a specific rig gives the model a statistical bundle — grain structure, halation, color response, contrast curve — that abstract adjectives cannot.

> Visual base: anamorphic widescreen film texture. Simulating an IMAX film camera with Panavision C-series lenses (35mm, f4).

Proven combinations:

| Target look | Rig |
|---|---|
| Epic / large-scale | IMAX film camera + Panavision C-series (35mm, f4) |
| Dark cyber / hard realism | Sony VENICE + Canon K-35 lenses |
| Hong Kong film / wuxia | Kodak 35mm vintage stock, bleach-bypass texture |
| Commercial portrait | Canon EF 85mm f/1.2 |
| Nostalgic naturalism | Kodak Vision3 250D, fine grain, lifted blacks *(only with soft light — see below)* |

Grade vocabulary: desaturated grey-blue · Hollywood teal-orange · 60s retro warm orange + sea-salt blue · low-key high-contrast.

**This is orthogonal to degree-based OPTICS, not a replacement.** Degrees specify geometry (what fits in frame); the rig name specifies texture (how it renders). Use both: degrees in each shot's OPTICS line, the rig once in STYLE.

**The consistency rule still applies.** A film-stock name implies a contrast behaviour; do not pair `Vision3 250D, lifted blacks, low contrast` with `hard sun, visible beams, long shadows` — that exact pairing shipped in a failed prompt. The rig must agree with LIGHTING.

---

## 3. Imperfection as realism

> "Too perfect reads as fake. Keeping flaws is not a defect."

Realism is written as specific damage and wear, not as the word "realistic":

- battle damage striking to the eye · worn and chipped paint everywhere · oil grime at the joints
- keep slight facial imperfections · no beautification (**杜绝美化**)
- the suit is far from pristine

Pair the identity lock with the beautification ban — they are one instruction:

> Face: matches the uploaded reference 100% — features, face shape, hairstyle. No beautification. Facial wounds, gauze, bloodstains stay consistent.

Related: prefer un-retouched, un-beautified source photos for face references. An over-filtered reference bakes the filter into every frame.

---

## 4. Lock the grade at the image stage

AI video files carry low color bitrate. Aggressive post-grading produces banding, dirt, and artifacts — the footage cannot be pushed the way camera raw can.

Consequence: **the grade must be final in the source images and restated in the prompt; post is for micro-adjustment only.** This is the mechanical reason behind the skill's rule that a location reference photo *is* a style instruction — the grade you see in the reference is the grade you ship.

---

## 5. Reference image quality — the contamination rule

> "The biggest side effect of reference images: the model reproduces the reference's *rendering style* — including CG feel and anime feel — not just its *design*."

A reference leaks its picture quality, not only its content. Feed it a soft-focus anime frame and the output goes anime; feed it a flat 3D render and the output goes CG.

Decision rule:

- Reference is high-resolution, photoreal or clean 3D, detail-rich → use it, with `Controls …` scoping as normal
- Reference is low-res, filtered, anime-styled, or rough-CG → **describe in text instead** and let the model render freely
- Hand-drawn storyboard as a framing reference → useful for saving the model's "compute" for motion, but its black-and-white line style can bleed into output; convert deliberately and accept the risk

Related: **do not use first/last-frame conditioning on fast action shots** (fights, transformations, big physical moves). Frame-pinning constrains the motion solve and stiffens the action. Use it only where identity or set continuity genuinely needs it.

---

## 6. Motion-direction continuity between clips

When a sequence is assembled from separate generations, match the motion vector across the cut:

> "The robot throws a bomb, the blast shoves him out the left side of frame — the next shot has to pick him up entering from that same side."

Rule: note which screen side a subject exits, and write the next clip's FIRST FRAME with the subject entering from the matching side, momentum continuous. State it in both prompts:

- Clip N, ACTION: `…is thrown out of frame screen-left.`
- Clip N+1, FIRST FRAME: `…already entering from screen-left, carrying the same leftward momentum.`

This is the motion-side counterpart of `<<<video_1>>>` state continuity (seats, light, texture). Use both together for seamless assembly.

---

## 7. Platform filters — moderation workarounds

Generation platforms filter prompts and uploads independently of the model's abilities.

**Copyright terms.** IP names, film titles, and character names get blocked. Replace with descriptive synonyms that carry the design language: "Iron Man style" → "atompunk retro-futurist armor". Deleting a few characters or punctuation while keeping the meaning can also pass.

**Face uploads.** Face-photo moderation is strict and tightening. Options, in order: try different photos of the same person; accept a stylized intermediate (have an image model redraw the photo as a "photoreal color sketch" and reference that); or design the character to not need a face at all — helmet, mask, robot, seen from behind. Entire acclaimed shorts have been made with zero human faces on screen.

**Special sound effects must be written.** The platform auto-generates ambient sync sound (glass breaking, gunshots, room tone), but stylized SFX only appear if the prompt asks: `the robot's facial-display switch carries a sci-fi sound effect.`

---

## 8. Systematic vs stochastic failure — when to stop editing the prompt

Two different failure classes need two different responses:

- **Systematic** — reproducible, caused by the prompt. The gates exist for this class: contradiction, overload, missing declarations. Symptom: the same wrongness appears across re-rolls. Response: fix the prompt (see `failure-cases.md`).
- **Stochastic** — residual randomness after the prompt is clean. Symptom: different defects each roll, or occasional brilliance you cannot reproduce. Response: **re-roll, do not edit.**

Production reality: 2–20+ generations per shot is the normal range; a three-minute short consumed ~400 images and 200+ video generations. The prompt is a lottery ticket with weighted odds — the gates raise the odds; they do not remove the lottery. Once all gates pass, further prompt-polishing has worse expected value than rolling again and selecting.

Corollary: an accidental masterpiece (the model disobeying the camera instruction beautifully) is not reproducible. Keep the clip, not the illusion that the prompt caused it.
