---
slug: 2026-10-30_engagement-form
status: active
started: 2026-10-30
finished:
issue:
---

# F4: get involved, our form in front of a Google Form

## Context

- The [MVP roadmap](2026-10-29_mvp-roadmap.plan.md) has F4 as a Typeform-style form: interests as
  checkbox tiles, then about you and your community, then contact. It posts to a Google Form, so
  the answers land in Google, where Sam owns them.
- The mockup is board 7 on the [MVP mockups](https://claude.ai/artifact/5N9u5BM2rdNbbjKcEDRKor)
  canvas:
  - "1 of 3" with a progress bar;
  - "What would you like to do with Riverbanks?" over six checkbox tiles, the ticked ones in
    signal yellow;
  - Taro in a circle with a speech bubble ("Pick one. Or all.");
  - a voice-note box;
  - Next.
- The Google Form Yan gave (`1AqFVEIAn5_O9fR2rbb1NxDUb5qGxeyAZpglE0EdwECY`) was an empty,
  unpublished draft: "Untitled form", one placeholder question. Its link answered 401, so the
  site's Get involved button (`GET_INVOLVED_URL`, the `/viewform` link) was broken for the public.
- The `gws` CLI reads and writes it through the Forms API. A question's `questionId` in hex is
  its `entry.<decimal>` field name on the form's `formResponse` endpoint.

## Goal

`/get-involved` asks three short steps in the site's own design and sends the answers to the Google
Form, where they're visible to Sam in Responses. The site's Get involved buttons lead there.

## Approach

**The form's questions** (Yan, 30 Oct: the proposed set; Sam can reword them later without
changing the field IDs):

| Step | Question | Kind |
|---|---|---|
| 1 | What would you like to do with Riverbanks? Translate it into my language · Exhibit it for my community · Host a talk or workshop · Publish or print it · Teach with it · Collaborate on what comes next · Other | checkboxes, with Other |
| 2 | Your name · Where are you based? · Your community or organisation · Which language? (only if Translate is ticked) · Anything you'd like to tell us? | short answers, one paragraph |
| 3 | Your email · Keep me posted about Riverbanks | short answer, one checkbox |

- **Setting up the form** (Yan said yes to editing and publishing it):
  - Retitle it "Riverbanks: get involved".
  - Replace the placeholder with these questions, none required in Google.
  - Publish it to anyone with the link, accepting responses.
  - Done once with `gws forms forms batchUpdate` and `setPublishSettings`; the requests are kept
    in `scripts/get-involved-form.json`.
  - The front end checks what's required: at least one interest, or a message; and an email.
- **Sending:**
  - A `fetch` POST of the answers as form fields to the form's
    `…/d/e/<responder id>/formResponse`, with `mode: 'no-cors'`.
  - The response is opaque, so the page can't tell success from failure. It shows thanks once
    the request resolves, and an error (with a link to the Google Form itself) only if the
    request throws.
  - "Other" goes as `__other_option__`, with the text in `entry.N.other_option_response`.
  - Rejected: a serverless function in between. The site is fully static, and Google's endpoint
    takes a plain cross-origin POST.
- **Field IDs as data:** `src/lib/form/fields.ts` holds the responder URL and each question's
  entry id. A pure `encode(answers)` turns the answers into `URLSearchParams`, so the mapping is
  tested.
- **Page `/get-involved`** follows board 7, one step at a time:
  - Steps 1–3, each with its question as the `h1`, a progress line ("1 of 3"), Back and Next.
  - Taro with a speech bubble changes line per step, and grows up as the form goes on (Yan,
    30 Oct): the kitten, then the cat, then the beaing for step 3 and the thank-you. The three
    are the style profile's Taro sheets, cropped by `scripts/cast-portraits.sh`.
  - Then a thank-you with Start reading and Meet the cast.
  - Answers survive Back and Forward within the page. Nothing is stored after sending.
  - The voice-note box is left out: voice notes need storage and moderation (roadmap, "Later").
- **Links:**
  - `GET_INVOLVED_URL` becomes `/get-involved`, so the header, panel and menu buttons stop
    opening a new tab.
  - The intro's "reach out … here" link goes there too.
- **Analytics:** `generate_lead` (GA's recommended event) on sending, with the interests ticked.
  Nothing personal goes to GA.

## Tasks

- [x] Set up the Google Form (questions, title, publish) and record the field ids
      30 Oct: the eight questions added and the placeholder removed. The form is published,
      accepting responses, and its public page now answers 200. All eight entry ids read
      from that page match the decimal of the API's hex question ids.
- [x] `fields.ts` and `encode()`, tests first
- [x] `/get-involved`: three steps, Taro, progress, validation, thank-you
- [x] Get involved links point at `/get-involved`
- [ ] Preview deploy; Verification: a test response arrives in the form, and is deleted after
      Desktop Chrome, 30 Oct, steps 1–4 up to Send:
      - The empty check works, with focus on the first tile.
      - Translate shows the language question.
      - Back keeps the ticks, and Next keeps the text.
      - A bad email gets an error, `aria-invalid` and focus.
      - At 390 wide: one column, no sideways scroll. No console errors.
      Not yet done: Send, which submits a real response (waiting on Yan's OK).

## UI mockups (ASCII)

Step 1 (board 7, without the voice note):

```
┌──────────────────────────────────────────────────────────┐
│ RIVERBANKS               Chapters Cast Credits (…) (…)   │
├──────────────────────────────────────────────────────────┤
│ GET INVOLVED                          1 of 3  ▰▱▱         │
│ What would you like to do                ╭──────────────╮ │
│ with Riverbanks?                         │ Pick one.    │ │
│ Tick as many as you like.                │ Or all.      │ │
│                                          ╰──────(Taro)──╯ │
│ ┌────────────────────────┐ ┌────────────────────────┐     │
│ │ ☑ Translate it into my │ │ ☐ Exhibit it for my    │     │
│ │   language        (yel)│ │   community            │     │
│ └────────────────────────┘ └────────────────────────┘     │
│ … six tiles, then "Something else: [________]"            │
│                                                           │
│ Next: about you and your community        ( Next → )      │
└──────────────────────────────────────────────────────────┘
```

Step 2: labelled text fields, one per row; Which language? appears under Translate's answer.
Step 3: Email, the Keep me posted tile, then Send. Thank-you: "Thank you" with Taro, Start
reading and Meet the cast.

Phone: one column of tiles, Taro smaller above the question, Next full width.

## Keyboard interaction

1. **Tab order:** the header, then the step's fields in order, then Back and Next (or Send).
2. **Shortcuts:** Enter in a text field goes to the next step (Send on the last), except in the
   message box, where Enter is a new line. Space toggles a focused tile, as checkboxes do.
3. **Focus:**
   - Each new step focuses its heading (`tabindex="-1"`), so a screen reader reads the
     question.
   - A validation error focuses the first field in error, with its message tied in by
     `aria-describedby`.
   - The thank-you focuses its heading.

## Test list (TDD)

- [x] `encode()` puts each ticked interest under the interests entry, one value each — unit — `src/lib/form/fields.test.ts`
- [x] `encode()` sends "Other" as `__other_option__` with the text in `.other_option_response`, and nothing for an empty Other — unit — `fields.test.ts`
- [x] `encode()` leaves out empty answers, and sends Which language? only when Translate is ticked — unit — `fields.test.ts`
- [x] `encode()` sends the opt-in as its single option when ticked, nothing when not — unit — `fields.test.ts`
- [x] `check(step, answers)`: step 1 needs an interest; step 3 needs an email that looks like one — unit — `fields.test.ts`
- [x] the entry ids are the decimal of the questions' hex ids — unit — `fields.test.ts`

## Verification

On the preview:

1. Header, Get involved: `/get-involved`, step 1 of 3, Taro and six tiles.
2. Next with nothing ticked: an error under the tiles, focus on the first tile.
3. Tick Translate and Teach, then Next.
   - Step 2 shows Which language?
   - Fill it with test answers, marked TEST.
   - Back keeps the ticks, and Next again keeps the text.
4. Step 3: a bad email shows an error. A good one, then Send: the thank-you.
5. In the Google Form's Responses, the test answer appears with every field in the right
   question. Delete it after, with Yan's OK.
6. Phone width: one column, no sideways scroll, Next full width.

## Out of scope

- Voice notes, file uploads.
- Our own storage or a dashboard of responses (Google's Responses tab and Sheet).
- Spam protection beyond Google's own. Revisit if junk arrives.

## Open questions

- [ ] Sam may reword the questions (in the form, the site's copy follows).
- [ ] Link the form to a Google Sheet? (In the form's Responses tab; Yan or Sam.)

## Outcome

_Filled in when this goes to `done` or `abandoned`._
