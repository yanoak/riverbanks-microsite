---
slug: 2026-10-30_landing-map
status: active
started: 2026-10-30
finished:
issue:
---

# F3: the landing page, a full-screen map with Sam's intro

## Context

- Sam's intro (29 Oct) is in `src/content/intro.md`, verbatim: six paragraphs plus a licence
  line. Its "here" link has no target yet (`#TODO-link`). It promises a November release "here
  (riverbanks.lol)", which reads oddly once the comic is live.
- The map is `static/map/sunda-landmass.svg`, 1000×596 (sea `#A9CAC4`), from the holding page.
- The marker positions are a sketch from the first mockup. The
  [roadmap](2026-10-29_mvp-roadmap.plan.md) makes "Yan placing the markers on the map" a
  dependency of F3.
- Cast (F5) and Get involved (F4) don't exist yet.

**Revised 30 Oct.** The first version (commit `7cc1d31`) followed the old iPad mockup: the map as
a band across the top, with the text, chapters and credits scrolling below it. Yan rejected it:
it has to work on tablet, phone and desktop alike. The brief became:
- the map full screen;
- a header menu that turns into a hamburger;
- the welcome text over the map in a translucent panel;
- hovering a chapter highlights its place on the map;
- the credits on a page of their own.

The designs are boards 10–14 on the [MVP mockups](https://claude.ai/artifact/5N9u5BM2rdNbbjKcEDRKor)
canvas ("Landing v2"); Yan approved them on 30 Oct. From the first version, `map.ts` (markers in
map units), `intro.ts` and the dev placement mode carry over.

## Goal

`riverbanks.lol` opens on the map, filling the screen on a phone, a tablet or a laptop, with a
glowing marker per chapter and Sam's welcome over it.
- On a wide screen the welcome and the chapter list sit in a panel on the left. Hovering a
  chapter lights its marker, and hovering a marker lights its chapter.
- On a portrait tablet or a phone, the panel docks at the bottom.
- Every marker and chapter opens the reader at that chapter's divider.
- The header's links (Chapters, Credits, Start reading) fold into a hamburger on narrow screens.
- `/credits` shows the credits board.

## Approach

**Two layouts, picked by the screen's shape.** *Side*: width ≥ 900 px and wider than tall (a
laptop, an iPad held landscape). *Bottom*: everything else (iPad portrait, phones).
- **Side:** a translucent panel 460 px wide on the left, below the header. It holds the kicker,
  the title, Sam's first two paragraphs, Start reading and Get involved, the chapter list, then the rest of the
  intro. It scrolls inside itself if it's taller than the screen.
- **Bottom:**
  - On a tablet, a panel across the bottom with the welcome and the chapters as two columns
    of buttons.
  - On a phone, a sheet whose top shows the kicker, the title, ¶1, Start reading and a row of
    chapter chips; the rest scrolls inside it.

  A side panel on a portrait screen would cover most of the map (agreed on the boards).

**The map frames the markers in whatever space the panel leaves.** A pure function,
`frame(view, free, bounds)`, takes the screen size, the free rectangle (the screen minus the
header and the panel) and the markers' bounding box in map units. It returns the map's scale and
offset:
- The markers' box, padded, fits and is centred in the free rectangle.
- Where the map is bigger than the screen, its edges are pulled back to the screen's edges, so
  no sea-coloured gap shows.

The page measures the panel (`ResizeObserver`) and reframes when it or the screen changes. Markers
are placed in pixels from their map units. Rejected: fixed crops per breakpoint. They break
between breakpoints and every time Yan moves a marker.

**Highlighting is shared state, not CSS `:has()`.** The page holds `hot` (a chapter's first page,
or null). A chapter row and its marker set it on pointer enter and focus, and clear it on leave
and blur. A hot marker grows, glows harder and shows its title pill; a hot row is shaded. The
Prologue's "Start here" pill always shows. The mockup used `:has()`, which works, but state also
covers keyboard focus and is testable.

**Get involved is a prominent call to action** (Yan, 30 Oct):
- it's a second button beside Start reading in the header, the panel and the menu, outlined so
  Start reading stays first;
- it points at `GET_INVOLVED_URL` in `src/lib/site.ts`, the F4 form once it exists and something
  interim until then (open question).

**Header.** `SiteHeader.svelte`, shared by `/` and `/credits`: the wordmark (home), Chapters,
Credits, Get involved and Start reading.
- Cast is in the design but behind a constant until F5 lands, like the newsletter box.
- Below 900 px: the wordmark, Start reading (on tablets only) and a hamburger. The hamburger
  opens a full-screen menu (board 13) that closes with Esc, the ✕, or a link.
- On `/`, Chapters scrolls the panel to its list and focuses the first chapter. Elsewhere it
  goes to `/#chapters`.

**Credits page** `/credits` (board 14): the credits board image, a line about the premiere,
Open full size, the licence line and Back to the map. On a phone it's one column. The home page
no longer carries the credits.

**Kept from the first version:**
- Markers as data in map units (`map.ts`, now without `CROP`).
- `intro()` from `intro.md`: Sam's words verbatim, with the "here" link as plain text until there's
  a target, and the © line left out in favour of our licence line.
- `/?place` in dev for Yan to drag the markers into place.
- The halo on labels.

## Tasks

- [x] `map.ts` markers in map units; `intro.ts` from `intro.md`, tested (first version)
- [x] Dev-only `/?place`: drag markers, copy positions (first version)
- [x] First version: map band on top, text below (`7cc1d31`), superseded by the redesign
- [x] Designs for the redesign: boards 10–14 on the mockup canvas, approved by Yan
- [x] `frame()` and `bounds()` in `map.ts`, tests first; drop `CROP` and `place()`
- [x] `SiteHeader.svelte`: links, Get involved, hamburger and the full-screen menu
- [x] Full-screen `MapStage.svelte` with markers in pixels, hot state, and placement mode moved in
- [x] Landing: side panel and bottom panel and sheet, chapter list and chips sharing `hot`, Sam's
      intro
- [x] `/credits` page; credits out of the home page
- [ ] Yan places the markers; paste them in
      Desktop Chrome, 30 Oct:
      - 1522×757: side layout, every marker clear of the panel; hovering Act Two's row lights
        its marker and pill, and focusing Act Three's row does the same.
      - In iframes: 1180×820 gets the side layout. 820×1180 has the bottom panel with chapter
        buttons, and every marker sits above it. 390×844 has the sheet with title, ¶1, both
        buttons and the chip row, ¶2 below.
      - The hamburger opens the menu with focus on Start reading.
      - `/#chapters` focuses the first chapter. `/credits` stacks on a phone.
      - No console errors.
      Fixed on the way: chips squashed to zero height in the scrolling sheet, and the space
      before "·" lost. Not checked: real touch, Safari's `backdrop-filter`, rotating an iPad
- [ ] Preview deploy; Verification on the iPad and a phone

## UI mockups (ASCII)

The boards are the reference (10 desktop, 11 iPad portrait, 12 phone, 13 phone menu, 14 credits).

Side layout (desktop, iPad landscape):

```
┌───────────────────────────────────────────────────────────────────────────┐
│ RIVERBANKS            Chapters  Credits  ( Start reading → )              │ header, translucent
├───────────────────────────────────────────────────────────────────────────┤
│ ┌───────────────────────┐                ◉ IV                             │
│ │ SEAPUNK STUDIOS PRES… │        ◉ I                                      │
│ │ RIVERBANKS            │   ◉ V        ◉ Start here · Prologue            │
│ │ Welcome to …          │                        [Act Two · House of… ]◉II │ hot: pill + glow
│ │ Riverbanks explores … │       ◉ III                                     │
│ │ ( Start reading → )   │                                         ◉ E    │
│ │ CHAPTERS              │                                                 │
│ │ P Prologue …      p4  │                                                 │
│ │▓II Act Two …     p11 ▓│ ← hot row                                       │
│ │ …  (then ¶3–6)        │                          CC BY-NC · seapunk.asia│
│ └───────────────────────┘                                                 │
└───────────────────────────────────────────────────────────────────────────┘
```

Bottom layout (iPad portrait; a phone is the same with a sheet and a chip row):

```
┌──────────────────────────────┐
│ RIVERBANKS  (Start reading) ≡│
│      ◉ I            ◉ IV     │
│ ◉ V    ◉ Start here          │  the map frames the markers
│    ◉ III        ◉ II         │  in the space above the panel
│                        ◉ E   │
│ ┌──────────────────────────┐ │
│ │ RIVERBANKS               │ │
│ │ Welcome … explores …     │ │
│ │ [P Prologue] [I Act One] │ │
│ │ [II …]       [III …]     │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

Menu open (below 900 px): full screen, paper at 96%, items 60 px tall: Start reading →,
Chapters & map, Credits, and the licence line at the bottom.

## Keyboard interaction

1. **Tab order:**
   - The header: wordmark, the links or the hamburger, Start reading.
   - Then the panel: Start reading, the chapter rows, the intro's links.
   - Then the markers, in reading order.
   - Opening the menu puts focus on its first item, and Tab stays inside it until it closes.
2. **Shortcuts:** Esc closes the menu. In `/?place` (dev), arrows move a focused marker (Shift
   for 10).
3. **Focus:**
   - Focusing a chapter row or a marker makes it `hot`, the same as hovering.
   - Closing the menu returns focus to the hamburger.
   - The header's Chapters on `/` focuses the first chapter row.
   - Back from the reader lands on `/` with nothing hot.

## Test list (TDD)

- [x] every chapter has a marker, and markers come out in reading order — unit — `src/lib/comic/map.test.ts`
- [x] `intro()`: frontmatter, paragraphs, italics, links, the TODO link — unit — `src/lib/content/intro.test.ts`
- [x] `bounds(markers, pad)` is the padded box around the markers, in map units — unit — `map.test.ts`
- [x] `frame()` fits the markers' box inside the free rectangle and centres it — unit — `map.test.ts`
- [x] `frame()` pulls the map's edges back to the screen's when the map is bigger than the screen, so no gap shows — unit — `map.test.ts`
- [x] `frame()` with a free rectangle wider than the box is limited by height, and the other way round — unit — `map.test.ts`
- [x] `toScreen(point, frame)` turns map units into pixels — unit — `map.test.ts`
- [x] `layout(w, h)` is `'side'` for 1440×900 and 1180×820, `'bottom'` for 820×1180 and 390×844 — unit — `map.test.ts`

## Verification

On the preview:

1. **Laptop (1440×900):**
   - The map fills the window, with the header and the left panel over it, and every marker
     clear of the panel.
   - Hover Act Two in the list: its marker grows and names itself. Hover the Epilogue
     marker: its row shades.
2. **Keyboard:** Tab through the chapter rows. Each one lights its marker, and Enter opens
   `/p/<first>`.
3. **Narrow window (< 900 px):** the header shows a hamburger. Enter opens the menu with focus
   on its first item; Esc closes it and focus returns to the hamburger.
4. **iPad portrait:**
   - The map fills the screen and the panel sits at the bottom, with every marker above it.
   - Tap Act Two's button: `/p/11`. Back: the landing as it was.
   - Turn the iPad to landscape: the side layout.
5. **Phone (390 wide):** the sheet shows the title, ¶1, Start reading and the chips. The rest
   scrolls inside the sheet, and the map frames the markers above it.
6. **`/credits`:** the board, Open full size, Back to the map. The home page no longer has
   credits.

## Out of scope

- The fuller map (dioramas, director's commentary), map pan and zoom.
- The Cast (F5) and Get involved (F4) pages: their menu items stay hidden until they exist.
- Rewording Sam's intro.
- A dragged bottom sheet. The phone's sheet scrolls inside itself instead.

## Open questions

- [ ] Where does each act happen on the map? Yan places them (placement mode).
- [ ] The intro's "here" link: the F4 form once it exists; until then, plain text.
- [ ] Get involved before F4 exists: where does it point? Sam's Google Form directly, or an
      email address?
- [ ] Sam's "will be released here … in November 2026" paragraph: reword for launch? Sam's call.

## Outcome

_Filled in when this goes to `done` or `abandoned`._
