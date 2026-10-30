---
slug: 2026-10-30_share-links
status: active
started: 2026-10-30
finished:
issue:
---

# F2: share a page

## Context

F1 ([page reader](2026-10-29_page-reader.plan.md)) gives every page its own URL, `/p/N`, kept in
step as you turn. Nothing yet helps anyone send one:

- Pasting `/p/15` into WhatsApp or LINE shows nothing useful. The prerendered `/p/N` pages have no
  Open Graph tags, and only the home page has a card (`static/og.jpg`, 1200×630).
- The page images are WebP (`static/comic/NN-1600.webp`, `NN-800.webp`). Saving one works on an
  iPad, but WhatsApp and LINE handle WebP badly when it is sent as a photo ([MVP
  roadmap](2026-10-29_mvp-roadmap.plan.md), F2 row).
- The reader's top bar has Back, the chapter menu and Full screen. There is no share control.
- The origin for absolute URLs comes from `src/routes/+page.server.ts`
  (`VERCEL_PROJECT_PRODUCTION_URL`, else `https://riverbanks.lol`). Only the home page loads it.

Sam's ask, from the roadmap: "press on something and share this bit". Sharing one panel is
after the MVP. Sharing a page is the MVP.

## Goal

Sending `riverbanks.lol/p/26` in WhatsApp or LINE shows a card with that page on it and the
act's name. In the reader, one tap on Share opens the device's share sheet with the page's link.
Where there is no share sheet, a small menu offers Copy link and Save page. Save page gives a
JPEG that goes into Photos and sends cleanly as a photo.

## Approach

**Per-page cards are made by the page script, not at request time.** `comic-pages.sh` already
renders every page; it also writes:

- `NN.jpg`: the page at 1200 px wide, JPEG q82 (about 250 KB). This is the file Save page and
  the share sheet's image use.
- `NN-card.jpg`: 1200×630. The page at full card height, centred, on a blurred and darkened
  crop of itself. No text, so no font to install. The page's own footer ("p26") and, on
  dividers, the act title are already on it. The words go in `og:title` and
  `og:description`, which WhatsApp and LINE print under the card.

Rejected: a Vercel OG function (`@vercel/og`). It works, but the site is fully prerendered with no
functions, and 52 static files cost nothing. Also rejected: the page itself as `og:image`. A
portrait image gets cropped to a square or a strip in most apps, and you lose the page.

**Share button: native first.** `navigator.share({ title, text, url })` where it exists (iPad
Safari, phones). Otherwise, or if it throws anything but `AbortError`, a menu opens with
"Copy link" and "Save page". The menu is a popover below the button, not a modal.

"Save page" is a plain `<a href="/comic/NN.jpg" download="riverbanks-p26.jpg">`. On iOS,
`download` opens the image, and a long press saves it. That is good enough, so I didn't share
files through `navigator.share({ files })`, which drops the URL on some targets.

**Meta per page.** `/p/[n]` gets `og:title` "Riverbanks · Act Four: Gross Deliciousness Index",
`og:description` "Page 26 of Riverbanks Volume I, a climate fiction comic by Seapunk Studios. Read
it free online.", `og:image` the card, `og:url` the canonical `/p/26`, and
`twitter:card summary_large_image`. The origin moves from `+page.server.ts` to
`+layout.server.ts` so both routes have it.

**What gets shared is the page you are on**, not the page you opened: the button reads the
reader's current page. The end card shares the home page.

## Tasks

- [ ] `share.ts`: the share text, the canonical URL and the meta for a page, with tests first
- [ ] Origin into `+layout.server.ts`; `/p/[n]` head gets the Open Graph and Twitter tags
- [ ] `comic-pages.sh` writes `NN.jpg` and `NN-card.jpg`; rerun it on the 30 Oct export
- [ ] Share button in the reader's top bar: share sheet, else the Copy link / Save page menu
- [ ] `S` key opens Share; "Share Riverbanks" on the end card
- [ ] Preview deploy; Verification on an iPad, in WhatsApp and LINE

## UI mockups (ASCII)

Reader top bar, controls shown:

```
┌──────────────────────────────────────────────────────────────┐
│ ←   [ Act Four: Gross Deliciousness Index ▾ ]        ⇪   ⛶   │
└──────────────────────────────────────────────────────────────┘
                                                  ▲ Share
```

No share sheet (desktop Firefox, older Chrome): the menu opens under Share.

```
                                       ┌────────────────────┐
                                       │ Copy link          │
                                       │ Save page (JPEG)   │
                                       └────────────────────┘
After Copy link:                       ┌────────────────────┐
                                       │ ✓ Link copied      │
                                       │ Save page (JPEG)   │
                                       └────────────────────┘
```

The card (1200×630), as WhatsApp shows it:

```
┌──────────────────────────────────────────────┐
│░░░░░░░░░░░░░░░░┌────────────┐░░░░░░░░░░░░░░░░│
│░░ blurred,  ░░░│            │░░░ the same ░░░│
│░░ darkened  ░░░│  page 26   │░░░ page     ░░░│
│░░ crop of   ░░░│  (445×630) │░░░          ░░░│
│░░ the page  ░░░│     p26    │░░░          ░░░│
│░░░░░░░░░░░░░░░░└────────────┘░░░░░░░░░░░░░░░░│
└──────────────────────────────────────────────┘
 Riverbanks · Act Four: Gross Deliciousness Index
 Page 26 of Riverbanks Volume I, a climate fiction…
 riverbanks.lol
```

End card: under "← Back to Riverbanks", a second link "Share Riverbanks ⇪".

## Keyboard interaction

1. **Tab order** in the top bar: Back, chapter menu, Share, Full screen. In the menu: Copy link,
   Save page.
2. **Shortcuts:**
   - `S` opens Share, the same as clicking it; ignored while focus is in the chapter menu or
     the scrubber.
   - In the menu, ↑/↓ move between the two items, Enter or Space activates, and Esc closes it.
3. **Focus:**
   - Opening the menu focuses Copy link.
   - Esc or a click outside closes the menu and returns focus to Share.
   - After Copy link, focus stays on the item, which reads "Link copied".
   - After the native sheet closes, focus returns to Share.
   - While the menu is open, controls don't auto-hide (focus is inside them, as now).

## Test list (TDD)

- [ ] `pageUrl(origin, 26)` is `https://riverbanks.lol/p/26`, with no trailing slash — unit — `src/lib/comic/share.test.ts`
- [ ] `shareFor(EDITION-like fixture, page)` gives the title "Riverbanks · <act>" and the text "Page N of Riverbanks Volume I…" — unit — `share.test.ts`
- [ ] the meta for a page points `og:image` at `/comic/NN-card.jpg` with the edition version, at 1200×630 — unit — `share.test.ts`
- [ ] `saveName(26)` is `riverbanks-p26.jpg` — unit — `share.test.ts`
- [ ] `pageSrc` with the `jpg` and `card` variants: two-digit numbers, version query — unit — `src/lib/comic/edition.test.ts`
- [ ] `shareMode(nav)` is `'native'` when `navigator.share` exists, else `'menu'` — unit — `share.test.ts`

## Verification

On the preview, after the deploy:

1. Paste `<preview>/p/26` into the WhatsApp and LINE chats. The card shows page 26 centred on its
   blurred background, titled "Riverbanks · Act Four: Gross Deliciousness Index". (Preview
   deploys sit behind Vercel's login, so for this step use the production domain once F2 is
   merged, or a protection-bypass link.)
2. Desktop Chrome: open `/p/15`, press `S`.
   - Chrome's share sheet opens, or the menu does.
   - In the menu, ↓ then Enter on Save page downloads `riverbanks-p15.jpg`.
   - Copy link puts `…/p/15` on the clipboard, and the item reads "Link copied".
   - Esc closes the menu and focus returns to Share.
3. Turn to page 20 and share again: the link is `/p/20`, not `/p/15`.
4. iPad Safari: tap Share and the share sheet opens with the link. Save page opens the JPEG, and a
   long press then Save to Photos puts it in Photos. Send that photo in WhatsApp: it arrives sharp.
5. End card: "Share Riverbanks" shares the home page.

## Out of scope

- Sharing one panel: circle it and comment (after the MVP).
- Share counts and analytics.
- Cards for the cast page (F5 will have its own).
- A card with text set in the site's fonts. Revisit only if the plain card reads badly in a chat.

## Open questions

- [ ] Card style: the page on its own blurred background (recommended, no text) or a split card
      with the act title set beside the page? Decide on seeing it in WhatsApp.
- [ ] Does the home page keep `og.jpg`, or use the cover page's card?

## Outcome

_Filled in when this goes to `done` or `abandoned`._
