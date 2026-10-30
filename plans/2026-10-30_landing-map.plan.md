---
slug: 2026-10-30_landing-map
status: active
started: 2026-10-30
finished:
issue:
---

# F3: the landing page, with the map and Sam's intro

## Context

- The home page (`src/routes/+page.svelte`) is still the scroll reader's page with the scroll
  reader taken out: a kicker, the title, three paragraphs of draft copy "for Sam to replace",
  Start reading, a Chapters list, the credits board, the licence line and the footer.
- Sam's intro (29 Oct) is in `src/content/intro.md`, verbatim. It is six paragraphs plus the
  licence line. Its "here" link has no target yet (`#TODO-link`), and it promises a November
  release "here (riverbanks.lol)", which reads oddly once the comic is live.
- The map is `static/map/sunda-landmass.svg`, 1000×596 (sea `#A9CAC4`), from the holding page.
- The mockup's iPad board ([MVP mockups](https://claude.ai/artifact/5N9u5BM2rdNbbjKcEDRKor),
  "Riverbanks landing on iPad"):
  - The map fills the top 640 of 1180 px, cropped to the middle of the landmass, labelled
    "The Sunken Continent".
  - It has seven glowing yellow markers: "Start here · Prologue" plus I–V and Epi.
  - Below it: the kicker, the title, a lede, three buttons (Start reading, Meet the cast,
    Get involved) and a "best read on a tablet held upright" note.
- The marker positions in the mockup are a sketch. The [roadmap](2026-10-29_mvp-roadmap.plan.md)
  makes "Yan placing the markers on the map" a dependency of F3.
- Meet the cast (F5) and Get involved (F4) don't exist yet.

## Goal

On an iPad held upright, `riverbanks.lol` shows the map with a glowing marker per chapter and the
first two paragraphs of Sam's intro without scrolling. Tapping a marker opens the reader at that
chapter's divider (`/p/4` … `/p/43`). Start reading opens the Prologue. The rest of the intro, the
credits and the licence line follow below.

## Approach

**Markers are data, in map coordinates.** `src/lib/comic/map.ts` holds one marker per chapter,
keyed by the chapter's `first` page, at `{ x, y }` in the SVG's own 1000×596 units, plus the crop
the hero shows. A pure function turns a marker into `left`/`top` percentages inside the crop, and
marks one outside the crop as off-map, so it isn't drawn. Positions survive a change of crop or
screen size, and a test catches a chapter without a marker.

**Hero: a fixed-aspect box, not `object-fit: cover`.** The hero is a box with the crop's aspect
ratio. The map image inside is positioned so the crop fills it, and the markers are HTML links
laid over it at percentages. With `cover`, the visible part would depend on the screen, and the
markers would drift off the land. On a phone the same crop just gets smaller.

Rejected: markers as SVG `<a>` inside an inline map. Labels would scale with the map and get tiny
on a phone, and the focus rings and hit areas are fiddlier than on HTML links.

**Placing the markers: a dev-only placement mode.** In `npm run dev`, `/?place` makes each marker
draggable and shows a "Copy positions" button. It copies the `MARKERS` object, ready to paste into
`map.ts`. Yan drags them to where each act happens and pastes. Until then they sit at the
mockup's sketch positions. The mode isn't in the production build (`import.meta.env.DEV`).

**Copy: Sam's words, verbatim.**
- The intro comes from `src/content/intro.md`, rendered at build time (a small Markdown step:
  paragraphs, italics, links). The first two paragraphs sit beside or under the title above the
  fold; the other four follow.
- The draft paragraphs I wrote go.
- The lede from the mockup ("A climate fiction comic about the institutions…") isn't Sam's. It
  stays out unless Sam wants it.
- The "November" paragraph and the "here" link are open questions for Sam. Until they're
  answered, "here" is plain text (`REACH_OUT_URL = null` in `+page.svelte`) rather than a dead
  `#TODO-link` or a guessed address.
- Sam's closing "© Creative Commons…" line isn't repeated: the licence line under the credits
  says it.

**Buttons.** Start reading now. Meet the cast and Get involved appear when F5 and F4 land: each
is behind a constant, like the newsletter box already is. The Chapters list stays below the
intro: it is the keyboard and screen-reader route to each act, and the list version of the
markers.

## Tasks

- [x] `map.ts`: markers per chapter, the crop, and the placement maths, with tests first
- [x] Intro from `intro.md` at build time (paragraphs, italics, links), tested
- [x] Hero: the cropped map with glowing markers linking to `/p/<first>`, the "Start here"
      label on the Prologue
- [x] Below the hero: kicker, title, Sam's first two paragraphs, Start reading, the tablet
      note; then the rest of the intro, Chapters, credits, licence, footer. Draft copy removed
- [x] Dev-only `/?place`: drag markers, copy positions
- [ ] Yan places the markers; paste them in
      Desktop Chrome, 30 Oct: seven markers in reading order, each linking to its divider
      (`/p/11` opens Act Two, Back returns home); `/?place` drags, nudges with the arrows and
      copies the `MARKERS` object; the production build has no placement bar. Fixed on the way:
      the intro's link style blanked the Start reading button, and labels crossing a coast got
      lost (now haloed). Phone width not checked: the browser window wouldn't resize
- [ ] Preview deploy; Verification on the iPad

## UI mockups (ASCII)

iPad portrait (820×1180), from the mockup board:

```
┌──────────────────────────────────────────────┐
│ THE SUNKEN CONTINENT                         │
│        · IV                                  │
│   · I                                        │
│ · V          ◉ Start here · Prologue         │  map, cropped,
│                                              │  aspect fixed
│  · III              · II                     │
│                               · Epi          │
├──────────────────────────────────────────────┤
│ SEAPUNK STUDIOS PRESENTS                     │
│ RIVERBANKS                                   │
│ Welcome to Riverbanks, a climate fiction     │  Sam ¶1
│ series by Seapunk Studios.                   │
│ Riverbanks explores the idea of ecoarchy…    │  Sam ¶2
│ ( Start reading → )                          │
│ Best read on a tablet held upright. Tap a    │
│ glowing marker to start at that act.         │
├──────────────────────────────────────────────┤  fold
│ Conceived in early 2026…                     │  Sam ¶3–6
│ CHAPTERS  1 Prologue … 7 Epilogue            │
│ CREDITS   [credits board]                    │
│ licence line                                 │
│ RIVERBANKS.LOL               SEAPUNK STUDIOS │
└──────────────────────────────────────────────┘
```

Phone (390 wide): the same crop, 390 × ~303. Marker labels shrink to the numeral and the
"Start here" pill stays. Text below, one column.

Placement mode (`/?place`, dev only):

```
┌──────────────────────────────────────────────┐
│ PLACING MARKERS · drag them  [Copy positions]│
│        ✥ IV                                  │
│   ✥ I         ✥ Start here · Prologue        │
│ …                                            │
└──────────────────────────────────────────────┘
```

## Keyboard interaction

1. **Tab order:** the markers in reading order (Prologue … Epilogue, not their map order), then
   Start reading, the intro's links, the Chapters list, the credits board, seapunk.asia.
2. **Shortcuts:** none on the landing page. In placement mode a focused marker moves 1 unit with
   the arrow keys, 10 with Shift.
3. **Focus:**
   - Each marker is a link named for its chapter ("Prologue: Six Disasters, One Dream, from
     page 4"), with a visible focus ring around the dot.
   - Back from the reader returns to the landing page as it was. The browser restores scroll;
     nothing to manage.

## Test list (TDD)

- [x] every chapter in `EDITION` has a marker, and every marker is a chapter — unit — `src/lib/comic/map.test.ts`
- [x] `place(marker, crop)` gives percentages inside the crop: the crop's corners give 0% and 100% — unit — `map.test.ts`
- [x] a marker outside the crop is reported as off-map — unit — `map.test.ts`
- [x] markers come out in reading order whatever their map order — unit — `map.test.ts`
- [x] `intro()` splits `intro.md` into paragraphs, drops the frontmatter, and keeps italics and links as HTML — unit — `src/lib/content/intro.test.ts`
- [x] the `#TODO-link` target is replaced, never rendered — unit — `intro.test.ts`

## Verification

On the preview, on an iPad held upright:

1. Open `/`. The map with seven glowing markers and the first two paragraphs of Sam's intro show
   without scrolling.
2. Tap the Act Two marker: the reader opens on Act Two's divider and the URL reads `/p/11`.
   Back returns to the landing page.
3. Tap Start reading: `/p/4`, the Prologue.
4. Scroll: the other four paragraphs, the chapters, the credits board, the licence line and the
   footer. No draft copy is left.
5. Keyboard (laptop): Tab from the top reaches the markers in reading order, each with a visible
   ring, and Enter opens the reader.
6. Phone width (390): the map is shorter but every marker is still on the land, and the text fits
   with no sideways scroll.

## Out of scope

- The fuller map (a diorama per location, director's commentary).
- Meet the cast (F5) and Get involved (F4) pages: only their buttons, hidden until they exist.
- Rewording Sam's intro.
- Animated markers beyond a gentle glow; no map pan or zoom.

## Open questions

- [ ] Where does each act happen on the map? Yan places them (placement mode).
- [ ] The intro's "here" link: the F4 form once it exists; until then, an email address? Which?
- [ ] Sam's "will be released here … in November 2026" paragraph: reword for launch? Sam's call.
- [ ] Keep the mockup's lede line, or only Sam's words? (Plan: only Sam's.)

## Outcome

_Filled in when this goes to `done` or `abandoned`._
