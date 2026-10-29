---
slug: 2026-10-29_premiere-edition-refresh
status: active
started: 2026-10-29
finished:
issue:
---

# F0: swap in the clean Premiere Edition

## Context

Feature F0 of the [MVP roadmap](2026-10-29_mvp-roadmap.plan.md). The reader still shows the
12 Oct web edition (`Compilation Lo Res — Riverbanks.pdf`, 47 A1 pages, version `791b5ea2c1`).
Checking it on 29 Oct turned up:

- **Every page carries the editor's diagonal "PREVIEW – NOT FOR CIRCULATION"**, posters and
  credits included. It was exported with the generator's watermark on
  (`riverbanks-generator/plans/2026-10-12_export-watermark.plan.md`; since 13 Oct the
  watermark is set in the export's download modal).
- **Act Four's name doesn't match.** The divider in the 12 Oct PDF (page 24) reads *THE YEAR IT
  SNOWED*, while `src/lib/comic/edition.ts` calls it *Gross Deliciousness Index*. Settled
  below: the comic itself has since been changed to *Gross Deliciousness Index*.
- **The site's own overlay is wrong for this edition.** The strip on every page says
  `PREVIEW EDITION · © 2026 SEAPUNK STUDIOS`. This is the *Premiere* Edition, and Sam's intro
  gives the licence as **CC BY-NC**, not all rights reserved.
- **The page footer band** reads `RIVERBANKS · riverbanks.lol · SEAPUNK STUDIOS`. Sam wants
  `Riverbanks Volume I · BKKCAW26 Premiere Edition · p15 (Screen)` (21 Oct call). The generator
  can already draw it: footer bands take `{page}`, and since `cc312dd` the centre slot can hold
  two lines.

Sam is doing a typo-only pass in the generator (21 Oct: "export as-is once clean"). Sam's intro
names the web release *Riverbanks Volume 1: The Great Pluriversalization*.

**The compilation comic now (read over the `riverbanks` MCP, 29 Oct).** *Compilation Lo Res*
(`e3368ea0`, rev 298) was last edited 13 Oct, after the PDF export, and has **52 pages**, not 47:

| Page | What | Bands |
|---|---|---|
| 1 | New cover: full-page image. Its hidden header reads *Volume One: The Great Pluriversalization* | hidden |
| 2 | Full-page image | hidden |
| 3 | Blank, on purpose (Yan, 29 Oct) | hidden |
| 4 | Prologue cover: full-page image | hidden |
| 5 | Prologue | footer |
| 6–10 | Act One (divider on 6) | footer |
| 11–18 | Act Two: House of Taming Currents (divider on 11) | footer |
| 19–25 | Act Three: Kinetic Adaptation Economy (divider on 19) | footer |
| 26–32 | **Act Four: Gross Deliciousness Index** (the divider on 26 and every header say so) | footer |
| 33–42 | Act Five: A Visa for a Hilsa (divider on 33) | footer |
| 43 | Epilogue cover: full-page image | hidden |
| 44–49 | Epilogue: River of Seeds | footer |
| 50 | Credits: full-page image | hidden |
| 51–52 | The two exhibition posters, moved to the end | footer (no page number) |

So the Act Four question is settled in the comic: **Gross Deliciousness Index**, and the 12 Oct
PDF is simply out of date. Content pages still have the old footer
(`{page}` / `riverbanks.lol`). No edit since 13 Oct means Sam's typo pass hasn't landed in
this comic yet.

**What this changes here:** the reader shows **only the chapters** (Yan, 29 Oct). The cover,
page 2, the blank page 3 and the posters stay in the PDF. `Edition` gains `last`, the
Epilogue's final page, and `contents()` drops the old "Cover" group and anything after `last`.
The posters after the credits no longer need modelling. The Prologue starts on its cover (4)
and the Epilogue on its cover (43).

## Goal

`static/comic/` and `pages.json` come from a clean Premiere Edition export: no PREVIEW watermark,
Sam's typo fixes, and the agreed footer. `edition.ts` names each act as its divider does and
starts it on the right page, and the tests pass. The site's overlay and meta say Premiere
Edition and CC BY-NC. The site preview deploy shows all of this, and production follows with F1
(or earlier, if Sam wants the clean scroll reader up first).

## Approach

- **The footer goes into the pages, not the site.** The footer is set in the generator's
  compilation comic (`e3368ea0`), and the PDF carries it. It then also appears in downloads,
  screenshots and the share images F2 makes. That makes it the "discreet but official" mark Sam
  asked for on 12 Oct.
  - The site's overlay strip then goes. Two marks on one page is clutter, and the band already
    names the edition, the site and Seapunk.
  - F1 drops the footer from its scope and shows only a page counter in its controls.
  - *Rejected: a footer drawn by the site.* It would be missing from the PDF and from saved
    images, and it would need restyling in two places.
  - The proposed band text:

    ```
    RIVERBANKS VOLUME I      BKKCAW26 PREMIERE EDITION      SEAPUNK STUDIOS · CC BY-NC
                             p{page} (Screen)
    ```

    The edges keep the current bold. The centre is Rubik Light, per Sam ("lighter weights for
    the footer").
  - The band couldn't draw a lighter weight: the whole footer was stroked Rubik Pixels. Generator
    `219b51e` sets the centre in Rubik 300.
- **Page numbers:** `{page}` in the compilation counts the posters, so the first comic page is
  p3. That matches the reader's `/p/N` (F2), which uses the PDF page number. Sam's example
  ("p15") doesn't say which way they count. Keep PDF numbering: one number everywhere.
- **The export itself is Yan's, in the generator:** download modal → PDF, watermark **off**,
  then `scripts/comic-pages.sh "<pdf>"` here. The script already replaces the whole edition and
  writes a new `version` hash, so nothing is served stale.
- **Git weight:** about 25 MB of WebP per edition goes into history. That is acceptable for one
  more edition. If a third edition comes, move the pages to Vercel Blob (rejected in the 13 Oct
  plan for speed).
- **Chapter data:** update `edition.ts` titles and `first` pages from a contact sheet of the new
  export. The existing tests refuse a chapter list that doesn't fit the page count.

## Tasks

- [x] Act Four's title: *Gross Deliciousness Index*, per the comic (checked over MCP, 29 Oct)
- [x] Pages 2 and 3: not in the reader, so nothing to confirm (page 3 is blank on purpose)
- [ ] Sam finishes the typo pass in the generator
- [x] Footer band set on the compilation comic over MCP (29 Oct, rev 299–345): the comic's
      default, plus the per-page overrides on 5–42 and 44–49. The posters (51–52) get it without
      a page number. Headers and hidden bands were left as they were (the footers on 9, 51 and 52 stay off)
- [x] Generator `219b51e`: footer centre in Rubik Light, no stroke (not pushed yet)
- [ ] Push the generator so production draws the light centre; check the footer in the editor on
      a dark page and a light one
- [ ] Yan exports the PDF with the watermark off and puts it in `~/Downloads`
- [ ] Run `scripts/comic-pages.sh` on it; contact sheet of every page; commit the images and
      `pages.json`
- [x] `Edition` shows only the chapters: `last` ends the book, no Cover group, posters and
      front pages left out (tests first; "Start reading" goes to the Prologue)
- [ ] `edition.ts`: act starts from the contact sheet (Prologue 4, One 6, Two 11, Three 19,
      Four 26, Five 33, Epilogue 43, `last` 49, credits 50, if the export matches the
      comic); tests green
- [x] Remove the overlay strip from `ComicReader.svelte`. The meta description says Premiere
      Edition. A licence line above the site footer: `Riverbanks Volume I · BKKCAW26 Premiere
      Edition · CC BY-NC, Seapunk Studios & collaborators 2026 · seapunk.asia`. Act Four stays
      *Gross Deliciousness Index*, as in the comic.
- [ ] Preview deploy; run Verification; send Sam the preview link

## UI mockups (ASCII)

Bottom of a page, before and after:

```
before:  │ RIVERBANKS            riverbanks.lol            SEAPUNK STUDIOS │  + PREVIEW diagonal
                                                                         │▌ strip on the right edge
after:   │ RIVERBANKS VOLUME I   BKKCAW26 PREMIERE EDITION   SEAPUNK STUDIOS · CC BY-NC │
         │                       p15 (Screen)                                         │
```

No diagonal and no edge strip.

## Test list (TDD)

The logic here is the chapter list, which the tests in `src/lib/comic/edition.test.ts` already
cover: the chapters fit the page count, are in order and avoid the credits page.

- [x] Add: the chapter titles are those of the refreshed edition (one assertion on the act
      list, so an accidental revert to the old names fails) — unit — `edition.test.ts`
- [x] Only chapter pages are listed: nothing before the first chapter or after `last` — unit
- [x] Refuses a `last` past the edition, and a credits page inside the chapters — unit

## Verification

On the preview deploy, on an iPad and on a phone:

- The reader opens on the Prologue's cover, and ends on the Epilogue's last page.
- Pages 5, 15, 26, 33 and 49 show no PREVIEW diagonal and no edge strip.
- Page 15's footer reads `RIVERBANKS VOLUME I · BKKCAW26 PREMIERE EDITION · p15 (Screen)`, and is
  legible but quieter than the art.
- Choose Act Four in the menu: it lands on its divider, and the menu's name matches the divider.
- Choose every other act: each lands on its divider.
- The image URLs carry the new `?v=` hash (DevTools, Network tab, or view source).
- Sam reads a few pages and finds no typos left.

## Out of scope

- Any comic edit beyond typos. The footer band and the export happen in the generator, outside this repo.
- Share-size JPEGs (F2).
- Moving the page images to Blob.

## Open questions

- [x] Act Four: *Gross Deliciousness Index* (the comic, 29 Oct)
- [x] Pages 2 and 3, and the posters: only the chapters go in the reader (Yan, 29 Oct)
- [x] Footer in the pages or drawn by the site? **In the pages** (Yan, 29 Oct). The edge strip
      is gone from the site, and F1 draws no footer.
- [ ] Page numbers: count the posters (PDF numbering, recommended) or start at the prologue?
- [ ] Ship the clean scroll reader to production now, or wait for F1?

## Outcome

_Filled in when this goes to `done` or `abandoned`._
