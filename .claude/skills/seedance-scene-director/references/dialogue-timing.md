# Dialogue, timing, and mouth control

Speech is the single most common cause of failed generations. It has a hard duration, it requires a visible mouth, and it competes with every other beat in the shot.

---

## Language

**Prompt body in English. Lines in the language actually spoken.**

(The English-body convention comes from the shipped reference-drama corpus. Seedance is Chinese-native and full-Chinese prompt bodies are also proven at production scale — the Mx-Shell corpus is written entirely in Chinese. Pick one body language per project and stay consistent; what is never negotiable is the dialogue-language rule below.)

```
DIALOGUE (begins at 3.9s): はるかです。写真と、読書が好きです。みんなと仲良くできたら嬉しいです。
DIALOGUE (Mei, bright and quick, begins at 0.4s): はるかさん、職員室に教科書を取りに行ってって。
DIALOGUE (the boy beside him, whispered, urgent, begins at 4.2s): レン、先生来たぞ。
```

Never translate a line into English "for the model." The spoken language determines the mouth shapes; translating it guarantees a lip-sync mismatch.

---

## Duration

Compute before assigning the shot length. This is Gate 3.

```
Japanese  = mora ÷ 6.5  +  0.4 × (sentences − 1)
English   = syllables ÷ 4.0  +  0.4 × (sentences − 1)
```

Add 0.2s per internal comma pause. Add 1.0s headroom to the shot on top of the result.

**Counting mora**: each kana is one mora. Small ゃゅょ attach to the preceding kana (きょ = 1). ん, っ, and long vowels each count as one.

### Worked example — the case that failed

> はるかです。写真と、読書が好きです。みんなと仲良くできたら嬉しいです。

| segment | mora |
|---|---|
| はるかです | 5 |
| しゃしんと | 4 |
| どくしょがすきです | 8 |
| みんなと | 4 |
| なかよく | 4 |
| できたら | 4 |
| うれしいです | 6 |
| **total** | **35** |

35 ÷ 6.5 = 5.4s, plus 2 sentence gaps × 0.4 = 0.8s → **6.2s**, plus a comma pause → **~6.4s**.

| version | shot | line starts | available | outcome |
|---|---|---|---|---|
| success | 7.5s | 0.4s | 7.1s | clean |
| failure | 5.0s | ~0.5s | 4.5s | **1.9s short — clipped and desynced** |

### Second worked example — the overload

> はるかさん、職員室に教科書を取りに行ってって。
> あ、それと、私、メイっていうの。よろしくね。

≈ 42 mora across 4 sentences ≈ **7.0s**. It was placed in a 7.5s shot that also had to contain: Mei walking up, stopping, leaning in; Ren crossing the aisle and exiting a door; and several students working at their desks. The overflow pushed into the following shots and the staging collapsed.

**A dialogue shot holds the line, the speaker's own small business, and nothing else.**

---

## Visibility — Gate 1

A line requires a mouth the camera can see.

Before writing any line, confirm all four:

- [ ] The speaker has their **own reference token** — not a description buried inside a location reference
- [ ] The speaker's face is **visible in this shot**
- [ ] The camera is on the side **where the mouth can be seen**
- [ ] **At most two** simultaneous speakers

### Hidden speakers

A character deliberately concealed — silhouette, back of head, anonymous extra — **cannot be given a line.** These three requirements coexisted in one shipped prompt:

```
DIALOGUE (the boy beside him, whispered, urgent, begins at 4.2s): レン、先生来たぞ。
his face is never given a clear look
accurate lip-sync
```

The model resolved it by moving the knocking action onto the sleeping, visible character — who performed it with his eyes closed, because a separate lock said he never opens them. Both locks held. The scene broke anyway.

**Replace the line with sound.** The successful version of the same scene:

> A hand reaches in from the side and raps on his desk — knuckles on wood, twice.
> **NO DIALOGUE — nobody speaks.**

Intent conveyed, no impossible requirement created.

### Crowds

Three or more speaking at once is not a dialogue problem. It is a **sound design** problem.

A shipped prompt asked sixteen students, shot from behind at 84°, to speak a line in unison. The model turned every student around to face camera — away from the person they were addressing — because that was the only way to render mouths.

The successful version of the same beat:

> a soft warm rustle spreading across the room, chairs shifting, a quiet murmur of approval, a single quiet laugh

Vocabulary for crowd reaction without lip-sync:

- a warm rustle spreading across the room
- chairs shifting, a quiet murmur of approval
- a single quiet laugh
- someone claps once
- overlapping student chatter, laughter, bags shifting
- the loose low hum of a class left alone — faint shifting, distant murmur, kept low

Pair with visible non-verbal reaction in ACTION:

> The seated students turn their heads toward her. Faces open. A smile ripples across the rows, one after another. A girl in the second row nudges her neighbour. Someone nods. A boy near the window grins.

---

## Delivery notes

Attach to every line, inside the parenthesis. Emotion plus tempo.

```
(Mei, bright and quick, begins at 0.4s)
(the boy beside him, whispered, urgent, begins at 4.2s)
(0.4s, playful, intrigued)
(3.8s, reluctant, unsure, half-groaning)
(Haruka, begins at 7.8s)
```

For a single-take idiom, the line often sits inside ACTION TIMING with its own timestamp:

> At 6.5s he says: "Hold up, let me show you how to do this right." He lowers his arms mid-line and plants his free hand on his hip while still drifting in his small flight pattern.

Note `mid-line` — specifying what the body does *during* speech, not just before and after.

---

## Silencing mouths

Models animate mouths on characters who have no line. Every non-speaker in a shot with dialogue needs an explicit closure.

In AUDIO:

> Ms. Tanaka does not speak in this take and her lips stay closed.

> @MAN says no words; beyond the single gasp his lips stay still.

> Ren never speaks and no other dialogue is spoken.

In POSITIVE LOCKS:

> Only the two scripted Japanese lines are spoken, in order, with accurate lip-sync — Mei first, Haruka second; no other dialogue.

> Lips are still whenever a character is not speaking.

> Only the one scripted Japanese line is spoken, whispered, with accurate lip-sync.

Also standard:

> no other dialogue, no ad-libs, no narration
> Generate video without subtitles.

---

## Liveness

A face that is not speaking still needs to be alive, or it renders as a mask:

> All faces blink and breathe visibly; never frozen or masklike.
> Haruka blinks and breathes visibly throughout; her face is never frozen or masklike.
> Ren blinks and breathes visibly, groggy then alert — never frozen or masklike.

Include in POSITIVE LOCKS on every prompt with a human face in it.

---

## Speech order

When more than one character speaks, lock the sequence:

> Only the two scripted Japanese lines are spoken, **in order** — Mei first, Haruka second.

> Only the scripted Japanese line is spoken, by Ms. Tanaka, **once, in order**; Haruka does not speak; no other dialogue.

Without this the model can overlap them or reverse them.
