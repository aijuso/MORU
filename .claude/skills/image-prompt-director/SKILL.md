---
name: image-prompt-director
description: Write production-grade, cinematic, richly-detailed prompts for STILL IMAGE generation (Midjourney, Flux, Imagen, SDXL, Nano Banana, etc.) — establishing shots, locations, character sheets / turnarounds, portraits, props, and product shots. Use this skill WHENEVER the user asks you to "make/write/create a prompt" for an image, or says "プロンプトを作って", "◯◯のプロンプトが欲しい", "画像プロンプト", "character sheet prompt", "location prompt", "establishing shot", or hands you a rough subject ("a young man", "a running track", "sunny day") and expects a generation prompt back. Trigger even when the user only gives a terse subject or a few keywords — the job is to expand a thin brief into a fully-specified cinematic prompt, not to hand back a thin brief. Also trigger when revising, translating, restyling, or debugging an existing image prompt. Do NOT use for VIDEO / shotlist prompts (use the seedance skills for those); this skill is for single still frames.
---

# Image Prompt Director

Turn a thin brief into a fully-specified, cinematic image-generation prompt.

**The product is specificity.** A weak prompt describes a category ("a stadium, a track, some seats"). A strong prompt names things a location scout would notice: *the underside of a dark cantilever grandstand roof with exposed steel lattice truss*, *faint painted lane numbers*, *a tall floodlight tower against the sky*, *subtle mowing patterns on the grass*. The model can only render what you name. Your job is to name enough that the frame feels photographed, not summarized.

The failure mode to avoid: the user says "make me a prompt for a running track, sunny day" and gets back a tidy four-section reference sheet with generic filler. That is under-delivering. The user wants the **stadium-example level of density** — a stack of concrete, nameable detail plus real light, camera, and grade language — even when they gave you almost nothing.

---

## Step 0 — Route by subject

Pick the layer template that fits. This decides how the prompt is spatially organized. Do not ask the user which one; infer it.

- **Scene / location / establishing shot** (a place: stadium, street, room, landscape). → front-to-back spatial layers. This is the richest template; see below.
- **Character / character sheet / turnaround** (a person, possibly multi-view). → panel/view layers + wardrobe + expression. See `references/templates.md`.
- **Portrait** (one person, one framing, emphasis on face/mood). → subject → face → wardrobe → environment → light.
- **Object / prop / product** (a single hero item). → the object → material & detail → surface/backdrop → light. See `references/templates.md`.

If the user's brief mixes types ("a young man on a running track"), pick the dominant subject (here: character, with the track as environment) and fold the other in as a supporting layer.

---

## Step 1 — Fill the gaps; don't interrogate

The brief will be thin. **Invent tasteful specifics rather than leaving blanks or stopping to ask.** "Sunny day" is a seed, not a constraint — you decide it's *bright hazy morning light around 8–9 AM, warm and diffused, soft long shadows*. Specificity you invented is still specificity; the user can change what they don't like.

Only ask the user first if a **load-bearing** choice is genuinely ambiguous AND would send the image somewhere they'd have to redo — e.g. photoreal vs. anime vs. 3D render when the whole look depends on it and there's no cue. Even then, pick a sensible default and note it rather than blocking. Respect anything the user fixed explicitly (an exact phrase, an aspect ratio, "keep '4分の3' unchanged") — carry those tokens through verbatim.

**Default look** (use unless the brief implies otherwise): naturalistic cinematic photoreal — real film-stock feel, restrained saturation, true-to-life, "shot on a cinema camera," not a glossy ad look. For character sheets the default shifts to clean concept-art / model-sheet on flat neutral ground.

---

## The format

Every prompt follows this spine. Adapt the middle layers to the subject; keep the opening line and the technical trio (light / grade / camera) and the tail.

**1. Opening line — the shot summary.** One or two sentences: shot type + subject + setting + time of day + mood/emptiness.
> *A cinematic wide establishing shot of a quiet open-air track-and-field stadium on a city riverfront, early morning around 8–9 AM. Almost empty and still.*

**2. Spatial / structural layers — labeled, in caps.** Build the frame in the order the eye reads depth. For a scene that's front→back: FOREGROUND → MIDGROUND (the hero surface) → BACKDROP. Each layer is 1–3 sentences of concrete, nameable detail. Put scale cues here (*a couple of tiny distant figures on the track for scale*).

**3. LIGHT & SKY (or LIGHTING).** Direction, quality, time, what the shadows do. Precise, not "nice lighting."
> *Soft, bright, hazy morning light, warm and diffused, gentle low-angle sun casting soft long shadows, a luminous bright sky near the horizon.*

**4. COLOR GRADE.** The look. Reach for real grading vocabulary: lifted blacks, halation, restrained saturation, low contrast, warm-neutral white balance, film-stock feel, "not a glossy ad look." (Skip or simplify for flat model-sheet styles.)

**5. CAMERA & LENS.** Body/look, lens character, framing, focus, angle. E.g. *shot on a large-format cinema camera (ARRI look) with a clean spherical prime, wide establishing framing, slightly elevated angle, deep focus, mild vignetting, no distortion.*

**6. Technical tail + negatives.** Close with the render tags and exclusions on one line: *Photorealistic, ultra high detail, 16:9, no on-screen text, no visible brand logos, no crowd.*

See `references/lexicon.md` for ready-to-use vocabulary in every category (times of day, light setups, lens/body looks, grade terms, shot types, angles, negatives). Pull from it so the language is precise instead of generic.

---

## Craft rules

These are what separate the stadium example from a filler sheet:

- **Name real objects.** Not "seats and lights" → "long curving rows of empty muted-gray grandstand seats" and "a tall stadium floodlight tower rising near the center against the sky." Every layer should contain at least one thing you could point at.
- **Give scale and life cues.** A tiny distant figure, a freshly-mowed pattern, faint painted numbers, morning haze softening the far bank. These sell realism.
- **One coherent light and one mood.** Decide the time of day and stick to it across every layer. Contradictory light ("bright noon sun" + "long dramatic shadows") makes models hallucinate.
- **Describe the grade, don't just say "cinematic."** The word "cinematic" alone does little; "gentle low contrast, soft lifted blacks, subtle halation in the bright areas, restrained saturation" does a lot.
- **Layer front-to-back (scenes) or coarse-to-fine (objects/characters).** Order controls composition.
- **Keep prohibitions in the tail**, phrased as absences (no crowd, no text, no logos), not scattered mid-prompt.

---

## Language

Write the prompt body in **English by default** — image models parse it most reliably — even when the user chats in another language, unless they ask for the prompt itself in that language. If they ask for Japanese (or the target tool needs it), deliver it in Japanese with the same density. Preserve any exact token the user says to keep unchanged (e.g. "4分の3", a fixed aspect ratio, a character name). Present the finished prompt in a copy-ready block; a one-line note on what you defaulted or invented is welcome, but keep it out of the prompt itself.

---

## Output gates — check before delivering

1. **Density check.** Does every structural layer name at least one concrete, pointable object? If any layer is generic ("some buildings, a nice sky"), rewrite it.
2. **Light coherence.** Is there exactly one time of day, and do the shadows match it?
3. **Trio present.** Are LIGHT, COLOR GRADE, and CAMERA & LENS all specified (or deliberately simplified for a flat style)?
4. **Tail present.** Aspect ratio + render tags + negatives on the closing line?
5. **Not a thin brief.** If the output is shorter/vaguer than the stadium example and the subject warranted richness, it failed the assignment — expand it.

---

## Worked example (scene)

**Brief given:** "prompt for a running track, sunny day, from above, 3/4 view."

**Delivered:** a full establishing prompt — opening line fixing it as a slightly-elevated 3/4 wide shot in bright hazy morning; FOREGROUND (near seating / roof edge), TRACK (terracotta surface, white lanes, faint numbers, a tiny figure for scale), FIELD (mowed grass, goalposts, scoreboard), BACKDROP (riverfront, distant skyline, floodlight tower, morning haze); LIGHT & SKY, COLOR GRADE, CAMERA & LENS blocks; tail with 16:9 + photoreal tags + "no crowd, no text, no logos." Note to user: "I read 'sunny' as bright hazy morning for softer light — say the word for harsh midday instead."

For character-sheet and object worked examples and their layer templates, see `references/templates.md`.
