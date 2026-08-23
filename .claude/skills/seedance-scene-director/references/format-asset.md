# Asset format — chroma key elements for compositing

A different job from a scene. The output is not a shot; it is a **component** that will be keyed and placed on an editing timeline.

Signals you are in this mode: green screen, blue screen, "for compositing", "so I can overlay it", a talking character with no environment, an element that must sit on top of other footage.

**Format is flowing prose, not blocks.** The block spine exists to manage a location, multiple characters, and staging in space. An asset has none of those. Forcing blocks onto it adds no safety and costs clarity.

---

## Required elements, in order

### 1. Subject bound to reference, and the background

> The character from `<<<image_1>>>` — a stylized 3D cartoon elderly professor with curly grey hair, glasses, tweed suit and a wooden pointer stick — floats against a flat, evenly lit chroma key green screen background (#00FF00).

Always give the **hex value**. `#00FF00` for green, `#0000FF` for blue.

### 2. Background uniformity

> The green background is perfectly uniform: no gradients, no shadows cast on it, no vignetting, no fog, no particles.

Five denials. Each one is a thing models add to backgrounds unprompted, and each one destroys the key.

### 3. Spill control

> Soft neutral studio lighting on the character, no green light spill or green reflections on the character — clean edges for keying.

### 4. No emission

Its own paragraph. Models make stylized and magical characters glow.

> The character does not glow: no emissive light, no halo, no bloom, no glowing outline, no light aura around him, no rim glow. Matte, natural materials — the suit is soft matte fabric, the skin is soft matte, nothing on the character emits light.

Six synonyms for glow, then a positive statement of material.

### 5. Composition and the reserved area

This is what makes the asset compositable. State which part of the frame stays empty, and lock it.

> The shot opens with the character already close to the camera in a close-up: his face and shoulders fill the right side of the frame only, the left side remains empty green screen (off-center composition, character anchored right).
>
> He stays in the right portion of the frame until his exit, never crossing into the left half.

The reserved half is where other footage or text will go. Repeat the constraint at the end of the prompt — models drift toward centre.

### 6. Performance, dialogue, and delivery

Written inline, with the acting attached to the line.

> Looking straight into the lens, he says in a scholarly, professorial manner — measured, articulate, with refined lecturing intonation, chin slightly raised, one eyebrow lifted knowingly, perhaps adjusting his glasses like a true academic: "But let's start with the basics." Deliberate, well-enunciated delivery, accurate lip-sync with exaggerated cartoon articulation.

A mid-shot emotional turn is written as an explicit shift with its physical markers:

> As he drifts back, he turns and glances over his shoulder toward the camera — and his expression shifts to sly and mischievous, like he's setting a trap for the viewer: narrowed cunning eyes, a crooked teasing smirk, one raised eyebrow. With a charismatic, playful, baiting tone he says: "What's slop, and what's not?"

If a line is delivered at an angle, say so:

> Accurate lip-sync in the over-the-shoulder angle.

### 7. Entrance and exit

Assets are cut into a timeline, so the first and last frames are contractual.

> Right after the line, he flies completely out of the frame in a beautiful, elegant exit: a graceful sweeping arc upward and off-screen, coat tails trailing, a smooth swift curve like a showman making a grand departure — **leaving the frame entirely empty green screen at the end of the shot.**

> Then he suddenly and quickly darts forward toward the camera — a fast, snappy, energetic swoop into a close-up — bursting with enthusiasm, and while flying in he says…

> he hops off the top of the panel and flies down behind it, disappearing from view — a smooth, elegant little dive behind the panel, with a final cheeky wave before he vanishes. **The panel remains floating in place, unchanged, for the last moment of the shot.**

### 8. Audio

> Audio: voice only. No background music, no soundtrack, no score, no ambient music. Clean dialogue track — only the character's voice.

### 9. Camera and animation style

Closing sentence. The camera is always locked; all motion comes from the subject.

> Locked stable camera (no shake, no drift), all movement comes from the character flying, not from the camera. Lively squash-and-stretch Pixar-like animation with strong anticipation and elegant follow-through on the exit, clean natural lighting, 4K quality.

Variants for different beats:

> …with a soft bouncy settle
> …with soft bouncy motion
> …the fast movement comes from the character flying in, not from the camera

---

## Multiple reference elements

An asset can compose several references. Bind each, state exactly what it controls, and lock its rendering.

> Against a flat, evenly lit chroma key blue screen background (#0000FF) … floats the dark UI panel from `<<<image_1>>>` (the rounded dark generation bar with the bright yellow GENERATE button, "Cinema Studio 3.5" and "16:9" labels). The panel hovers in the center of the frame, static and stable, rendered exactly as in `<<<image_1>>>`, crisp and undistorted.
>
> Sitting on top of the panel is the character from `<<<image_2>>>` … He sits casually on the top edge of the panel with his legs dangling over the front, relaxed and cheerful, lightly swinging his feet. Scale: the character is small relative to the panel, like a little figure perched on a giant remote.

Note the **scale simile** — `like a little figure perched on a giant remote`. Relative scale between two references is unreliable without one.

Objects that must stay readable get their own lock, tied to the moment they appear:

> As he says "Here's your Cinema Studio Pro Guide certificate", he reaches behind his back and pulls out the certificate from `<<<image_3>>>` with a proud flourish — holding it up toward the camera with both hands, flat and facing the lens, clearly readable, rendered exactly as in `<<<image_3>>>`, crisp and undistorted.

And what must **not** move:

> all movement comes from the character, the panel stays perfectly still

---

## Gates that still apply

Fewer than in narrative mode, but not none.

- **Gate 1** — the speaker's face must be visible. `Looking straight into the lens` satisfies it; an over-the-shoulder line needs the explicit `accurate lip-sync in the over-the-shoulder angle`.
- **Gate 3** — speech duration still governs the clip length. Count it.
- **Gate 7** — token integrity. Multi-reference assets are where numbering errors happen.

Gates 4, 5, 6, 8, 9 are narrative-specific and do not apply.
