---
slug: 2026-10-04_river-map-holding-page
status: draft
started: 2026-10-04
finished:
issue:
---

# riverbanks.lol: river-basin map home, behind a Taro "under construction" page

## Context

Every A1 board in the *Riverbanks* exhibition has `riverbanks.lol` in its footer. The exhibition
is the BKKCAW 2026 premiere in Lumpini Park, October 2026; exact dates are not recorded yet. The
footer is the bare domain with no QR and no path (`HOUSE_BANDS.footer` in
`riverbanks-generator/src/lib/model/bands.ts`), so every visitor lands on `/`.

The comics, canon and source material are in `~/Coding_work/riverbanks-generator`:

- Canon: `content/canon/riverbanks-canon.md` (running order, cast, production state).
- Comics: private Supabase rows in `riverbanks-comics`. No rendered pages are stored, and
  server-side export is only a draft plan (`plans/2026-10-01_page-export.plan.md` there).
- Maps: `scripts/sunda-maps.py` builds `riverbanks/maps/sunda-landmass.svg` and `sunda-river.svg`
  from ETOPO 2022. That covers present coast, the −120 m lowstand coast and the drowned rivers from
  flow routing, clipped to 88–128°E, 12°S–24°N. The SVGs are gitignored; the script is the source
  of truth.
- Taro: Ya's grey tabby, a kitten in 2052 (*The Year It Snowed*) and a teenage cat in 2065
  (*A Visa for a Hilsa*).

Yan's direction (2026-10-04): the home page will be an interactive map of Asia's river basins,
Ice Age and present, with points that open comic pages. For now the map sits in the background
and the front is an animation of Taro saying the site is under construction. More materials are
arriving over the coming days, so building waits.

Claude's proposals from the same discussion are under **Further ideas** below, as phase 3.

## Goal

Someone who scans or types `riverbanks.lol` on a phone sees Taro's animated under-construction
message straight away, with the river-basin map visible behind. Later, the same map becomes the
home page, with points that open comic pages.

## Approach

To be settled once the materials arrive. Provisional:

- **Stack (settled 2026-10-04):** SvelteKit on Vercel, scaffolded to match the generator, the
  newest of the `~/Coding_work` SvelteKit repos. That means Svelte 5 with runes forced, the kit
  config inside `vite.config.ts`, adapter-vercel 6, Tailwind v4 via `@tailwindcss/vite`, TS 6,
  vite 8, ESLint 10, Prettier and vitest. The design tokens are in `src/routes/layout.css`.
  Phase 1 is fully prerendered.
- **Map:** reuse `sunda-maps.py`'s pipeline rather than redraw, extended if the extent should be
  wider than Sunda. Ice Age and present as two layers or a toggle. For phase 1 a static SVG is
  enough; a pan/zoom map (SVG with d3-zoom, or MapLibre with vector tiles) only once points exist.
- **Taro:** a Blender render played as a transparent video loop (WebM VP9 with alpha, plus HEVC
  with alpha for Safari) over the map. Not live 3D. The script is `art/taro/taro_blender.py`.
  The generator has only one reference image per Taro (1264×848, private `style-refs` bucket),
  not separate front, three-quarter and side portraits.
- **Points → comic pages:** each point is a place in a story, opening its boards. This needs
  exported page images; the quickest route is hand-exported PNGs committed as static files.

## Tasks

<!-- Provisional; rewritten once the materials land. -->

**Phase 1: holding page**
- [x] Scaffold SvelteKit (matching the generator)
- [ ] Deploy to Vercel; point `riverbanks.lol` at it
- [ ] River-basin map background (Ice Age + present) generated from the generator's pipeline
- [ ] Taro under-construction animation over the map
- [ ] Meta tags and share card; check it on a phone

**Phase 2: map as home** (later)
- [ ] Points of interest data (place, story, act, board)
- [ ] Interactive map; points open comic pages
- [ ] Comic page viewer

**Phase 3: further ideas** (pick from the list below once phase 2 is in)
- [ ] Welcome Q&A layer on the home page
- [ ] Read the comics in act order, with Thai
- [ ] Sign the Third Amendment
- [ ] Delegate badge / Puck statement for your river
- [ ] Who's who and timeline
- [ ] "This isn't (entirely) fiction": ideas, narrated Accord deck, reading list, credits
- [ ] PESA in-character chat (stretch)

## Further ideas

Claude's proposals, 2026-10-04. They share one conceit: the moodboard says the exhibition speaks
*as if nonfiction*, "a 'documentary' made in, and about, this world". So the site is the public
portal of **PLURIVERS** (the Planetary League of United Rivers), straight-faced and a little
bureaucratically absurd. The real-world material sits one honest click away. The IMF/World Bank
Annual Meetings at QSNCC (12–18 Oct, about 3 km from Lumpini) are an irony to use lightly.

Each idea notes how it hangs off the map, so they add to Yan's design rather than compete with it.

1. **Welcome Q&A (the five-second test).** The footer is the bare domain, so `/` must orient a
   phone visitor in the park at once. Use the exhibition's welcome-board questions: *Who owns the
   rivers now? What happened to insurance? What's a Puck? Why is everything teal?* Each expands to
   a few lines. "Welcome to the World Bank" was floated as a pun and could head it. *On the map:* a
   collapsible sheet over the map once Taro steps aside.
2. **Read the comics.** Every board in running order: Prologue, Act One, Act Two (*The Youngest
   Delegate*), Act Three (KAE), Act Four (*The Year It Snowed*), Act Five (*A Visa for a Hilsa*),
   Epilogue (*Moving House*). Pages zoom on a phone. The most useful thing on the site, for people
   who skipped boards, want to finish later, or never came. **A Thai version** is the biggest
   single win; at 80–120 words a board, translation is tractable. *On the map:* the same viewer the
   points open, plus a linear "read from the start" path.
3. **Sign the Third Amendment.** The Chao Phraya Accord has an unsigned amendment with one line for
   the IMF Managing Director and one for the river. Visitors sign and name their home river; the
   site shows a running count and the latest signers. The one participatory act, and it suits the
   12–18 Oct timing. Needs a small database and spam protection. *On the map:* each signature drops
   a dot on its river.
4. **A delegate badge, or Puck statement, for your river.** Pick a real river (Chao Phraya, Ping,
   Mekong, Meghna…) and get a shareable Sunda Summit delegate badge, or *Your Puck Statement* in the
   PROSPER house style. Built for sharing after the visit. *On the map:* choose your river on the
   map.
5. **Who's who and the timeline.** A public, pared-down version of the generator's `/network`: 21
   people and institutions, 31 ties, year scrubber, portraits. The data (`story_network` table) and
   the portraits bucket are already public. *On the map:* characters pinned where they live, moving
   as the year scrubber runs from 2027 to 2090.
6. **"This isn't (entirely) fiction."** The ideas underneath: the central-banking lightning talk,
   the narrated *Chao Phraya Accord* deck (audio already made), Keynes's Clearing Union "restated as
   hydrology", the reading list (Margulis, Graeber, *Hospicing Modernity*, Eichengreen…), and
   credits for Seapunk Studios, Cosmo Local CNX and each contributor.
7. **Side-board extras.** The exhibition's "commercial breaks" work as small web pages: the KAN gig
   board of this week's bounties, PESA small print, GDI Cookbook recipes (Underfoot Taro Pot,
   Seed-Swap Sesame Balls), *The Seven Signs*.
8. **PESA, "customer support for the planet"** (stretch). An in-character chat answering questions
   about the Pluriverse from canon. In tone and fun, but a live model at a public event needs spend
   caps, rate limits and abuse handling, so not for a first release.

Practical notes for these:

- **Getting pages out is the hard part.** Comics are private Supabase rows with no stored renders;
  browser PNG export is known to hang and server export is a draft plan. The quickest route is to
  hand-export each locked story as PNG or PDF and commit static files.
- **Assets live outside git.** `riverbanks/` (slides, audio, maps, moodboard) is gitignored in the
  generator and needs copying in.
- **Per-act QR paths** (e.g. `riverbanks.lol/act-two`) are possible through the boards' empty QR
  slot, if they are not printed yet. Otherwise the bare domain is fine.

## UI mockups (ASCII)

Phase 1, phone:

```
┌──────────────────────────┐
│ ░░ river-basin map ░░░░░ │  ← very faint (~12%) on paper
│ ░░░░░░░╱╲░░░░░░░░░░░░░░░ │
│ ░░░┌────────────────┐░░░ │
│ ░░░│   (Taro anim)  │░░░ │
│ ░░░│ "Under         │░░░ │
│ ░░░│  construction, │░░░ │
│ ░░░│  check back    │░░░ │
│ ░░░│  soon"         │░░░ │
│ ░░░└────────────────┘░░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░ │
│ RIVERBANKS · SEAPUNK     │
└──────────────────────────┘
```

## Keyboard interaction

Phase 1 has nothing to click except possibly a link or two (Seapunk, Instagram). Tab order: those
links in reading order. Phase 2 needs a full keyboard path through the map's points; to be written
then.

## Verification

- Open `https://riverbanks.lol` on a phone on mobile data: Taro and the message are visible
  without scrolling, and the map shows behind.
- With reduced motion turned on, Taro is a still image.
- The share card shows correctly when the link is pasted into LINE and WhatsApp.

## Out of scope

- Everything in phase 2 until the materials are in.
- Changing the board footers or adding QRs (the generator's business).

## Open questions

- [ ] Map extent: the existing maps cover Sunda (88–128°E, 12°S–24°N). "River basins around Asia"
      may need a wider extent, e.g. the Mekong, Salween, Irrawaddy, Brahmaputra/Meghna (Hilsa is
      set on the Meghna, which is at the edge of the current clip).
- [ ] "Present" rivers: the pipeline derives the drowned rivers by flow routing. Present-day rivers
      come either from the same routing above sea level or from HydroRIVERS. Which?
- [x] Taro art format: a Blender render as a transparent video loop (decided 2026-10-04).
- [x] Taro's look, age and message (2026-10-04): the kitten in the comic look (toon shading
      and ink) from a Higgsfield Tripo mesh (credits approved). Taro **says** "Under
      construction! Check back soon." in a speech balloon, and the map behind is **very, very
      faint** (about 12% opacity on paper). See [taro-rig-and-clips](2026-10-04_taro-rig-and-clips.plan.md)
      and the preview at https://claude.ai/artifact/Trw9tAciyJn1qZtWVHysAg.
- [ ] Exhibition dates, and when the holding page must be live.
- [ ] Is `riverbanks.lol` registered, and who controls its DNS?
- [ ] Should the holding page be in Thai as well as English?
- [ ] Does the site stay in-world (PLURIVERS portal), or say up front that it is a fiction
      exhibition? The Further ideas assume in-world with an honest "about" page.
- [ ] Which of the further ideas, if any, should be live during the exhibition itself?

## Outcome

_Filled in when this goes to `done` or `abandoned`._
