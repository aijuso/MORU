# Example — chroma key asset, talking character, reserved frame half

A shipped production prompt in the asset format. Flowing prose, no blocks. The deliverable is a keyable element, not a scene.

---

```
The character from <<<image_1>>> — a stylized 3D cartoon elderly professor with curly grey
hair, glasses, tweed suit and a wooden pointer stick — floats against a flat, evenly lit
chroma key green screen background (#00FF00). The green background is perfectly uniform: no
gradients, no shadows cast on it, no vignetting, no fog, no particles. Soft neutral studio
lighting on the character, no green light spill or green reflections on the character —
clean edges for keying.

The character does not glow: no emissive light, no halo, no bloom, no glowing outline, no
light aura around him, no rim glow. Matte, natural materials — the suit is soft matte
fabric, the skin is soft matte, nothing on the character emits light.

The shot opens with the character already close to the camera in a close-up: his face and
shoulders fill the right side of the frame only, the left side remains empty green screen
(off-center composition, character anchored right). Looking straight into the lens, he says
in a scholarly, professorial manner — measured, articulate, with refined lecturing
intonation, chin slightly raised, one eyebrow lifted knowingly, perhaps adjusting his
glasses like a true academic: "But let's start with the basics." Deliberate,
well-enunciated delivery, accurate lip-sync with exaggerated cartoon articulation.

Then he smoothly flies backward, away from the camera, receding with a light, buoyant
floating motion. As he drifts back, he turns and glances over his shoulder toward the
camera — and his expression shifts to sly and mischievous, like he's setting a trap for the
viewer: narrowed cunning eyes, a crooked teasing smirk, one raised eyebrow. With a
charismatic, playful, baiting tone he says: "What's slop, and what's not?" — as if daring
the viewer to answer and secretly hoping to catch them out. Accurate lip-sync in the
over-the-shoulder angle.

Right after the line, he flies completely out of the frame in a beautiful, elegant exit: a
graceful sweeping arc upward and off-screen, coat tails trailing, a smooth swift curve like
a showman making a grand departure — leaving the frame entirely empty green screen at the
end of the shot.

He stays in the right portion of the frame until his exit, never crossing into the left half.

Audio: voice only. No background music, no soundtrack, no score, no ambient music. Clean
dialogue track — only the character's voice.

Locked stable camera (no shake, no drift), all movement comes from the character flying,
not from the camera. Lively squash-and-stretch Pixar-like animation with strong anticipation
and elegant follow-through on the exit, clean natural lighting, 4K quality.
```

---

## What to learn from it

**The reserved half is stated twice** — once inside the composition sentence, once as its own standalone line near the end. `the left side remains empty green screen` and `He stays in the right portion of the frame until his exit, never crossing into the left half.` Models drift toward centre; one statement is not enough. That empty half is where the compositor will place other footage.

**Both the first frame and the last frame are contractual.** Opens already in close-up (no lead-in), ends `entirely empty green screen`. An asset is cut into a timeline, so its boundaries are part of the spec.

**Emission denial gets its own paragraph.** Six ways of saying "does not glow", then a positive material statement. Stylized characters are the highest-risk category for unrequested glow.

**Two lines, two distinct performances, both with visibility handled.** The first is delivered `straight into the lens`. The second is over the shoulder while receding — so it carries its own explicit `accurate lip-sync in the over-the-shoulder angle`. Gate 1 is satisfied separately for each line rather than assumed.

**Emotional turn written as physical markers.** `narrowed cunning eyes, a crooked teasing smirk, one raised eyebrow` — not `he looks mischievous`.

**Animation style named as a tradition, plus its mechanics.** `squash-and-stretch Pixar-like animation with strong anticipation and elegant follow-through on the exit`. Anticipation and follow-through are the specific principles that make a stylized exit read as animation rather than a slide.

**Camera locked, motion sourced.** `all movement comes from the character flying, not from the camera` — states not just that the camera is still but where the motion comes from instead.
