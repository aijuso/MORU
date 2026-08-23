# Anti-slop locks — failure mode → phrasing

Every entry is a real failure mode with the phrasing that suppresses it. Drawn from shipped production prompts across two different productions.

**Locks are the second line of defense.** The first is not creating the impossible requirement — see the gates in SKILL.md. Locks catch drift; they do not resolve contradictions. Every failure documented in `failure-cases.md` happened in a prompt whose locks were all obeyed.

---

## Framing

**Dutch tilt / crooked horizon**
> Every shot is level, straight, and well-composed — flat true horizon, no dutch tilt, no crooked framing.
> Steady, level, well-composed framing throughout — no tilted or crooked horizons.

**Unrequested camera movement**
> Locked tripod for all four shots. No dolly, no pan, no zoom, no push-in, no handheld drift. The frame is still; only the people move.
> camera locked off — a completely static shot, no pan, no push, no handheld drift
> LENS LOCK 47°, no drift, no zoom, no push-in.
> No arcs, no tracking, no reframing beyond these small in-place moves.

**Mechanical-looking handheld**
> alive with light handheld shake — natural breath sway, micro-settling, tiny weight shifts, small human corrections — never digital jitter

**Invented establishing shot**
> No empty establishing frame, no frontal opening.
> THE VIDEO OPENS HERE — no establishing shot, no lead-in.
> First frame: [character] mid-action, [already doing the thing]

**Invented cuts**
> SINGLE CONTINUOUS TAKE. Real-time motion. No cuts, no montage, no transition effects.
> (multi-shot) declare every cut three times — FORMAT MODE, separator line, shot heading

---

## Identity

**Character drifts into someone else**
> Identities, hair, and outfits match references exactly.
> Faces, hair, and uniforms of <<<image_3>>> and <<<image_4>>> match their references exactly across every cut.
> 100% matches the reference.
> All identities, costumes and the bat's green-to-amber finish 100% match their references.

**Location reference leaks its framing**
> Controls the environment only, not the characters.
> The reference image's camera angle and framing are not inherited; this shot uses its own camera defined below.
> Reference controls room geometry, furniture placement, materials and warm daylight atmosphere only.

**Geography flips between shots**
> Geography stays consistent with <<<image_3>>> — windows screen-left, "2-A" door screen-right.
> Front angle (camera at back → board): windows screen-left. Reverse angle (camera at board → class): windows screen-right, door screen-left.

**Continuity breaks across generations**
> Continuity flows from <<<video_1>>> — the same sixteen students in the same seats, same room, same light.

---

## Bodies and proportion

**Character renders as a giant**
> Ren is only moderately taller than Haruka — a natural, realistic student height, clearly SHORTER than the corridor doors and door frames; his head never reaches the top of the doorways, and he is never towering or giant.

**Scale of a miniature drifts**
> he stays exactly 3 cm tall
> His 3 cm scale stays constant relative to the laptop lid and the man's face.

**Face goes masklike**
> All faces blink and breathe visibly; never frozen or masklike.
> Both faces blink and breathe naturally — never frozen or masklike.

**Prop occludes the face and breaks identity**
> In every shot the stack of books reaches only up to Haruka's CHIN and no higher — her FACE stays fully visible above the books at all times.

---

## Speech

**Mouths move on silent characters**
> Lips are still whenever a character is not speaking.
> Ms. Tanaka does not speak in this take and her lips stay closed.
> @MAN says no words; beyond the single gasp his lips stay still.

**Invented dialogue / narration**
> Only the two scripted Japanese lines are spoken, in order, with accurate lip-sync — Mei first, Haruka second; no other dialogue.
> no other dialogue, no ad-libs, no narration
> Only the quoted lines are spoken; no other voices.

**Burnt-in subtitles**
> Generate video without subtitles.
> No music, no subtitles.

**Crowd lip-sync** — do not lock it, remove it. Replace with sound. See `dialogue-timing.md`.

---

## Crowds and extras

**Extras stand up, wander, multiply**
> Every student stays in their chair.
> No student rises from their chair.
> All sixteen students appear 17 to 18 in the reference uniforms and remain seated for the entire 15 seconds.
> Other students stay seated.
> Every student's body stays anchored in a chair; weight is settled, no one rises.

**Headcount drifts**
> Exactly two characters appear in this shot: @MAN and @FAIRY; the room is otherwise empty.
> Exactly two characters: the girl and the boy.

**Extras become characters**
> he is an ordinary uniformed student, not a named character
> his face is never given a clear look

⚠️ If you write that clause, that person gets **no line**.

**Subject reads as isolated when they should be in a crowd**
> Haruka is seated among a full class — occupied desks beside her, ahead of her, and in the rows behind her, students facing front and quietly working — she is never isolated in empty space.

---

## Light

**Magical elements glow**
> He does not glow or emit any light: a matte, unlit miniature figure lit only by the room's daylight.
> no emissive light, no halo, no bloom, no glowing outline, no light aura around him, no rim glow
> Matte, natural materials — the suit is soft matte fabric, the skin is soft matte, nothing on the character emits light.

**Practical light is unbounded**
> the only emitted light is the laptop display's brief white-green flare at 5.5s and again at 10.2s, each fading within half a second

**Backlight kills the face you locked**
> warm bounce from the pale walls and parquet fills his face from the room side, keeping it fully readable with soft shadow rolloff and clear eye catchlights
> exposure priority is his face

**Grade contradicts itself** — not a lock, a rule. `hard sun / visible beams / long shadows` and `low contrast / lifted blacks / milky` cannot coexist. Choose one and write LIGHTING and STYLE to agree.

---

## Motion and physics

**Static hover**
> he never holds a static hover — he glides lightly back and forth in small passes while speaking

**Floating props, weightlessness**
> Gravity and inertia respected — mass has real weight, correct contact shadows. No floating props.
> The cup, lamp and books never move.
> The bag hangs still on the hook — it is not lifted or carried.

**Wings appear on a wingless flyer**
> @FAIRY has no wings at any point and flies by smooth levitation only

**Invented motion during stillness** — Gate 9. Give the frame something else alive:
> Curtains stir faintly at the windows.
> Classmates around him move and chatter naturally, settling in their chairs.
> Ren is near-still, only the faintest breath in his shoulder; his stillness reads against the small living motions of the rest of the room.

---

## Actions completing when they must not

Models finish gestures. State the **maintained state**, not only the prohibition, and repeat it in three blocks.

> The swing itself never begins; the bat never descends.
> The strike never happens: the bat stays raised at the top of the windup, never descends, and the laptop remains intact and untouched for the entire shot; there is no desk hit anywhere.
> He never strikes the desk.

Same pattern for other non-completions:

> The take ends there, before he lifts his head.
> Haruka LEAVES HER BAG on the desk hook — she does not pick it up or carry it; the bag stays at her seat the whole take.
> The picture NEVER cuts to the door or the teacher — we stay on Ren's corner for the whole take; the teacher is heard, never seen.

---

## Chroma key

> The green background is perfectly uniform: no gradients, no shadows cast on it, no vignetting, no fog, no particles.
> no green light spill or green reflections on the character — clean edges for keying
> the left side remains empty green screen — he never crosses into the left half of the frame
> leaving the frame entirely empty green screen at the end of the shot

---

## CG-feel suppression

**Output reads as game CG / render**
> cinematic texture, hyperreal, live-action location shoot — no game-CG feel
> Photorealistic — no 3D render, no game engine.

**Too clean, reads as fake** — write imperfection as content, not adjectives:
> keep slight facial imperfections; no beautification
> worn and chipped paint, oil grime at the joints, battle damage striking to the eye
> Face: matches the uploaded reference 100% — features, face shape, hairstyle. No beautification.

More vocabulary and the reasoning: `style-anchoring.md` §1, §3.

---

## Platform moderation (prompt-side, not model-side)

**IP / copyright terms blocked** — replace names with design language:
> "Iron Man style" → "atompunk retro-futurist armor"
> a film title → its aesthetic described in synonyms

**Face-photo upload rejected** — try other photos of the same person; route through a stylized intermediate ("photoreal color sketch" of the photo); or design the character faceless (helmet, mask, robot, seen from behind).

**Stylized SFX absent from output** — ambient sync sound is automatic, special effects are not; write them:
> the robot's facial-display switch carries a sci-fi sound effect

---

## Technical tail

Close every POSITIVE LOCKS block with the project constant:

> Natural smooth movements. High detail. 4K Ultra HD. Sharp clarity. Stable lighting. Consistent frame rate. Clean picture.
