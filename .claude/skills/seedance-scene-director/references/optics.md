# Optics

Field of view is specified in **degrees (diagonal)**, not millimetres. Degrees are sensor-independent; mm is not.

---

## The working range

| FOV | Character | Use | Seen in |
|---|---|---|---|
| **29°** | short telephoto portrait | close framing by lens reach; compression and creamy bokeh; face razor-sharp | self-introduction close-up; passenger on a moving scooter |
| **34°** | tight normal | medium close-up, shallow focus, subject isolated from a busy background | sleeping student woken at his desk |
| **35°** | normal | medium close-up with a foreground object in frame | staff room, book stack in foreground |
| **38°** | normal | medium shot; following a figure through a space with background legible | crossing a classroom; back-row corner |
| **40°** | normal | the workhorse; medium two-shot, over-shoulder, close-up | most shots across every production |
| **42°–45°** | normal | medium to medium-wide; full body; camera at eye level | corridor walk; teacher's gesture; seated-eye-level anchor |
| **47°** | normal | single-take interiors where the room must read around the subject | home office, unbroken take |
| **48°** | normal-wide | locked static wide of a room area | the empty seat, camera locked off |
| **55°** | normal-wide | room-scale; sweeping across many people | class reacting, shoulder soft in foreground |

**Above 55° is the danger zone.** One shipped prompt used 84° on sixteen students in vertical format. Faces rendered at a few dozen pixels; identity references could not apply.

---

## Gate 8

- [ ] No shot wider than 55° contains a face that a reference is supposed to lock

If you need the whole room *and* a locked face, use two shots: a wide with no identity claim, then a tighter shot on the face. Do not solve it with one wide.

If a wide shot is unavoidable and a reference character is in it, state that the wide does not carry identity:

> Haruka's shoulder soft in the foreground at frame edge

— she is present as a compositional element, not as a face to be matched.

---

## Telephoto: write the distance and the reason

Do not just name the angle. Say the camera is far away and say what the lens is buying you.

> OPTICS: 29° diagonal field of view, short telephoto portrait lens character, camera 4 to 5 meters from her. **Close framing achieved through lens reach** — chest-up on Haruka, her face razor-sharp, the green chalkboard and the soft shape of Ms. Tanaka behind her compressed into creamy bokeh.

Three things are being specified: the angle, the physical distance, and the fact that closeness comes from the lens rather than proximity. Without the distance, the model may simply place the camera close and render a wide-lens look at a telephoto number.

---

## Camera movement

**Default is locked.** State it:

> camera locked off at eye level behind Haruka's desk — a completely static shot, no pan, no push, no handheld drift

> Locked tripod for all four shots. Camera height at seated eye level. No dolly, no pan, no zoom, no push-in, no handheld drift. The frame is still; only the people move.

When movement exists, bound it numerically or geometrically:

> slow subtle push-in of 3 to 4 centimeters

> following Haruka in a slow gentle arc as she moves down the aisle. Depth held so the back-row window corner stays legible in the background.

> side tracking at moped speed, camera 3 meters away

> one smooth tracking movement per segment, matched to the moped speed, stable and level, no shake, no drift between angles mid-segment

**Lens lock**, for single takes especially:

> LENS LOCK 47°, no drift, no zoom, no push-in.

---

## Camera height

Always state it. Common values:

- `camera at eye level` — default
- `camera at seated eye level` — when the subject is seated, or when shooting a classroom from among the desks
- `low angle, from road level` / `camera positioned LOW and BEHIND` — deliberate, and usually doing staging work
- `slightly above desk height` — single-take interiors

---

## Framing size vocabulary

`full-body medium-wide` · `medium shot` · `medium two-shot` · `medium close-up` · `close-up, chest-up` · `head-and-shoulders` · `wide`

Combine with the subject and the anchor:

> MEDIUM CLOSE-UP on Ren asleep at his desk in the back-row window corner, held level. Shallow focus — Ren sharp, the window and classmates soft behind him.

---

## Depth of field

State what is sharp and what is not. It is a compositional instruction, not a technical one.

> Shallow depth of field — Haruka sharp, staff room soft behind.

> Shallow comfortable depth of field: the laptop lid edge, the man and the fairy sharp; the room behind him melts into soft warm bokeh.

> Shallow focus falling onto him, the rest of the room soft.

> deep focus, the whole room visible, straight lines rectilinear, no telephoto compression

---

## Format

`horizontal cinematic` is the default and should be stated in FORMAT MODE.

**Vertical tightens every constraint above.** The frame is narrow, so:

- Faces occupy less horizontal space at the same FOV
- Group shots are far more punishing to identity locks
- Lower the FOV ceiling for identity-bearing shots to roughly 45°
- Two-shots are difficult; prefer singles and cut between them

---

## Level horizons

If the project locks framing discipline — and most narrative work should — state it in three places:

- FIRST FRAME: `First frame — level, straight, well-composed, flat true horizon:`
- STYLE: `Steady, level, well-composed framing throughout — no tilted or crooked horizons.`
- POSITIVE LOCKS: `Every shot is level, straight, and well-composed — flat true horizon, no dutch tilt, no crooked framing.`
