---
slug: 2026-10-13_comic-reader-landing
status: active
started: 2026-10-13
finished:
issue:
---

# riverbanks.lol: landing page and comic reader replace the holding page

## Context

Call with Sam, 12 Oct 2026 ([Granola](https://notes.granola.ai/d/32fa1a89-f547-41ca-9ef2-25117bedea5f)).
People are asking Sam for the link because they want to share it and write about it. Sam flies to
Singapore on Wednesday 14 Oct and wants the site live first. Yan said it would be up "by tomorrow
night", which means 13 Oct.

What Sam asked for, for the next two weeks:

- **Landing page.** You arrive, a couple of paragraphs say what this is, give the context and say
  who Seapunk is, and then you browse the whole comic as a flipbook or scroll book.
- **One look** that essays, references and reading lists can be added to later.
- **A way to keep in touch.** Use the existing newsletter.
- **Credits** at the end of the page or in a special box, not inside the book, and simplified.
  Sam will make the web version. The old credits board is fine in the meantime.
- **A more elegant watermark.** Sam expects the site to be the main way people read the comic for
  6–12 months, so it should be discreet but look official. The current PDF has the editor's big
  diagonal "PREVIEW, NOT FOR CIRCULATION" baked into every page.
- **Swappable pages.** The cover, credits and the new prologue and epilogue covers will change
  during the week. Swapping one in must be cheap.
- **Later:** a light CMS for announcements, events and 3–5 special essays (the Southeast Asia one
  first).

The comic edits (Act One page swap, Act Four renamed *Gross Deliciousness Index*, prologue and
epilogue covers, cover) happen in a separate thread, in the generator. **This repo only takes the
exported PDF.** The source today is the generator's web edition
(`riverbanks-generator/plans/2026-10-12_web-edition-pdf.plan.md`): `Compilation Lo Res —
Riverbanks.pdf`, 47 A1 pages, 35.6 MB.

`riverbanks.lol` already serves this Vercel project (the apex redirects to `www`). The holding
plan's DNS task is done.

This puts [river-map-holding-page](2026-10-04_river-map-holding-page.plan.md) phase 2 (the map as
home) on hold. Its phase 3 idea #2, "Read the comics", is what ships now.

## Goal

At `riverbanks.lol` a phone visitor sees a short introduction, and below it can read every page
of the latest edition in order. They can jump to any chapter and zoom into a page. Pages carry a
discreet watermark, and the credits and newsletter come after the book. Replacing the edition
takes one script run on the new PDF plus, if page numbers moved, an edit to the chapter list.

## Approach

- **Pages as static images, made by a script.** `scripts/comic-pages.sh <pdf>` renders every page
  with `pdftoppm`, encodes WebP at 1600 px and 800 px wide with `cwebp`, writes them to
  `static/comic/`, and writes `src/lib/comic/pages.json` with the page count, aspect ratio and a
  short hash of the PDF. The hash goes on image URLs as `?v=`, so a new edition is never
  served stale from cache.
  - *Rejected for now: Vercel Blob.* Committed images are simpler tonight. The cost is roughly
    10–20 MB of git history per edition. Move to Blob if editions come often.
  - *Rejected: a PDF viewer (pdf.js).* A 35 MB download before page one is too heavy on a phone.
- **Chapters are data.** `src/lib/comic/edition.ts` names each chapter and the page it starts
  on, and which page is the credits board (shown in the credits box, not in the book). Pure,
  tested helpers check the list against the page count and build the table of contents. A new
  edition with moved pages means one array edit, and the tests catch a list that no longer fits.
- **Scroll book, not a page-flip.** A1 boards are portrait, like a phone, so stacking them
  vertically reads naturally and needs no gesture code. A sticky bar shows the chapter and page
  and has a chapter menu (a native `<select>`, which works well on phones and by keyboard).
  Images lazy-load, with width and height set so the layout doesn't jump. Pinch-zoom stays on;
  tapping a page opens the 1600 px image on its own for close reading.
  - *Rejected for tonight: a two-page flipbook spread.* That suits desktop only and costs a
    day. It can be added later as a desktop view over the same data.
- **Watermark as an overlay, not baked in.** A narrow strip along one edge of each page, small
  type in Rubik: `RIVERBANKS · PREVIEW EDITION · © 2026 SEAPUNK STUDIOS · RIVERBANKS.LOL`.
  Restyling it is a CSS change, with no re-render, while Sam decides the look. An overlay doesn't
  follow a saved image, so if that matters, the script can bake the same strip in with
  ImageMagick later. **The PDF should be exported with the editor's watermark off.**
- **Intro copy is a draft** from the canon's title card and frame, for Sam to replace.
- **Newsletter:** a link or embed for the existing newsletter. The provider and URL are needed
  from Yan.
- **Light CMS: not tonight.** When needed, essays become Markdown files under
  `src/content/essays/` rendered at `/essays/[slug]` (prerendered, edited in git or the GitHub web
  editor). That avoids a hosted CMS until someone other than Yan needs to edit them.

## Tasks

- [x] `scripts/comic-pages.sh` and `pages.json`; run on the current web edition
- [x] `edition.ts` chapters and helpers, test first
- [x] Home page: intro, sticky chapter bar, scroll reader, watermark overlay, credits box,
      newsletter, footer band; holding page and Taro retired from `/` (Taro kept in the repo)
- [x] Meta and share card updated (no longer "under construction")
- [ ] Deploy; check on a phone (see Verification)
- [ ] Swap in the edited PDF from the comics thread, update chapter starts, redeploy
- [ ] Newsletter link once the provider/URL is known
- [ ] Sam's intro copy and web credits when they arrive

## UI mockups (ASCII)

Phone:

```
┌──────────────────────────┐
│ RIVERBANKS               │  ← Rubik Microbe
│ A climate fiction comic  │
│ about ecoarchic          │
│ institutions             │
│                          │
│ Two or three short       │
│ paragraphs: what this    │
│ is, context, Seapunk.    │
│                          │
│ [ Start reading ↓ ]      │
├──────────────────────────┤  ← sticky once scrolled to
│ [Act Two: Taming…  ▾] 12/46│
├──────────────────────────┤
│ ┌──────────────────────┐ │
│ │                      ││ │ ← watermark strip on the
│ │    page image        ││ │   right edge, small type
│ │                      ││ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │   next page …        │ │
├──────────────────────────┤
│ CREDITS (box; board for  │
│ now, Sam's web version   │
│ later)                   │
├──────────────────────────┤
│ Keep in touch            │
│ [ Subscribe to the       │
│   newsletter → ]         │
├──────────────────────────┤
│ RIVERBANKS.LOL  SEAPUNK  │  ← existing footer band
└──────────────────────────┘
```

Desktop: the same column, with pages at most about 900 px wide and centred, the intro at a
readable measure, and the chapter bar the full width.

States: an image that fails to load leaves its sized, paper-coloured box with the page number,
so the flow and the counter don't break.

## Keyboard interaction

1. **Tab order:** "Start reading", then the chapter menu, then each page link (opens the full
   image), then the credits, the newsletter link and the footer links.
2. **Shortcuts:** none beyond the browser's own (Space/Page Down scroll the book).
3. **Focus:** choosing a chapter scrolls to its first page and moves focus to that page's link.
   "Start reading" moves focus to page 1.

## Test list (TDD)

- [x] `contents`: each page is listed once, in order, with its chapter — unit — `src/lib/comic/edition.test.ts`
- [x] the credits page is left out of the book — unit — same file
- [x] pages before the first chapter belong to a front-matter group — unit
- [x] chapters out of order, starting past the end, or on the credits page are refused — unit
- [x] `chapterAt(page)` gives the chapter of any page, including the last — unit
- [x] `pageSrc` puts the edition hash on the URL and zero-pads the number — unit

## Verification

- `https://riverbanks.lol` on a phone on mobile data: the intro is the first thing seen, and
  "Start reading" lands on page 1.
- Scroll through. The counter tracks the page, and no layout jump happens as images load.
- Choose Act Five in the menu: the page jumps to its divider, and the counter says Act Five.
- Pinch-zoom works. Tapping a page opens the full image.
- Every page shows the watermark strip, and it doesn't cover speech balloons on the sample pages
  (1, 5, 20, 46).
- Keyboard on desktop: Tab reaches the chapter menu. Choosing a chapter moves focus to its first
  page.
- The share card pasted into LINE or WhatsApp no longer says "under construction".

## Out of scope

- Comic edits (the generator thread).
- Two-page flipbook, map home, essays/CMS, Thai.
- Baking the watermark into images (unless Sam asks).

## Open questions

- [ ] Newsletter: which provider, and the signup URL or embed code?
- [ ] Intro copy: Sam's, or does the draft stand?
- [ ] Watermark wording and look: does Sam approve the edge strip?

## Outcome

_Filled in when this goes to `done` or `abandoned`._
