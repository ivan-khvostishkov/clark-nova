# Clark Nova Typewriter

A typewriter that behaves like a typewriter. Ink is permanent, there is no undo,
the keyboard is the machine's own and not your operating system's, and what comes
out is an A4 sheet at 300 dpi that you can print or post.

**[clarknova.nosocial.net](https://clarknova.nosocial.net)** — a single HTML page,
installable, works offline.

## The story

The name comes from the Clark Nova, the insect-typewriter that talks back to Bill
Lee in David Cronenberg's *Naked Lunch*. The machine underneath is a real one: a
Royal Quiet De Luxe from 1956, in teal — which is where the colour of the keyboard
comes from.

It is an homage to the time before we made documents on computers, when a letter
was a physical object that went by post rather than an email that arrives while
you are still deciding whether to send it. Writing on a machine that cannot
backspace over a mistake is a different act from typing into a text box. You
commit.

What is genuinely surprising is that no app anywhere — web, mobile or desktop —
actually emulates the mechanics. There are plenty of typewriter *fonts*, and
plenty of apps that play a clacking sound while you edit text you can still
delete. What none of them reproduce is the physics: ink that builds up where you
strike twice, overstriking instead of erasing, a carriage that stops at the right
margin until you release it, a bell eight characters before that, a roller that
moves in quarter lines, and a keyboard with the characters a 1956 machine actually
had rather than the ones your OS thinks you want.

So the mechanics here are the point, and they are implemented rather than
suggested.

## From a toy to a tool

Because the sheet is a true A4 page at 300 dpi and prints as an image at that
resolution, the output holds up as a real document rather than a screenshot of a
joke. Applying *"Insist on the Highest Standards"* to something that started as a
tribute is what turned it into something the author uses in earnest.

The clearest case is paper forms — the ones some organisations, banks especially,
still send through the post. In the author's words:

> If you don't bother to send me the PDF by email, why would I bother to fill the
> form in by hand, or scan it and type into a modern PDF editor? I will fill it in
> with Clark Nova, print it, and send it back to you on paper too — on the
> principle of proportional burden.

The workflow is the **Insert a page** feature: scan the form at A4/300 dpi, load
it as the sheet, roll the platen in quarter lines until the type lands in the
boxes, type, print, post.

## Features

### Typewriter mechanics

- **Ink is permanent.** There is no erase, no undo, no delete. Backspace moves the
  carriage left without removing anything, which is how you overstrike — including
  umlauts, by striking a letter and then `"` over it.
- **Ink build-up.** Every strike grows the ink in that cell by a pixel, so striking
  the same character twice does not land identically twice: the letter gets heavier
  and rougher, the way a real slug loads the paper. Each glyph also prints with a
  slight bleed under it.
- **The machine's own keyboard**, not the OS layout: `½ ¼ ¢ @`, `"` on shift-2,
  no separate number pad, no autocorrect, no dead keys.
- **Carriage discipline.** Home column 11. Bell at column 63. Right margin stop at
  71, where the carriage refuses to go further until you press margin release.
  Hard stop at column 80, where further strikes print in place. Tab stops every
  five columns.
- **Shift and shift lock** as separate mechanisms, with the lock releasing when you
  press shift again.
- **Quarter-line platen roll** from the knobs on either side of the sheet, so the
  type can land between lines — which is what makes form-filling possible.
- **Real typewriter samples** for the strike, space, backspace, carriage return,
  bell, shift and roller — nine recordings, not synthesised clicks.

### The page

- **2480 × 3508 px — A4 at 300 dpi**, as a grid of exactly 80 columns × 48 rows
  (31 × 72 px cells).
- **Type set in Special Elite** at 56 px, the size a real machine strikes.
- **Ink that is not black.** Pure black exists in no ribbon and reads as
  artificial, so the type strikes in Pantone 19-4016 TPG "Inkwell", a desaturated
  blue-grey.
- **Pan and zoom** the sheet freely; the view follows the carriage as you type.

### Getting paper in and out

- **Pull the sheet** — save the page as a 2480 × 3508 PNG (right-click → *Save
  image as…*, or long-press → *Save to Photos* on a phone).
- **Insert a page** — feed a previously pulled sheet, a scanned form or a card back
  in and type on top of it. The image must be 2480 × 3508 px, ±1 px.
- **Reload** for a fresh sheet.
- **Print** — A4 portrait, the sheet at 300 dpi inside a hairline frame, with a
  faint credit line below it. See [Printing](#printing) for the one driver quirk
  worth knowing.

### Typing on a phone

Touch typing on glass has no key edges to feel, so the pad models the aim instead:

- A key types only when the press lands **near its centre**. A press on a key
  border, in the gap between keys, or off-centre is a miss and types nothing.
- A miss **pauses the keyboard for a second**, and every further tap restarts the
  pause. Recovering from a miss means stopping, not hammering on.
- A **crosshair** marks the exact point you touched — teal on a hit, pink on a
  miss — so you can calibrate your aim, and the pad itself flushes pink and fades
  back over the length of the pause.
- The strip below the space bar is inert, so the swipe that switches apps on a
  phone costs you nothing.

## Controls

**Desktop** — Shift = hold shift · Shift Lock = Shift+LeftCtrl · Enter = carriage
return · Backspace = move left without erasing · Tab = next stop · RightCtrl =
margin release · ↑ ↓ = roll the platen · scroll = zoom · drag = pan

**Mobile** — tap keys to type · hold Shift and tap for uppercase · ▲ ▼ = roll the
platen · pinch = zoom · drag = pan

## Printing

The print view drops the whole machine — keyboard, rulers, knobs, nameplate,
cursor — and lays out just the sheet: A4 portrait with 5 mm margins, 196 mm wide
so the footer has room under it, framed with a hairline, credits below in faint
ink.

One caveat if you print through a **PostScript driver such as Adobe PDF**: the
driver may rebuild small text as a Type 3 outline font with no `ToUnicode` map, so
the footer credits copy out as private-use gibberish and Acrobat draws an
oversized text cursor over them. The page itself is fine — the browser's own *Save
as PDF* embeds proper selectable text. To fix it in the driver, set *Printing
Preferences → Advanced → PostScript Options → TrueType Font Download Option* to
**Native TrueType**, and uncheck *Rely on system fonts only* in the Adobe PDF
settings.

## Development

The site is the directory `clarknova.nosocial.net/`: one hand-written
`index.html` with inline CSS and JS, a service worker, a manifest and the audio
samples. No framework, no bundler, no build step — open the file and it runs.

```sh
# static checks: HTML parse errors, duplicate ids, JS and CSS syntax,
# JSON, every href/src/audio/precache reference, every getElementById
npm install --no-save parse5@^7 acorn@^8 css-tree@^2
node tools/validate.mjs clarknova.nosocial.net
```

`VERSION` in `clarknova.nosocial.net/sw.js` is the single source of the release
number: it is the cache-name suffix, the build workflow reads it, and the About
dialog reads it back out. Bump it on every release, or clients keep the old
bundle.

## Credits

Built by [NoSocial.Net](https://nosocial.net) and Ivan Khvostishkov —
[clarknova@nosocial.net](mailto:clarknova@nosocial.net).

Type set in [Special Elite](https://fonts.google.com/specimen/Special+Elite),
with [Courier Prime](https://fonts.google.com/specimen/Courier+Prime) and
[EB Garamond](https://fonts.google.com/specimen/EB+Garamond) for the machine
itself. Sounds are recordings of real typewriters.

The *Clark Nova* is a fictional machine from David Cronenberg's 1991 film *Naked
Lunch*, adapted from the novel by William S. Burroughs. This project is an
unaffiliated homage.
