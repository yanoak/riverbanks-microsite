---
slug: 2026-10-29_mvp-roadmap
status: active
started: 2026-10-29
finished:
issue:
---

# riverbanks.lol MVP roadmap: read, share, get involved

## Context

Call with Sam, 21 Oct 2026 ([Granola](https://notes.granola.ai/d/bd194dfb-500f-4de6-ad43-f5b63a7b4489)).
Sam gets asked almost every day for something to read and share. The site should do four jobs:

1. **101.** Someone sent the link with no context understands what this is within two sentences.
2. **Reading.** A 30–60 minute armchair read, optimised for an iPad held upright. One page at a
   time, swipe to turn, pinch to zoom, and nothing else on screen.
3. **Sharing.** Links to a specific page (`riverbanks.lol/p/15`), shared with one tap. A link to
   a single panel, with a comment, comes later.
4. **Engagement.** A form that turns "I loved it" into a structured lead: translating, exhibiting,
   publishing, collaborating, hosting a talk or workshop, teaching.

Yan wants to keep the Sunken Continent map as the visual anchor, with chapters as glowing
markers, and proposed a shareable cast page. Sam is fine with both as long as reading stays
immersive.

The edition is called the **Premiere Edition**. Only typo-level edits are allowed, and the remaster
comes next year. Footer: `Riverbanks Volume I · BKKCAW26 Premiere Edition · p15 (Screen)`.
Fonts: Rubik family only, with lighter weights for the footer and credits.

What exists: [comic-reader-landing](2026-10-13_comic-reader-landing.plan.md) built a scroll
reader, the page-image script and the chapter data, deployed to a preview from branch
`comic-reader` but not to production. The page images, `edition.ts` and its tests carry over. The
scroll-book view is replaced by F1. Close that plan as superseded once F1 starts.

Mockups for every feature: [Riverbanks MVP mockups](https://claude.ai/artifact/5N9u5BM2rdNbbjKcEDRKor)
(nine boards: iPad landing, reader ×3, share, cast, form, phone landing and reader). Sam's intro
copy (29 Oct) is in [`src/content/intro.md`](../src/content/intro.md).

**Dates.** Sam is at MozFest in Barcelona (27–30 Oct), then in London. The launch to aim at is
the May Palang Foundation exhibition opening in Bangkok in mid-November, around Solidarity AI.
Sam is confirming the date with May Palang. Yan is in London from about 16 Nov. Sam's intro
promises "November 2026".

## Goal

Before the mid-November launch, `riverbanks.lol` on an iPad shows the map and Sam's intro, opens
the Premiere Edition one page at a time with zoom, gives every page a link that can be shared,
and ends in a get-involved form whose answers land in a Google Sheet. A cast page sits beside it.
Each feature below has its own plan, and this roadmap is done when they are all `done` and
production is serving them.

## Approach

Ship in the order that unblocks Sam soonest. Reading and sharing go first, because that is what
people ask for. The form and the cast follow, then the launch polish. Each feature is
deployable on its own, so production can move forward feature by feature rather than in one
big bang.

### Phase 1: read and share (proposed target, not yet agreed with Sam: live by Mon 2 Nov)

| # | Feature | Plan (to write) | Depends on | Notes |
|---|---|---|---|---|
| F0 | **Premiere Edition refresh**: re-export without the PREVIEW watermark, run `scripts/comic-pages.sh`, check chapter starts, title *Volume 1: The Great Pluriversalization* | [`2026-10-29_premiere-edition-refresh`](2026-10-29_premiere-edition-refresh.plan.md) | Sam's typo pass and export | The live page images still carry "PREVIEW – NOT FOR CIRCULATION". The footer goes into the pages (decided 29 Oct) |
| F1 | **Page reader**: one page at a time, swipe with a clean snap, pinch-zoom that pans instead of turning, tap to show the controls (chapter menu, scrubber, share, full screen), keyboard arrows. No footer: it is in the pages (F0) | `2026-10-29_page-reader` | none (uses current images until F0) | The biggest piece. Choose between native scroll-snap plus browser zoom and a gallery library (PhotoSwipe-style) by prototyping on a real iPad |
| F2 | **Page links and sharing**: `/p/[n]` routes, URL kept in sync with the reader, share sheet (copy, Web Share API, save image), per-page share card | `2026-10-29_share-links` | F1 | Share cards need JPEG: WhatsApp and LINE handle WebP badly. Add a JPEG output to the page script |
| F3 | **Landing**: Sam's intro, the map with glowing act markers that open the reader at that act, Start reading / Meet the cast / Get involved, footer with the CC BY-NC line | `2026-10-29_landing-map` | F1 (marker targets), Yan placing the markers on the map | The intro is six paragraphs: the first two above the fold, the rest below. "Released in November" needs rewording once live |

### Phase 2: engage (target: before the May Palang launch, mid-November, date not yet confirmed)

| # | Feature | Plan (to write) | Depends on | Notes |
|---|---|---|---|---|
| F4 | **Get-involved form**: Typeform-style steps (interests as checkbox tiles, about you and your community, contact), Taro and the cast around it, submits to a Google Form, so answers land in a Sheet | `2026-11-xx_engagement-form` | Sam's questions; the Google Form and its entry IDs | Post to the form's `formResponse` endpoint (no-cors) so Sam owns the data in Google. Reached from the landing page, the end of the book and the intro's "here" link |
| F5 | **Cast page**: `/cast`, one sentence and a portrait per character, shareable as a whole and per character (`/cast#taro`) | `2026-11-xx_cast-page` | Portraits exported from the generator's `network-portraits` bucket; Sam approving the one-liners | Draft one-liners from `riverbook.json` are on the mockup canvas |

### Phase 3: launch polish (alongside phase 2)

- End of the book: credits (Sam's web version, or the board in the meantime), CC BY-NC, and the
  form call to action.
- Phone pass: the same reader at 390 px, with a "best on a tablet" hint. No repagination.
- Production deploy from `main`, the share card checked in LINE and WhatsApp, and a final iPad
  walkthrough with Sam.

### Later (after the MVP, not planned yet)

- Share one panel: circle it and add a comment (Sam's "press on something and share this bit").
- Voice notes in the form ("record a rant"). This needs storage and moderation.
- Phone repagination: half-column layouts from the generator (Sam's "week 2").
- Essays, references and reading lists as Markdown in `src/content/essays/`, and the newsletter.
- The fuller map: a diorama per location with director's-commentary extras.
- Translations, starting with whatever the form says people ask for.
- A downloadable PDF or EPUB.

## Tasks

<!-- Each feature's own plan carries its commits. Tick a feature here when its plan is `done`
     and it is live in production. -->

- [x] Roadmap and mockups
- [x] Sam's intro copy into the repo (`src/content/intro.md`)
- [ ] F0 Premiere Edition refresh (waits for Sam's export)
- [ ] F1 Page reader
- [ ] F2 Page links and sharing
- [ ] F3 Landing with the map and intro
- [ ] Production deploy of phase 1
- [ ] F4 Get-involved form
- [ ] F5 Cast page
- [ ] Phase 3 launch polish and production deploy
- [ ] Close [comic-reader-landing](2026-10-13_comic-reader-landing.plan.md) as superseded

## UI mockups

Delegated to the [mockup canvas](https://claude.ai/artifact/5N9u5BM2rdNbbjKcEDRKor). Each feature
plan copies its boards into ASCII mockups, as the plan convention requires.

## Keyboard interaction and Test list

Each feature plan has its own. The roadmap adds no behaviour of its own.

## Verification

When every feature is done, on a real iPad in portrait, on mobile data:

- Open `riverbanks.lol`: the map and the first two paragraphs of the intro show without scrolling.
- Tap the Act Two marker: the reader opens on Act Two's divider, and the URL reads `/p/9` (or
  wherever Act Two starts in the refreshed edition).
- Swipe ten pages quickly: every page lands centred. Pinch into a speech balloon and pan to the
  edge: the page does not turn.
- Share page 15 to WhatsApp: the preview shows page 15, and opening the link lands on page 15.
- Finish the book: the credits and the form follow. Submit the form: a row appears in Sam's Sheet.
- Open `/cast` and share one character: the link opens on that character.
- No page shows the PREVIEW watermark.

## Out of scope

Everything under "Later". Comic edits beyond typos, which happen in the generator thread.

## Open questions

- [ ] May Palang launch date (Sam is confirming): it sets the phase 2 deadline.
- [ ] When will Sam's typo pass and watermark-free export land?
- [ ] Where does the intro's "here" link go? Presumably F4's form.
- [ ] Form questions and the Google Form (Sam).
- [x] The reader shows only the chapters. Posters and front pages stay in the PDF, and the credits
      board follows the book (Yan, 29 Oct)

## Outcome

_Filled in when this goes to `done` or `abandoned`._
