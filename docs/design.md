# Build Together: design reference

A quiet room. Each person is a small light. A strong match is a thin thread. Nothing else glows.

This file records the visual system for the Tec de Matamoros workshop app so it can be rebuilt without guessing. Every number below is the value in the code. Where the document and the code disagree, the code wins, and this file should be fixed.

**Source of truth:** `app/globals.css` (all chrome), `components/network/NetworkGraph.tsx` (nodes, threads, forces), `components/brand/Mark.tsx`, and the four screens listed under [Screens](#screens).

**Component library:** [HeroUI](https://heroui.com) v3 (`@heroui/react` and `@heroui/styles`). Buttons, toggles, chips, fields, cards, surfaces, toolbars, and sheets come from HeroUI. The graph, the mark, and the type are still drawn here. HeroUI is themed onto the tokens below, and its default blur, shadow, and press-scale are turned off in `app/globals.css`.

## Contents

1. [Idea](#idea)
2. [What this look refuses](#what-this-look-refuses)
3. [Tokens](#tokens)
4. [Type](#type)
5. [The node](#the-node)
6. [Threads](#threads)
7. [The room](#the-room)
8. [Components](#components)
9. [Screens](#screens)
10. [Responsive](#responsive)
11. [Accessibility](#accessibility)
12. [Copy](#copy)
13. [Rebuild checklist](#rebuild-checklist)

## Idea

A person is a dark disc. Their discipline color lives in the rim, and the center stays deep. The light does not sit on the surface like a highlight, and it does not turn the disc into a sphere. A score of 16 or more (`FILAMENT_SCORE`) draws a brighter, near-white thread. Weaker ties stay faint.

Names, initials, and line weight carry the information. Color is identity, never the only signal.

## What this look refuses

These were tried and rejected. Do not bring them back.

- A white or pearl node body. A gradient that starts at `#ffffff` makes every person a marble.
- An offset highlight or specular spot. Light placed up and to the left is what makes a flat disc read as 3D.
- A bright center. The glow lives at the rim and fades inward.
- Neon rainbows, gold rings, pulsing, traveling beads on threads, and a continuous redraw just to animate.
- A large aurora, a vignette, a dotted grid, and a lamp in the corner of the host screen.
- Frosted glass pills, inset highlights, drop shadows, and display type above 40px.

## Tokens

Defined on `:root` in `app/globals.css`. The light scheme (`prefers-color-scheme: light`) swaps `--paper` and `--ink`, so primary text and the join button invert together.

| Token | Dark | Light | Use |
| --- | --- | --- | --- |
| `--bg` | `#07070c` | `#e4e4ea` | Page background, top bar |
| `--field` | `#07070c` | `#e4e4ea` | Graph field |
| `--sheet` | `#1c1c1e` | `#f7f7f8` | Dossier, sheet, zoom cluster, person jump, stage rail, host cards |
| `--raised` | `#2c2c2e` | `#e1e1e6` | Inputs and unselected choices |
| `--paper` | `#f5f5f7` | `#1c1c1e` | Primary text, join button fill, focus ring |
| `--ink` | `#1c1c1e` | `#f5f5f7` | Text on the join button and selected choice |
| `--mist` | `#c7c7cc` | `#3a3a3c` | Secondary text, quiet actions |
| `--faint` | `#98989d` | `#5c5c61` | Tertiary text, placeholders, legend |
| `--thread` | `#e4d7bc` | `#6d5a32` | A hot score in text, the hot activity pip |
| `--live` | `#6f9a78` | `#2f6b42` | Status pip. No glow |
| `--danger` | `#ff6961` | `#c41a16` | Destructive text and the error pip. Never a filled button |
| `--glass`, `--glass-strong` | `#101012`, `#161618` | `#f4f4f6`, `#ffffff` | Declared, but solid. No surface uses blur |
| `--line`, `--glass-stroke`, `--glass-highlight`, `--vignette` | `transparent` | `transparent` | Kept at transparent on purpose |
| `--dot` | `rgba(255,255,255,0.35)` | `rgba(0,0,0,0.22)` | Declared, unused. The dot grid is off |
| `--shadow-float` | `none` | `none` | There are no shadows |

Selection color is `--paper` text on `--ink`. Focus is a 2px solid `--paper` outline, 3px offset.

## Type

System stack only: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", system-ui, sans-serif`. The graph canvas uses the same stack. Do not load a web font.

| Role | Size | Weight | Tracking | Line height |
| --- | --- | --- | --- | --- |
| Screen title (`.float-copy h1`) | `clamp(28px, 3vw, 36px)`, 28px under 720px | 560 | -0.03em | 1.05 |
| Lede | 17px | 400 | none | 1.35 |
| Brand name (`.brand p`, `.brand h1`) | 15px | 500 | -0.02em | 1.15 |
| Brand sub line (`.brand span`) | 13px | 400 | none | 1.2 |
| Bar actions, status, buttons | 15px | 500 (buttons 560) | -0.01em on join | none |
| Dossier name | 22px | 560 | -0.03em | 1.1 |
| Sheet title | 22px | 560 | -0.03em | 1.15 |
| Sheet labels, legends | 17px | 600 | none | none |
| Field text | 17px | 400 | none | none |
| Choice | 15px | 560 | none | none |
| Host title | `clamp(32px, 4vw, 40px)` | 560 | -0.035em | 0.95 |
| Figure number | `clamp(32px, 4vw, 44px)` | 600, tabular | -0.05em | 0.9 |
| Stage figure number | `clamp(22px, 2vw, 28px)` | 600, tabular | -0.05em | 0.9 |
| Figure label | 14px | 560, in `--mist` | none | none |
| Legend | 13px | 500, in `--faint` | none | none |
| Score | 15px | 560, tabular | none | none |
| Stage caption name / detail | 17px / 15px | 560 / 400 | -0.03em / none | none / 1.35 |
| Empty room line | 17px | 500 | -0.03em | 1.25 |
| Arrival orb initials | 18px | 600 | -0.03em | none |
| Activity heading | 17px | 600 | -0.02em | none |
| Activity row title / detail | 16px / 14px | 500 / 400 | none | none |

The mark is two filled discs (r 3.4) at x 9.2 and x 22.8, joined by a 1.25px round-capped line, in `currentColor`, on a 32 by 32 viewBox. No glow filter.

## The node

Painted in `paintNode` in `components/network/NetworkGraph.tsx`. Radius is 14px on the home screen and 16px on the projector. The signed-in person is 1px larger.

Every gradient is centered on the node. Never offset a gradient.

1. **Halo.** A radial gradient from `0.9 × radius` to `1.8 × radius` (1.3× with increased contrast). Alpha 0.12, or 0.20 for you. It starts outside the body, so it reads as a leak of the rim and not a lamp behind the disc. Skipped when the node is dimmed.
2. **Body.** A flat fill of `core`, a near-black of the same hue.
3. **Rim glow.** Clipped to the disc. A radial gradient from `0.38 × radius` to `radius`: alpha 0 at the start, 0.22 at 62% (0.10 if dimmed), and 0.92 at the edge (1.0 with increased contrast).
4. **Edge line.** A 1px stroke at radius minus 0.5, in the rim color at alpha 0.55.
5. **Focus ring.** Only for you, the selected person, or the hovered person: a stroke 3.5px outside the disc, `rgba(245,245,247,0.55)`, 1px divided by the zoom (floored at 0.4).
6. **Initials.** `#f5f5f7`, weight 600, `max(11px, radius × 0.5)`, centered, at y plus 0.5.
7. **Name.** First name below the node at `radius + 7/zoom`, in `--paper`, weight 500, 15px on the projector and 13px at home, each divided by the zoom. The projector always shows names. At home they show for you, the selected, the hovered, or when the room is 16 people or fewer and zoom is above 0.55.

When someone is selected or hovered, people not connected to them draw at alpha 0.28. While someone is selected, every person who is not dimmed shows a first name, so you can read who they connect to. A node whose position is not a finite number is not painted. It is reset to the origin with zero velocity and the simulation recovers.

The paint, for reference:

```ts
// halo
const glowR = radius * (contrast ? 1.3 : 1.8);
const halo = ctx.createRadialGradient(x, y, radius * 0.9, x, y, glowR);
halo.addColorStop(0, `rgba(${hue.glow}, ${isYou ? 0.2 : 0.12})`);
halo.addColorStop(1, `rgba(${hue.glow}, 0)`);

// body
ctx.fillStyle = hue.core;

// rim glow, clipped to the disc
const rim = ctx.createRadialGradient(x, y, radius * 0.38, x, y, radius);
rim.addColorStop(0, `rgba(${hue.glow}, 0)`);
rim.addColorStop(0.62, `rgba(${hue.glow}, ${dimmed ? 0.1 : 0.22})`);
rim.addColorStop(1, `rgba(${hue.glow}, ${contrast ? 1 : 0.92})`);

// edge line
ctx.arc(x, y, radius - 0.5, 0, Math.PI * 2);
ctx.strokeStyle = `rgba(${hue.glow}, 0.55)`;
ctx.lineWidth = 1;
```

### Discipline colors

`core` is the body. `glow` is the rim, stored as an RGB triple so it can be used at several alphas. An unknown discipline uses `Otra`.

| Discipline | Core | Rim |
| --- | --- | --- |
| Sistemas Computacionales | `#0e171c` | `112, 176, 204` |
| Industrial | `#1a130c` | `214, 156, 92` |
| Mecatrónica | `#171120` | `168, 128, 214` |
| Electrónica | `#1a170c` | `214, 194, 108` |
| Civil | `#0e141f` | `110, 150, 214` |
| Ambiental | `#0d1a13` | `104, 192, 140` |
| Química | `#1e1016` | `214, 118, 148` |
| Administración / Negocios | `#1a120e` | `214, 144, 118` |
| Otra | `#141416` | `170, 170, 180` |

The legend dot is 8px with `radial-gradient(circle, #0e171c 30%, #70b0cc 100%)`. The arrival orb is 64px with `radial-gradient(circle, #0e171c 38%, #70b0cc 100%)` and `#f5f5f7` initials. Both use the Sistemas pair.

## Threads

Painted in `paintLink`. A quadratic curve whose control point is offset by `±0.08` (strong) or `±0.2` (weak) times `min(link length, 36)`. The sign comes from a hash of the link id (`curvatureOf`), so it is stable between frames. Round caps. No beads, no gradient stroke, no glow.

| Kind | Width | Color |
| --- | --- | --- |
| Score 16 or more, any thread touching the focused person, or the hovered or pinned thread | 1.35px | `rgba(244,240,230,0.72)` |
| Weaker tie | 1px | `rgba(255,255,255,0.16)` |
| Dimmed, because focus is elsewhere | 1px | `rgba(255,255,255,0.06)` |

With increased contrast the strong thread is `rgba(255,255,255,0.92)` and the weak one is `rgba(255,255,255,0.38)`. Widths are divided by the zoom so threads stay hairlines on screen.

Threads are called **hilos** in copy. "Ámbar" is retired. Constants: `STRONG_MATCH_SCORE = 8`, `FILAMENT_SCORE = 16`. `threadsToDraw` keeps every link of 16 or more, plus each person's two best links, so the room never turns into a hairball. Selecting a person adds every thread that touches them, even the ones the quiet room had hidden. The reason is never painted on the curve. Hovering a thread, or tapping it, opens `.thread-note`: the two names, the score, and `reason`. The note sits above the legend. On the projector it takes the caption's place until the pointer leaves, unless the thread was tapped, in which case it stays until the background is clicked. The hovered or pinned thread uses the strong stroke. The hit area is the same curve, 16px wide on screen.

## The room

The field is `--field` and the page is `--bg`. There is no dot grid, no vignette, and no central wash once anyone is in the room. Before the first person arrives, `.aurora` is a 220px circle at 46% from the top, `radial-gradient(circle, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 70%)`. It does not move. `.is-live` hides it.

The graph is full bleed behind the chrome. After the simulation settles it fits the room with padding so names clear the title and the dossier.

| Screen | Top | Right | Bottom | Left |
| --- | --- | --- | --- | --- |
| Home | 156 | 36, or the dossier width if one is open | 108 with the join button, otherwise 72 | 36 |
| Stage | 118 | 380 with the activity rail, otherwise 36 | 36 | 36 |

The dossier width used for fit is `min(360, container width × 0.46)` at home and `min(380, container width × 0.46)` on the projector. Clicking a node eases the camera onto that person over 480ms (`centerAt` and `zoom` together) and shifts the view by half the panel width so the person is not under the panel. Zoom settles between 0.8 and 1.35 at home, and 0.95 and 1.35 on the projector. Closing the panel eases back to the whole room over the same 480ms. While someone is selected, the settling fit does not run, so the camera is not pulled away. Reduced motion uses duration 0.

Simulation: charge −72 at home and −90 on stage. Link distance 72 for strong ties and 110 for weak. Link strength 0.4 strong and 0.14 weak. Collision radius 30 at home and 34 on stage. A weak centering force of 0.12. `cooldownTicks` 260, `d3AlphaDecay` 0.018, `d3VelocityDecay` 0.32. Zoom range 0.08 to 5. The fit animation is 600ms, or 0 with reduced motion.

Hit area for a node is a 28px circle. For a thread it is the same curve stroked 16px wide on screen (`linkPointerAreaPaint`, `linkHoverPrecision` 8). Hovering sets the note, clicking pins it, and clicking the background clears the selection and the pin. A pin is dropped when its thread is no longer drawn.

Thread ends are the node objects themselves, not ids, so the link force never has to resolve a string. A thread is skipped when either end has no finite position.

## Components

One material: flat, opaque, no blur, no border, no shadow. Everything is a rounded rectangle or a pill in `--sheet`.

**Rule: use HeroUI for everything that is not the canvas, the mark, or the type.** Before writing a native `button`, `select`, `input`, `ul` of actions, divider, or scroll container, look for the HeroUI component (`list_components` in the HeroUI MCP) and use it. Style it through the layout hooks in `app/globals.css`, never with a second hand-built control. A native element is allowed only when HeroUI has no equivalent, and it is listed under "Native on purpose" below.

Chrome is HeroUI v3, not a second set of hand-built controls. Import from `@heroui/react`. There is no provider. Styles load once, in `app/globals.css`, with `@import "@heroui/styles"` immediately after `@import "tailwindcss"`. Semantic HeroUI variables (`--background`, `--foreground`, `--surface`, `--accent`, `--field-background`, and the rest listed in that file) point at the tokens in [Tokens](#tokens). `--accent` is `--paper` and `--accent-foreground` is `--ink`, so a primary `Button` is the join button. Shadows are `none`. Do not turn the backdrop to `blur`, and do not leave the default press scale on.

| Piece | HeroUI | Notes |
| --- | --- | --- |
| Join, confirm, copy | `Button` `variant="primary"` | 44px, weight 560. Hover opacity 0.88. Disabled 0.55 |
| Quiet bar actions | `Button` `variant="ghost"` inside `Toolbar` | `--mist`, hover is `--paper` at 8%. A route is `next/link` with `buttonVariants` |
| Sound, activity, choices | `ToggleButton` | Bar toggles stay transparent and only change the text color. Form choices fill `--paper` when selected |
| Status | `Chip` `variant="tertiary"` | Transparent. The 8px pip is still ours |
| Dossier, stage rail, QR, caption, thread note | `Surface` `variant="default"` | `--sheet`, radius 16 (caption and thread note 14) |
| Dossier close | `CloseButton` | `.dossier-close`, 44px circle |
| Dossier scroll | `ScrollShadow` `hideScrollBar` | `.dossier-scroll`, holds the padding `20px 18px 18px`. The `Surface` itself does not scroll. On phones it is capped at 46dvh |
| Dossier match row | `Button` `variant="ghost"` `fullWidth` | `.match-row`, left aligned, 44px min, no fill. Name and score on one line, reason below. Hover lowers opacity to 0.8 and also highlights that thread on the graph |
| Dossier row divider | `Separator` | `.match-rule`, `--paper` at 8% |
| Person jump | `Select` `variant="secondary"` + `ListBox` | `.person-jump`. The value is always empty, so choosing a name only opens that person. Trigger 44px, radius 10, `--sheet`. Popover is `--sheet`, radius 12, no shadow, rows 44px |
| Zoom cluster | `Button` `variant="ghost"` `isIconOnly` | Three 44px buttons |
| Host cards | `Card` | Padding 22, radius 16, title 22px |
| Name and passcode | `TextField` + `Input` + `Label` | 48px, radius 14, fill `--raised` |
| Registration and confirm | `Modal` | Opaque backdrop `rgba(0,0,0,0.46)`. `placement="auto"` is a bottom sheet, centered from 640px. Close is `CloseButton` |
| Errors and host result | `Alert` | Flat, `--raised` or the danger text. Never a filled danger button |
| Pending submit | `Button` `isPending` + `Spinner` | |

The measurements below still apply. Class names are the layout hooks; the control itself is the HeroUI component in the table above. Zoom is an icon-only `Button`. The thread note is a HeroUI `Surface` like the dossier and the caption. The person jump is a HeroUI `Select`, and the dossier's match rows are HeroUI ghost `Button`s.

**Native on purpose.** Only these stay outside HeroUI: the graph, a canvas drawn in `NetworkGraph.tsx`, with its hover, click, and pin events; `Mark`; and the type. The list wrappers (`ul`, `li`) around match rows are plain markup with no behavior. Anything new goes through HeroUI first, and an addition to this list needs a reason.

| Component | Class | Spec |
| --- | --- | --- |
| Top bar | `.glass-bar` | Absolute, full width, 60px min height (64px on stage), no radius, background `--bg`, padding `0 20px 0 24px` plus safe areas |
| Brand | `.brand` | 10px gap. Mark is 28px on home, 32px on stage, 40px on host |
| Text button | `.button--ghost` | 44px tall, `0 12px` padding, pill, transparent, `--mist`. Hover is `--paper` text on `--paper` at 8% |
| Status | `.chip.status` | 44px tall, 8px gap, `0 10px` padding, `--mist` |
| Pip | `.pip` | 8px circle in `--live`. `.hot` is `--thread`. `.quiet` is `--paper` at 0.72. Error is `--danger`. Preview is `--faint` |
| Join button | `.button--primary` | 44px, pill, `--paper` fill, `--ink` text, 560. Hover is opacity 0.88. Disabled is 0.55. No scale, no shadow |
| Floating action | `.float-action .button` | Min width 200px. Centered, 20px above the bottom |
| Danger button | `.danger-text` | 44px, transparent, `--danger` text. Confirm only. Cancel is the primary button |
| Zoom cluster | `.zoom-bar` | Bottom left, 16px in, 18px up, `--sheet`, radius 12, 2px padding and gap. Buttons are 44px circles |
| Person jump | `.person-jump` | HeroUI `Select`. Trigger 44px tall, radius 10, `--sheet`, 14px text, placeholder in `--mist`. Top right 68px down, 240px wide max |
| Legend | `.legend` | Plain text, no container, centered, 22px from the bottom, 16px gap. Hidden on the stage |
| Dossier | `.dossier` | Right, 72px from the top and 16px from the bottom, 320px wide max, `--sheet`, radius 16, no padding of its own. The `ScrollShadow` inside carries `20px 18px 18px`. Close is a 44px circle. On the projector it starts 92px below the top and is 340px wide max. It enters with opacity and `translateX(16px)` over 240ms, `cubic-bezier(0.23, 1, 0.32, 1)`. The global reduced-motion rule cuts that transition |
| Stage caption | `.stage-caption` | No longer shown. A selected person opens the dossier instead |
| Thread note | `.thread-note` | Centered, 36px above the legend (98px up while the join button shows). `min(420px, 100% − 200px)`, `--sheet`, radius 14, padding `14px 16px 15px`. Names 15px / 560, reason 14px in `--mist`. Pointer events off. On stage it uses the caption slot, `min(560px, 100% − 200px)` |
| Sheet | `.bt-sheet` | Max 560px, radius `20px 20px 0 0` (16 on all corners from 640px up), `--sheet`, padding `8px 20px 28px`, max height `min(92dvh, 820px)` |
| Sheet backdrop | `.modal__backdrop--opaque` | `rgba(0,0,0,0.46)`. Bottom aligned, centered from 640px up |
| Grabber | `.grabber` | 36 by 5, pill, `--paper` at 28%. Hidden from 640px up |
| Field | `.input` | 48px tall, radius 14, `--raised`, 17px |
| Choice | `.choice-toggle` | 44px min, pill, `--raised`, 15px, 560. Hover mixes 30% `--paper`. Selected is `--paper` with `--ink` text |
| Icon button | `.icon-btn` | 44px circle, `--paper` at 8%. Used by `CloseButton` |
| Host card | `.host-card` | 28px top margin, padding 22, radius 16, `--sheet` |
| Stage rail | `.stage-rail` | Right 16px, 340px wide max, starts about 92px below the top, 12px gap. Sections are `--sheet`, radius 16, padding `16px 16px 8px` |
| Stage QR | `.stage-qr` | Radius 16, padding 12, 12px gap. The code is 108px on a white 12px-radius tile, `#ffffff` on `#16140f` |
| Feed row | `.feed-row` | 4px between rows, `py-2.5`, 12px gap |

Score numbers in the dossier are `--paper`, or `--thread` when the score is 16 or more.

## Screens

**Home** (`app/page.tsx`). Graph full bleed. Top bar: brand on the left, then the status, "Proyector", and "Compartir". Below it, the title and lede at top left, 72px down and 24px in, 680px max. The person jump sits at the top right while nobody is selected. The join button is bottom center ("Unirme a la red", or "Ver a {first name}" once you are in and have a match). The zoom cluster and legend rise 66px when the button is showing. The dossier opens on the right when a node is selected. Under the name it shows the career in `--mist` at 14px, the interests joined with ` · ` at 14px, and the skills joined the same way at 13px in `--mist`. It does not show a goal. Then it lists every match with its score and reason. Hover or tap a thread to read the same reason in the thread note.

**Stage** (`app/stage/page.tsx`). Graph full bleed with first names always shown. Top bar: brand, the figures Personas, Hilos fuertes, and Carreras (the third is hidden below 1100px, so the HeroUI bar controls stay on one line), then the status, "Mudo" or "Sonido", "Actividad", and "Pantalla" or "Ventana". The status, toggles, and screen control are a HeroUI `Toolbar`. The right rail holds the activity feed and the QR with the text "Escanea y entra", and it hides while a person is selected. Selecting a node opens the same dossier as home, on the right, listing every match with its score and reason. The camera eases onto that person. While a thread is hovered or pinned, the thread note still sits at the bottom. The legend is hidden.

**Host** (`app/host/page.tsx`). Centered column 720px wide. Mark, "Taller", a pip and "Tec de Matamoros · {status}", and a join-button link "Abrir proyector". Before login: one card with "Código de anfitrión", a password field, and "Entrar". After login: figures (Personas, Coincidencias, Carreras), a "Enlaces" card, and a "Vaciar la red" card with a text-only danger action. The confirmation is a centered sheet titled "¿Vaciar la red?" with "Sí, vaciar" as text and "Cancelar" as the join button.

**Registration** (`components/registration/RegistrationModal.tsx`). A sheet for the school workshop: grabber, "Únete a la red", "Nombre, carrera, lo que sabes y lo que te gusta. Sin correo.", and a close button. The form is a name field, then Carrera, Habilidades, and Intereses. "Qué buscas hoy" is retired. There is no agreement checkbox. Joining still sends `consent: true`, because the register schema requires it. Escape and backdrop click close it, and the name field takes focus. On success the sheet shows the arrival orb with the person's initials, "Ya estás en el salón", and "Tu luz aparece en el proyector y busca coincidencias." It closes after 1.2 seconds. Confetti uses `#f7f4ee`, `#cfc3a2`, `#ffffff`, 40 particles, and is skipped with reduced motion.

Carrera is the nine disciplines in [Discipline colors](#discipline-colors), two columns, one selected. Habilidades and Intereses are `.choice-toggle` pills. The counters read `{n}/4` and `{n}/3`. A fifth skill or a fourth interest does not select. At least one skill and one interest are required.

Habilidades, in this order. These stay technical: what the person can do in the taller.

| Skill |
| --- |
| Programación |
| Inteligencia Artificial |
| Diseño UX/UI |
| Robótica |
| Electrónica |
| Análisis de Datos |
| Marketing |
| Negocios |
| Diseño 3D |
| Liderazgo |
| Comunicación |

Intereses, in this order. The first five are the workshop. The last seven are personal, so two students can match on música or fútbol as well as on robótica.

| Interest |
| --- |
| Inteligencia Artificial |
| Videojuegos |
| Robótica |
| Aplicaciones |
| Medio Ambiente |
| Música |
| Fútbol |
| Cine |
| Fotografía |
| Anime |
| Deportes |
| Arte |

A match reason is shared interests and complementary skills, plus the same career when it applies. The strings are "Ambos comparten interés en {interest}", "Interés mutuo en {a} y {b}", "{skill} + {skill}: habilidades complementarias", and "Misma disciplina en {discipline}". A goal is not stored as a reason and is not drawn on the dossier.

**Preview** (`?demo=1`). Shown only while the room is empty and loaded. `lib/events/demo-room.ts` holds eight rehearsal people and eight connections with scores 19, 18, 17, 16, 14, 11, 9, and 8. Real people replace them at once. The status reads "Vista previa" with a `--faint` pip.

## Responsive

| Breakpoint | Change |
| --- | --- |
| Up to 900px | The legend is hidden while the join button is showing |
| Up to 720px | Status and the brand sub line are hidden. Title is 28px. Person jump moves above the zoom cluster, full width with 16px margins. Dossier and stage rail become bottom sheets, 12px from each edge, 46% and 42% max height. Stage caption and thread note are `100% − 32px`. Zoom is hidden on the stage |
| From 640px | The registration sheet is centered with 16px radius and no grabber |

## Accessibility

- Every tappable control is at least 44px.
- Contrast: initials are light on a near-black core. Body text is `--paper` or `--mist` on a dark surface. Small text should stay near 4.5:1.
- Reduced motion: transitions and animations are cut to 0.01ms, so the dossier appears in place. The graph does not animate on its own, and the camera move and the fit are 0.
- Reduced transparency: dossier, caption, thread note, sheet, zoom cluster, and person jump stay on solid `--sheet`. The top bar is already solid.
- Increased contrast: 2px `--paper` borders on bar, legend, person jump, zoom, dossier, caption, thread note, sheet, host cards, rail sections, and the QR card. The rim and strong threads become more opaque and the halo tightens.
- Color is never alone. A strong match is a lighter, thicker line and a number in the dossier. Discipline is a rim hue plus the name.
- The graph has a screen-reader summary: "{n} personas. {m} hilos dibujados. {k} hilos de 16 puntos o más."

## Copy

Spanish, short, calm. No eyebrows. No marketing lines. Key strings:

| Where | Text |
| --- | --- |
| Home title | "La red del taller", or the person's name once registered |
| Home lede, empty | "El talento existe. Solo falta conectarlo." |
| Home lede, with people | "{n} personas en el salón. {k} hilos de 16 puntos o más." |
| Home lede, no strong thread | "{n} personas en el salón. Todavía sin un hilo de 16 puntos." |
| Home lede, you have a match | "{name} es tu hilo más fuerte, {score} puntos. {reason}." |
| Home lede, you, no match | "Tu gafete ya está en el salón. El primer hilo aparece cuando entra alguien compatible." |
| Empty graph | "La red abre cuando entra la primera persona." |
| Status | "En vivo", "Reconectando", "Sincronizando", "Vista previa" |
| Stage figures | "Personas", "Hilos fuertes", "Carreras" |
| Activity | "Ahora en el taller", "Nadie ha entrado." |
| Person jump | "Ir a una persona" |
| Dossier | "{n} coincidencias", or "Todavía sin coincidencias" |
| Join sheet title | "Únete a la red" |
| Join sheet lede | "Nombre, carrera, lo que sabes y lo que te gusta. Sin correo." |
| Join name | "¿Cómo te llamas?" |
| Join sections | "Carrera", "Habilidades" with "{n}/4", "Intereses" with "{n}/3" |
| Join submit | "Entrar a la red", or "Entrando" while pending |
| Join success | "Ya estás en el salón", "Tu luz aparece en el proyector y busca coincidencias." |
| Match, one interest | "Ambos comparten interés en {interest}" |
| Match, two interests | "Interés mutuo en {a} y {b}" |
| Match, skills | "{skill} + {skill}: habilidades complementarias" |
| Match, career | "Misma disciplina en {discipline}" |

## Rebuild checklist

To reproduce this design, in order:

1. Set the tokens and the system font stack. Keep `--glass-*`, `--line`, and `--vignette` at transparent or solid.
2. Install `@heroui/react` and `@heroui/styles`. Import the styles after Tailwind, map HeroUI's semantic variables onto the tokens, and build the chrome from the HeroUI pieces in [Components](#components). Check there is no `backdrop-filter`, `box-shadow`, or border on any surface except the increased-contrast media query, and that buttons do not scale when pressed.
3. Paint nodes with the seven steps in [The node](#the-node). Check that no gradient is offset and no stop is white.
4. Draw threads with the three states in [Threads](#threads).
5. Apply the room forces and fit padding from [The room](#the-room).
6. Lay out the four screens from [Screens](#screens) and the breakpoints from [Responsive](#responsive).
7. Use the strings in [Copy](#copy).
8. Compare against a screenshot at 1024 by 768 and at 390 wide, in dark and light, with and without `?demo=1`.

If a rebuilt screen shows a white node, a lit center, a glowing line, a frosted bar, or a pulsing anything, it has drifted.
