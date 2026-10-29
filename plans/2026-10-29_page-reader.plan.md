---
slug: 2026-10-29_page-reader
status: active
started: 2026-10-29
finished:
issue:
---

# F1: page reader, one page at a time

## Context

Feature F1 of the [MVP roadmap](2026-10-29_mvp-roadmap.plan.md). It replaces the scroll book that
[comic-reader-landing](2026-10-13_comic-reader-landing.plan.md) built
(`src/lib/components/ComicReader.svelte`): every page stacked in one long column, with a sticky
chapter select and a counter.

From the Yan <> Sam call on 21 Oct ([Granola](https://notes.granola.ai/d/bd194dfb-500f-4de6-ad43-f5b63a7b4489)):

- **The read is a 30–60 minute armchair read on an iPad held upright.** One page fills the
  screen, with nothing else on it.
- **Swipe to turn, with a clean snap.** A page should never rest half-turned or off-centre. In
  the scroll book a quick flick could land between two pages.
- **Pinch-zoom for the small lettering.** It must not fight the swipe: while zoomed, a swipe pans
  around the page and never turns it. A full-screen toggle as well.

Mockup boards 2–4 and 9 on the [MVP canvas](https://claude.ai/artifact/5N9u5BM2rdNbbjKcEDRKor)
show this: the chrome hidden, then tap for controls (chapter menu, scrubber, page), pinch-zoomed
with a "double-tap to fit" hint, and the phone version.

What carries over:
- **The chapter model.** `src/lib/comic/edition.ts`: since 29 Oct `contents()` lists only the
  chapter pages, Prologue to Epilogue, with their titles.
- **The page images.** `NN-800.webp` and `NN-1600.webp`, with the `?v=` version.
- **The footer is in the pages** ([F0](2026-10-29_premiere-edition-refresh.plan.md)), so the
  reader draws none.

## Goal

On an iPad held upright, `riverbanks.lol/p/15` opens page 15 filling the screen, with no chrome
showing. A swipe turns exactly one page and it always lands centred, however fast the swipe. A
pinch zooms in, and while zoomed a swipe pans and never turns the page. A tap shows the controls:
chapter menu, scrubber, previous and next, full screen and back to home. The arrow keys do the
same on a laptop. The URL follows the page, so reloading or sending the address opens the same
page. The scroll book is gone, and the home page links into the reader.

## Approach

**Turning and zooming are one gesture problem, so the choice of engine comes first,** decided by
a spike on a real iPad. Three routes:

1. **Native CSS scroll-snap strip with the browser's own pinch-zoom.** Least code, but browser
   zoom magnifies the whole layout viewport. Once panned to the edge, the snap strip scrolls and
   turns the page, which is the very fight Sam asked us to avoid. Safari also can't be told to
   zoom one element. *Expected to fail the zoom test. Kept in the spike only as the baseline.*
2. **PhotoSwipe 5** (MIT, no dependencies, about 20 kB gzipped). Built for this exact gesture set:
   swipe between slides with a snap, pinch and double-tap zoom, pan while zoomed without turning,
   keyboard, focus trap, and progressive loading of a bigger image when zoomed in. It is a
   lightbox, which suits a reader that takes over the screen anyway. Its default UI is replaced
   with our own controls. **Recommended**, if it passes the spike.
3. **Hand-rolled**: pointer events, a CSS transform per page, our own momentum and snap. Full
   control, but gesture code is where the weeks go (two-finger edge cases, Safari's gesture
   events, inertia). *The fallback only if PhotoSwipe can't be made to fit.*

The spike: a throwaway route with routes 1 and 2 on the same five pages. On the iPad, check ten
fast swipes, then zoom into a balloon and pan to the edge. Then the same on an iPhone and with a
laptop trackpad. Note the result in this plan.

**Routes: the reader lives at `/p/[n]`, and F1 owns that route.** The roadmap gave `/p/[n]` to
F2. But a reader whose URL can't name its page has to be rewired as soon as F2 starts, so F1
builds the route and keeps the URL in step (`replaceState`, so the Back button doesn't step
through 46 pages). F2 keeps the share sheet, the per-page share cards and the JPEGs.
- `n` is the PDF page number, the one the footer prints ("p15"). That keeps one number everywhere.
- A number outside the chapters (the cover pages 1–3, the credits, the posters) redirects to the
  first chapter page. Anything that isn't a number is a 404.
- Pages are prerendered, one HTML file per page. That gives F2 a static `og:image` for each.

**The controls** (from mockup board 3): hidden by default; a tap on the page toggles them. Top
bar: back to home, the chapter menu (current act's title, open for the list), full screen. Bottom
bar: previous, a scrubber with chapter ticks and a "p15" label, next. Share is left for F2,
leaving a gap for it. Full screen uses the Fullscreen API where it exists (iPad Safari has it;
iPhone Safari doesn't, so the button hides there). Controls fade after a few seconds without
input, but never while focus is inside them.

**The end of the book.** Turning past the Epilogue's last page lands on an end card: the credits
board (opens full size), back to home, and a slot for F4's form. The roadmap's phase 3 finishes it.

**Image sizes.** The 1600 px images are sharp at 1× zoom on an iPad (820 CSS px × 2 DPR). At 250%
zoom they are not. If the spike shows small lettering going soft, `comic-pages.sh` gains a 2400
tier, loaded only on zoom. That is about another 25 MB in git. That weight decides between Blob
and the repo, noted in F0.

**The home page:** the scroll book comes off `/`. The intro stays, "Start reading" goes to
`/p/{Prologue}`, and a plain chapter list links to each act. F3 replaces this with the map.

## Tasks

- [ ] Spike: scroll-snap baseline against PhotoSwipe on five pages, on the iPad, an iPhone and a
      trackpad; write the result here and pick the engine (throwaway branch, not merged)
- [ ] `src/lib/comic/reader.ts`: page/position helpers, the route's page guard, neighbours to
      preload (tests first, see the Test list)
- [ ] `/p/[n]` route, prerendered: the reader filling the screen, swipe and zoom, the URL kept in
      step, `<title>` naming the act and page
- [ ] Controls: tap to show, chapter menu, scrubber, previous and next, full screen, back to home;
      auto-hide
- [ ] Keyboard: every shortcut below, focus management, a visible focus ring
- [ ] End card after the Epilogue: credits, back to home, a slot for the form
- [ ] Home page: drop the scroll book, link "Start reading" and the chapter list into `/p/[n]`
- [ ] Higher-resolution tier for zoom, if the spike calls for it
- [ ] Phone pass (390 px): the same reader, with a one-time "pinch to zoom" hint
- [ ] Preview deploy; run Verification on the iPad with Sam

## UI mockups (ASCII)

iPad portrait, the default: the page fills the screen and nothing else shows.

```
┌───────────────────────────────┐
│                               │
│                               │
│          (page art)           │
│                               │
│                               │
│ RIVERBANKS VOL I …p15… SEAPUNK│  ← the footer is in the image
└───────────────────────────────┘
```

Tap the page, and the controls appear:

```
┌───────────────────────────────┐
│ ←  Act Two: House of…  ▾   ⛶ │  back · chapter menu · full screen
│                               │
│          (page art)           │
│                               │
│ ‹   ●───┼────┼──○──┼────┼──   ›│  prev · scrubber with act ticks · next
│               p15             │
└───────────────────────────────┘
```

Chapter menu open:

```
┌──────────────────────────────┐
│ Prologue: Six Disasters…  p4 │
│ Act One: Life, the Plur…  p6 │
│▶Act Two: House of Tamin… p11 │  ← current act
│ Act Three: Kinetic Ada…  p19 │
│ …                            │
└──────────────────────────────┘
```

Pinch-zoomed (the controls stay hidden):

```
┌───────────────────────────────┐
│  (part of the page, 250%)     │
│                               │
│   Swipe moves around the page │  hint, first zoom only
│   · double-tap to fit         │
└───────────────────────────────┘
```

End card, after the Epilogue:

```
┌───────────────────────────────┐
│        The end of Volume I    │
│     [ credits board thumb ]   │
│   Get involved →   (F4 slot)  │
│   ← Back to Riverbanks        │
└───────────────────────────────┘
```

Loading: the page's box at its aspect ratio, with the page number faint in the middle (as now).
Image failed: the same box, with the number and "Open full size".

## Keyboard interaction

1. **Tab order:** the page (focusable, so the keys work), then the controls in reading order
   when they're shown: back, chapter menu, full screen, previous, scrubber, next. Tab into the
   controls shows them.
2. **Shortcuts:**
   - `→`, `PageDown`, `Space`: next page. `←`, `PageUp`, `Shift+Space`: previous.
   - `Home` and `End`: the first and last page of the book.
   - `+` and `-`: zoom in and out. `0`: fit the page.
   - Arrow keys while zoomed pan the page; they don't turn it.
   - `F`: full screen on and off. `M`: show the controls and open the chapter menu.
   - `Esc`: close the menu, then hide the controls, then leave full screen.
   - Scrubber: the arrows step a page, and `PageUp`/`PageDown` step a chapter.
3. **Focus management:**
   - Opening `/p/[n]` focuses the page.
   - Choosing a chapter closes the menu and puts focus back on the page.
   - Closing the menu with `Esc` puts focus back on the menu button.
   - Hiding the controls while focus is inside them moves focus to the page.
   - The page has an accessible name: "Page 15, Act Two: House of Taming Currents". A polite live
     region announces the new page after each turn.

## Test list (TDD)

- [ ] The book lists the chapter pages in reading order, so the next of the last page is the end
      card and the previous of the first is nothing — unit — `src/lib/comic/reader.test.ts`
- [ ] The route guard: a chapter page is allowed, a page outside the chapters redirects to the
      first chapter page, and anything that isn't a whole number is refused — unit — `reader.test.ts`
- [ ] Every page `/p/[n]` that prerenders is exactly the book's pages — unit — `reader.test.ts`
- [ ] Neighbours to preload: the next two and the previous one, clipped at both ends of the book
      — unit — `reader.test.ts`
- [ ] Scrubber ticks: one per chapter, placed at the chapter's book position — unit — `reader.test.ts`
- [ ] The page's accessible name and `<title>` give the act and page number — unit — `reader.test.ts`

## Verification

On the preview deploy, on a real iPad in portrait, on mobile data:

- From the home page, tap "Start reading": the Prologue's cover opens filling the screen, with no
  chrome. The URL is `/p/4` (once F0's export is in; `/p/3` on the current images).
- Swipe ten pages as fast as possible: every page lands centred, and the URL and `<title>` follow.
- Pinch into a speech balloon on page 15 and pan to the right edge, then keep swiping: the page
  doesn't turn. Double-tap: it fits again. The lettering is sharp at full zoom.
- Tap the page: the controls show. Open the chapter menu and pick Act Four: its divider opens.
  The controls hide after a few seconds.
- Full screen: on, then off. The button is missing on an iPhone.
- Reload on `/p/27`: page 27 opens. Open `/p/1`: it redirects to the first chapter page.
  `/p/abc` is a 404. Press Back once from the reader: the home page, not the previous page.
- Swipe past the last Epilogue page: the end card shows the credits.

On a laptop, keyboard only:

- Tab to the page; `→` ten times turns ten pages. `End` goes to the last page, and `Home` to the
  first.
- `M` opens the chapter menu. Choose Act Three with the arrows and `Enter`: it opens, with focus on
  the page. `Esc` steps out (menu, then controls, then full screen) without losing focus.
- `+` twice, then the arrows pan without turning; `0` fits.
- With VoiceOver: each turn announces "Page N, act".

## Out of scope

- The share sheet, share cards, JPEGs (F2).
- The map landing (F3), and the form (F4) beyond a slot on the end card.
- Two-page spreads in landscape, and phone repagination (later).
- Sharing a panel, and comments.

## Open questions

- [ ] Engine: PhotoSwipe or hand-rolled? (The spike decides.)
- [ ] Does zoom need a 2400 px tier, and do the images then move to Blob?
- [ ] The scrubber label: "p15" only (one number everywhere), or "p15 · 12 of 46"?
- [ ] Landscape on the iPad: one page centred with margins for the MVP, or a two-page spread?
      (Proposed: one page.)

## Outcome

_Filled in when this goes to `done` or `abandoned`._
