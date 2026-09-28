/**
 * Contrast guard: reads the theme files, resolves the tokens and fails if any
 * pair that carries text falls below the minimum of the standard.
 *
 * ## The math no longer lives here
 *
 * It lives in `src/lib/contrast.ts`, and ships in the published package. While
 * it lived in this file, `scripts/` was not in the `files` of either package:
 * whoever consumes the library and wants to measure their own client's theme
 * had nothing to import, and ported the math by hand. A real consumer wrote
 * 220 lines for that - role names, pairs, minimums and alpha composition -,
 * and ported `compose` on the day it was broken: the function did not see
 * `rgba(r,g,b,a)` nor the eight-digit form, returned the string untouched, and
 * `contrastRatio` answered NaN. TWELVE of the 45 roles carry alpha. The fix
 * went in here and their copy aged silently, which is the exact cost of
 * library math living outside the package.
 *
 * This file is still the GUARD - the one that scans `src/tokens/themes/*.css`
 * and fails the gate. The pair table and the engine left; the reason for each
 * pair stayed down here, because in `src/` the house rule is that only JSDoc
 * of a public prop survives, and this text would not fit there.
 *
 * ## Why each pair exists
 *
 * **`CSS_PAIRS` - the pairs that carry text.**
 * `--rc-surface-raised` goes in next to the page and the card because it is
 * not just "raised card": it is the background of `floatingPanel`, and
 * therefore the real background of the Menu, Select, Combobox, Popover,
 * Tooltip, neutral Toast and chart tooltip. Everything those pieces write is
 * read there and not over the page - the group title of `MenuGroup` in
 * `text-fg-subtle`, the check mark of `SelectItem` and `ComboboxItem` in
 * `text-accent-text`, the neutral badge in `text-fg-muted`. Measuring that
 * text against `--rc-bg` answers the wrong question, and that is how those
 * pairs stayed out of the guard.
 *
 * `--rc-accent-text` over `--rc-surface` is the accent written on the grid
 * surface: the "+N more" of the EventCalendar and today's day number. Both sit
 * on `surface`, not on the page nor on the floating panel - it was the only one
 * of the three backgrounds without a measurement. `--rc-danger-text` over
 * `--rc-surface-raised` is the red to be read inside a floating panel: the
 * danger item of the Menu at rest and the warning icon of the Popconfirm.
 *
 * `bg-overlay` stays out on purpose: no piece writes over the scrim. It is
 * only the dimming behind the Dialog, AlertDialog, Sheet and Command, and
 * their content sits on `surface`, which is already measured.
 * `--rc-fg-disabled` is exempt: disabled text is not covered by the standard.
 *
 * **`CSS_COMPOSED_PAIRS` - the background is alpha and must be composed
 * first.** The Alert paints `<state>-subtle` over the page or the card and
 * writes `<state>-text` on top. Measuring that text against `--rc-bg` answers
 * another question, and lets through the pair the person actually reads.
 * `data-[highlighted]` paints `accent-subtle` over `surface-raised` in the
 * Menu, Select and Combobox, and what is read there is the item text plus the
 * mark of the chosen one; in the danger tone, a highlighted "Excluir" swaps
 * the background for `danger-subtle`. The faint accent is also a text
 * background outside the panel: the chip of the Combobox and TagsInput and the
 * already chosen item of the Command write `text-fg` on it. Today's cell in
 * the EventCalendar month is `selected` over the grid, with the day number in
 * accent on top; the selected table row is alpha over wherever the table sits,
 * and the middle of the Calendar range sits inside the Popover.
 *
 * **`CSS_BOUNDARIES` - what identifies a control and carries no text.**
 * WCAG 1.4.11 asks for 3:1 for the boundary of a field, box, switch and
 * button, and for the focus ring. Up to a point the check measured text and
 * stopped there - and it was exactly in that band that the library failed,
 * with the border at 1.48. The background comes in three times because the
 * same border is drawn over the page, the card and the raised card, and it
 * must pass on all three. The EventCalendar "now" line comes in here too: two
 * pixels crossing the day column, with no text on top. It is a graphical
 * object that must be perceived, and the accent does not serve for that,
 * because lime over white measures 1.15.
 *
 * `border-strong` over `accent-subtle` came in with the `Gantt`, the first
 * piece to draw an `accent-subtle` bar with no text inside: what delimits the
 * task on the timeline is only the border. The four state tones already had
 * the line through the Alert; the accent did not, and it measured 3.19:1 and
 * 3.30:1 over the card, 3.38:1 and 3.27:1 over the page, which is the weekend
 * background painted at day scale. The progress fill is `{tone}-text` over
 * `{tone}-subtle`, and that pair is already measured at 4.5:1 as text.
 *
 * One of the lines measures BACKWARDS, and it is the only one that does:
 * `--rc-surface-raised` over `--rc-accent-text` is the mark INSIDE the fill -
 * the tick of the `Checkbox`, the dash of the indeterminate state, the dot of
 * the `Radio` and the core of the `Slider` thumb. When checked, the box and
 * the circle fill with `accent-text`, and the `Slider` fill is the same lime;
 * what the person reads on top of it is `surface-raised`. No pair measured
 * that: `surface-raised` was only measured as BACKGROUND, and `accent-text`
 * only as foreground, so the only combination where the two touch was exactly
 * the one nobody looked at. The ratio is symmetric, and the number ties with
 * the checked boundary - 5.75:1 in light and 13.91:1 in dark -, but the role
 * is different, and it is for the role that the line exists: without it,
 * nothing in this house says the mark inside the accent has to be readable. A
 * theme that brings `surface-raised` close to the accent delivers a box that
 * is full and empty at the same time, and "full without tick" is
 * indistinguishable from "full with tick" for whoever needs to know whether
 * they checked it.
 *
 * **The last two lines measure a STACK, and they are the only ones that do.**
 * The second member of the line accepts a list, and the list is resolved
 * bottom-up, as on the map side. They exist because the `Slider` track is not
 * a color: `--rc-skeleton` carries alpha in both house themes, and the grey
 * the person sees depends on what is underneath it. Measuring against the raw
 * token would measure a color no pixel has - and on the text side this same
 * question already had an answer, which is `CSS_COMPOSED_PAIRS`; on the 1.4.11
 * side it did not.
 *
 * **`CSS_DISABLED_OVER` - the boundary of a LOCKED control.** The only pair
 * in the house with a ceiling, and not only a floor. An unchecked, disabled
 * control with no label beside it - the DataTable selection column is the
 * real case - has nowhere to get the signal from except its own outline. The
 * locked fill is `surface-raised`, and the theme guide guarantees in writing
 * that it MAY equal `surface`: in the house light theme both are pure white
 * (1.00:1) and in dark they stop at 1.03:1. Since `surface-raised` is also the
 * background of raised cards, menus and tooltips, in there the locked fill
 * ties with its own background at 1.00:1 for any value - raising the token is
 * no way out, only a different paint job. Hence the two measurements. The
 * floor (`MIN_DISABLED`) keeps the outline from vanishing the way
 * `--rc-border` vanishes (1.23:1 measured). The ceiling (`LIVE_OVER_DISABLED`)
 * prevents the opposite defect, which was the previous state: wearing
 * `border-strong` in both states, the locked control was IDENTICAL to the live
 * one, and "no signal at all" is what this pair exists to catch. WCAG 1.4.11
 * exempts inactive components from 3:1, and the token occupies that slack on
 * purpose.
 *
 * **`CSS_CHECKED` - the CHECKED control, in the three pieces that paint it.**
 * The only measurement in the house where the standard's floor was not enough.
 * The `Switch`, the `Checkbox` and the `Radio` write nothing: whoever reads
 * whether they are checked reads the track and the thumb position, the full
 * box with the tick, the full circle with the dot, and nothing else. While the
 * three painted `accent`, checked measured 1.21:1 over the page in the light
 * theme and 1.26:1 over the card - against 3.33:1 for UNCHECKED, which is
 * `border-strong`. That is: it failed 1.4.11 and failed it backwards, with the
 * checked state less visible than the unchecked one. No pair measured that
 * because `accent` was only measured as a TEXT background, and there what
 * carries the contrast is the `accent-fg` on top. Hence the two measurements:
 * the standard's floor over the backgrounds the control sits on, and checked
 * weighing at least as much as unchecked. A theme that passes 3:1 and still
 * leaves checked fainter than unchecked is saying the opposite of what the
 * piece does. The three paint `--rc-accent-text`, not `--rc-accent`, because
 * in the light theme NO light lime reaches 3:1 over white - the ceiling is
 * 1.54:1 at `accent-active`. `accent-text` is the same lime one step darker,
 * already guaranteed at 4.5:1 by the text pairs, and in the dark theme both
 * roles are the same value: dark does not change a pixel.
 *
 * The third background, `--rc-surface-raised`, came in with the box and the
 * circle. The switch sits on the page and the card; the checked box and the
 * checked radio also sit INSIDE the Dialog, Popover, Menu and Sheet, and the
 * real background of all of those is `floatingPanel`. Measured, the checked
 * boundary gives 5.75:1 in light and 13.91:1 in dark, against 3.33:1 and
 * 3.57:1 for unchecked - it passes with room, and that is not why the line
 * exists. It exists because today the only number covering that background is
 * the TEXT pair at 4.5:1, and it covers it by accident: the 1.4.11 intent -
 * identifying a control that writes nothing - was not declared anywhere, and
 * an accident holds no theme. Whoever lightens `accent-text` one step in the
 * next client theme crosses 3:1 and 1.4.11 with nothing flagging it, and the
 * defect returns in the same family of pieces it just left.
 *
 * **The name said `SWITCH`, and started lying within a day.** The pair was
 * born for the track, and the next day it covered three pieces: switch, box
 * and radio, all three fixed with the same role swap. Measured before
 * renaming, the cost was TWO hand-written files - the source
 * `src/lib/contrast.ts` and the count line of `check-contrast-native.ts`, the
 * only place outside it that imported the constant - plus the mirror
 * `native/scripts/contrast.mjs`, which is generated and does not count. No
 * README, no site page and no skill reference cites those names: what the doc
 * says to import from `@rivocode/ui-native/contrast` is `checkThemeMap`,
 * `contrastRatio` and `compose`, and none of the three changed. With that cost
 * in hand the choice was to rename to `CSS_CHECKED` / `CSS_UNCHECKED` /
 * `CSS_CHECKED_OVER` and `MAP_CHECKED` / `MAP_UNCHECKED` / `MAP_CHECKED_OVER`
 * - "checked" is the state ARIA gives all three, not a name invented to fit. A
 * pair name is what the next person reads before deciding whether the pair
 * already covers their piece; `SWITCH` would have sent them to set up a fourth
 * pair that already existed, and the queue of duplicate pairs starts like
 * that.
 *
 * ## The web Slider thumb, and the pair born in the fix commit
 *
 * On 27/08/2026 `skeleton` left the `WITHOUT_PAIR` of `src/lib/contrast.ts`,
 * because the NATIVE `Slider` thumb got a pair: `fg` over `skeleton` and
 * `border-strong` over `skeleton`, over the page and over the card, at the
 * 1.4.11 3:1. That day none of it went into `CSS_BOUNDARIES`, and it was not
 * forgetfulness - setting up the line before the piece changed would have left
 * the gate red for something no theme solves. The number stayed written here
 * with a date, and the agreement was that the pair would be born in the same
 * commit in which the piece changed. The piece changed, and this is the
 * commit.
 *
 * The track is the same `bg-skeleton` in both packages. The thumb is not:
 * there it is `bg-fg` with `border-border-strong`, and here it was
 * `border-accent bg-surface`. Copying the native pair into this table would
 * measure two roles that in this half of the house never touch - the web
 * `Slider` paints `fg` nowhere on the control -, and a pair that measures what
 * the piece does not paint is the fastest way to leave the gate green over
 * nothing.
 *
 * **Measuring what the piece painted, the thumb did not reach 3:1 anywhere in
 * the light theme.** Over the track, the `bg-surface` core gave 1.23:1 on the
 * page and 1.18:1 on the card, and the `border-accent` border gave 1.03:1 and
 * 1.06:1. Off the track - the circle is 16px and the track 6px, so it sticks
 * out five pixels above and five below - the border over the page gave 1.21:1
 * and 1.26:1, and the core was white on white, 1.04:1 and 1.00:1. The
 * `bg-accent` fill itself over the track gave 1.03:1 and 1.06:1, that is: in
 * light not even "how far it has gone" read by color, because the full track
 * and the empty one had the same weight. In dark everything passed with room -
 * the border over the track gave 12.98:1 and 11.50:1 -, so it was a
 * light-only defect.
 *
 * It is the family the table above already knows: lime over white measures
 * 1.15, and the ceiling of any light lime over white is 1.54:1 at
 * `accent-active`. No theme fixes that, because the defect is not in the theme
 * but in the role the thumb wore - and the fix is the same one the switch, box
 * and radio got, in two swaps: the accent becomes `accent-text`, and the thumb
 * core becomes `surface-raised`. Measured afterwards, in light the border and
 * the fill give 4.69:1 over the track on the page and 4.87:1 on the card, the
 * border over the page goes up from 1.21:1 to 5.55:1 and from 1.26:1 to
 * 5.75:1, and the core inside the fill gives 5.75:1. In dark `accent-text` and
 * `accent` are the SAME value: 12.98:1 and 11.50:1, the numbers from before,
 * and dark does not change a pixel.
 *
 * **The thumb border and the fill are the same color, and that is a choice.**
 * Wearing `border-strong` on the thumb would separate the two - the border
 * would give 3.19:1 and 3.22:1 over the track -, but it would drop to 1.90:1
 * over the fill itself, and the outline would get lost precisely on the FULL
 * half of the track, which is the side the thumb always touches. With
 * `accent-text` on both, what separates the thumb from the fill is the CORE,
 * and it is measured: `surface-raised` over `accent-text`, 5.75:1 in light and
 * 13.91:1 in dark. The arc of the circle still sticks out five pixels off the
 * track, so the outline also keeps reading against the page.
 *
 * **The two new lines, and what is lost on screen if each one drops.**
 * `--rc-accent-text` over `--rc-skeleton` on `--rc-bg` and on `--rc-surface`
 * measure TWO things with the same number, because the thumb border and the
 * fill wear the same role: if they drop, the full track ties with the empty
 * one - the person no longer knows how far it has gone - and the thumb outline
 * dissolves into the track, which is the defect measured above coming back
 * whole. The third measurement the piece needs is `--rc-surface-raised` over
 * `--rc-accent-text`, and it already existed for the `Checkbox` tick: now it
 * also carries the thumb core, and if it drops the thumb becomes a blotch the
 * color of the fill and the person loses WHERE it is. There is no repeated
 * line for that, because a duplicate pair does not measure twice - it only
 * prints twice.
 *
 * The thumb OFF the track already had coverage, and that is why it did not
 * become a line here: `CSS_CHECKED` measures `accent-text` over the three
 * backgrounds at 3:1, which is the thumb border over the page and over the
 * card. And the thumb core over the EMPTY track is not a pair, and not by
 * carelessness: white over light grey gives 1.23:1 and 1.18:1, and no theme
 * fixes that without darkening the core. What delimits the thumb there is the
 * border, exactly as in the UNCHECKED `Checkbox` box, where also only the
 * border is measured.
 *
 * ## The bar that carries the value alone
 *
 * On 28/08/2026 the `Meter`, the `Progress` and the `Tracker` still painted
 * the full bar with `bg-accent` over the `bg-skeleton` track. In the light
 * theme that gives 1.03:1 over the page, 1.06:1 on the card and 1.06:1 on the
 * floating panel - the same family of numbers as the `Slider` thumb, and for
 * the same reason: no light lime reaches 3:1 over white. With `showValue` off,
 * which is the default, the bar is the ONLY carrier of the value, and a quota
 * at 72% reads as an empty quota. In dark it passed with room, at 12.98:1, so
 * it was a light-only defect.
 *
 * The guard stayed GREEN over that, and not for lack of a line: the two lines
 * of `--rc-accent-text` over `--rc-skeleton` already existed, and measured the
 * role the `Slider` had just put on in the previous commit. The raw `accent`
 * over the track, which was the role of the other three pieces, had no pair at
 * all. A pair that measures the already fixed token does not catch the piece
 * left behind, and the whole family looked covered because the pair's NAME
 * reminded one of the right piece.
 *
 * The fix is the same swap the switch, box, radio and `Slider` got: `accent`
 * becomes `accent-text`. Measured afterwards, the bar gives 4.69:1 over the
 * track on the page and 4.87:1 on the card and the panel; in dark both roles
 * are the same value, and the dark theme does not change a pixel. The third
 * background came in along because it was missing: a meter inside a Dialog,
 * Popover, Menu or Sheet sits on `surface-raised`, and nobody measured there.
 *
 * The `Tracker` came in by another path through the same door. It does not
 * fill a track: it paints one segment per period, and the neutral period is
 * `bg-skeleton` itself. An accent square next to a neutral square is exactly
 * the pair above - 1.03:1 in light -, so the `accent` tone was
 * indistinguishable from "nothing happened", while `success`, `warning` and
 * `danger` measured from 4.24:1 to 4.84:1 in the same place.
 *
 * The STILL indeterminate bar changed too. Whoever asks for reduced motion
 * gets a `repeating-linear-gradient` instead of the animation, and the stripes
 * wore `accent` and `accent-hover`: light thread over light thread, inside a
 * bar that already did not read. Now they are `accent-text` and
 * `accent-active`, which separate the stripes at 3.73:1 in light and 1.23:1 in
 * dark - above the 1.13:1 the old pair gave there.
 *
 * ## Which colors the math can read, and why those
 *
 * Until 27/08/2026 it read sRGB and nothing else: 6- and 8-digit hexadecimal,
 * `rgb()` and `rgba()`. The cost was written out loud and never collected -
 * the Tailwind 4 palette is written in `oklch()`, so whoever dressed a client
 * by copying colors from there, which is the most common path there is, heard
 * **"no measurement"** instead of a number. The theme did not go green by
 * accident, which is good, but the door was closed to the standard modern
 * syntax, and the native theme generator refused before measuring.
 *
 * Now it reads, and converts to sRGB before measuring:
 *
 * - 3-, 4-, 6- and 8-digit hexadecimal;
 * - `rgb()` and `rgba()`, in both alpha syntaxes, with number or percentage;
 * - `hsl()`, `hsla()` and `hwb()`, with angle in `deg`, `rad`, `grad` or
 *   `turn`;
 * - `lab()` and `lch()`, which are CIE Lab with a D50 white - the path goes
 *   through XYZ D50, Bradford adaptation to D65, and from there to linear sRGB;
 * - `oklab()` and `oklch()`, which go through OKLab, LMS, XYZ D65, linear sRGB
 *   and the gamma curve, each step with the specification's own constant;
 * - `color()` in the CSS predefined spaces: `srgb`, `srgb-linear`,
 *   `display-p3`, `a98-rgb`, `prophoto-rgb`, `rec2020`, `xyz`, `xyz-d65` and
 *   `xyz-d50`.
 *
 * Two things remain unmeasured, and neither for lack of conversion.
 * `color-mix()` is not a color: it is a computation whose result depends on
 * the interpolation space, the hue method, how much is left of each side and
 * whatever is nested inside it. A CSS color name - `rebeccapurple` - would
 * require the whole name table inside the package, to serve a case no client
 * theme uses. Both fail, and the message says which of the two it is.
 *
 * ## The matrices were proven against the browser, not against themselves
 *
 * Color space math fails silently: a swapped constant returns a plausible
 * color, and the ratio comes out pretty. So the source of truth is not this
 * repository. Each value was painted on a one-pixel canvas in a headless
 * Chrome and read back with `getImageData`, which is the browser's own
 * conversion. That was 328 colors - the 284 `oklch()` forms of the Tailwind 4
 * palette plus 44 written by hand, one per family and per alpha syntax: 315
 * equal to the browser's pixel, 13 off by 1 in 255 from rounding, none beyond
 * that. `getComputedStyle` is no proof here: Chrome returns `oklch(...)`
 * untouched, not the resolved color.
 *
 * The first round caught the defect the proof exists to catch. `rec2020` came
 * out with 42 in 255 of error on the red channel, because of a wrong
 * denominator in one of the nine fractions of the matrix. What settled the
 * doubt was the check any RGB space matrix has to obey: applied to `1 1 1` it
 * returns the space's white. Those of `display-p3`, `a98-rgb` and `rec2020`
 * must give D65, and that of `prophoto-rgb` D50 - the wrong one gave `0.879`
 * where D65 has `1.089`. The table of 26 colors with the browser's pixel was
 * frozen in `test/consumer-contrast.test.ts`.
 *
 * ## Gamut: the math measures the pixel the screen shows, and says it clipped
 *
 * `oklch()` describes colors sRGB cannot reach, and that is not a corner case:
 * **82 of the 286 named colors of the Tailwind 4 palette - 29% - fall
 * outside**, in all seventeen chromatic families, and `red-500` and `blue-500`
 * are in that band. Refusing would be the easiest way out and would say less:
 * it would close the door precisely to the most copied colors there are, which
 * is the pain this work exists to solve.
 *
 * So the math clips channel by channel and measures the clipped value. It is
 * not a matter of taste, it is what the screen does: measured against Chrome,
 * clipping per channel reproduces the browser's pixel in 79 of the 82 palette
 * colors, and the other three within 1 in 255. Chroma reduction preserving hue
 * - the specification's algorithm - is off by up to 123 in 255 against the
 * same browser, because whoever rasterizes does not run that algorithm.
 * Measuring the clipped value is measuring what the person sees.
 *
 * Clipping without saying would be something else, and that is why both
 * guards emit a `nota` line naming each out-of-gamut role and the value it was
 * measured at. The note does not fail - the number is real -, and it only
 * appears when there is something to say, so the output for the house themes,
 * which are hexadecimal, does not change a character.
 *
 * ## Alpha in the new spaces
 *
 * TWELVE of the 45 roles carry alpha, and that is where the consumer's copy
 * aged silently. `oklch(0.7 0.15 145 / 0.4)` composes along the same path as
 * `rgb(r g b / 0.4)`, `rgba(r,g,b,0.4)` and the eight-digit form: the color
 * becomes sRGB first, and composition stays `alpha * color + (1 - alpha) *
 * background` per channel. A percentage instead of the number - `/ 40%` -
 * lands on the same pixel.
 *
 * **`CSS_SERIES` - chart series color.** It carries no text, so it does not
 * fall under the 4.5:1 rule. The standard asks for 3:1 for a graphical object
 * that must be perceived, and that is what applies here: a chart line that
 * vanishes into the background is not legible any other way.
 *
 * ## The Banner strip, and the three pairs it premiered
 *
 * The `Banner` paints `<state>-subtle` across the full width and writes the
 * description in `fg` on top - the `Alert` writes in `fg-muted` and nobody
 * measured either of the two over the tone. The eight pairs of `fg` over
 * `<state>-subtle`, on `bg` and on `surface`, go into `CSS_COMPOSED_PAIRS` at
 * 7:1, because it is body text. Measured that day: the worst is 12.13:1, in
 * dark.
 *
 * The strip's actions are a secondary `Button`, and its boundary is
 * `border-strong` over the composed tone. That number is tight - 3.19:1 on
 * danger in light, 3.30:1 on success in dark over the card -, and that is why
 * it is a line: a client theme that darkens `<state>-subtle` one step makes the
 * strip's button lose its border with nothing flagging it. The close X focus
 * ring sits on the same background, without `ring-offset`, and comes in
 * along. The native map side got the same `fg`, and `border-strong` only over
 * `bg`: on the phone the strip is the top of the screen, and over `surface` the
 * minimal 8-seed palette of `rivocode-ui-native-theme` gave 3.00:1 rounded on
 * success in dark - below 3 - and the generator stopped approving its own
 * theme. The ring does not exist there.
 *
 * ## The machine-read code, and the pair that is not a theme pair
 *
 * The `QRCode` and the `PixCode` were born painting the module in `fg` and the
 * background in `surface`. In the dark theme that gives a LIGHT module over a
 * DARK background - the inverted reflection. ISO/IEC 18004 allows it, the
 * system camera reads it, and a share of the readers and banking apps do not:
 * for Pix, that is a payment that does not happen, and no screenshot shows the
 * failure. All the pairs above passed, because `fg` over `surface` measures
 * 16:1 in both themes - and the contrast math is SYMMETRIC, so it would never
 * see the inversion.
 *
 * Hence the `--rc-code-ink` / `--rc-code-paper` pair, and hence its two
 * differences from everything else in this table:
 *
 * - **It is not a theme role.** It lives in `src/tokens/scales.css`, in
 *   `:root`, with the same value for the whole house, and not in
 *   `THEME_ROLES`: `check-theme` does not demand it, the native theme
 *   generator does not derive it, and a client theme cannot invert the QR
 *   without WRITING its name. A mandatory role would have forced each client
 *   to declare two colors whose only right answer is "black and white", and
 *   opened the door to the error the pair exists to close.
 * - **It measures POLARITY, not just the ratio.** `checkCodePair` requires the
 *   ink darker than the paper, beyond the minimum. Without that, swapping the
 *   two values would pass with the same 19.47:1.
 *
 * The minimum is `MIN_CODE`, 15:1, not the 7:1 of body text. The reading
 * standard grades the symbol by REFLECTANCE difference, and grade A asks for
 * 70% - with white paper, ink up to 30%, which as a WCAG ratio gives only 3:1.
 * Except the camera that reads Pix does not read printed paper under desk
 * light: it reads a screen photographed by another one, with low brightness,
 * glare and moire, and each of those eats contrast before the binarizer. 15:1
 * leaves room for that and still accepts a brand "almost black"; the house
 * measures 19.47:1.
 *
 * A house theme that declares the pair is an error here: the value is a
 * single one, and two sources for it is how a dark theme goes back to
 * inverting the code without anyone seeing.
 *
 * ## The media stage, the second set that is not a theme set
 *
 * The full-screen `ImageViewer` painted the background in `bg`: in the light
 * theme the photo came out over almost-white paper, with the controls in
 * `surface`. Phone galleries, Google Photos and library lightboxes open the
 * photo on a DARK stage in both schemes, because a light background fights
 * the image and blows out the brightness around it. The `--rc-media-*` live in
 * `scales.css` for the same reason as the code pair: if they were theme roles,
 * a light client theme would lighten the stage unintentionally, and every
 * client would have to declare six colors whose only right answer is "dark".
 * The discarded alternative was dressing the layer with
 * `data-rc-theme="rivocode-dark"`: it swaps the client's accent and font for
 * the house's and depends on the consumer having loaded the RivoCode dark
 * theme CSS, which whoever wears only their own theme does not load.
 *
 * `checkMediaStage` demands that the stage be dark (at most 1.2:1 over black),
 * the text pairs at 4.5 and the icon and outline pairs at 3, all light over
 * dark, and the inactive control visible and fainter than the live one.
 *
 * ## The four new charts, and the pair the meter knocked down on day one
 *
 * **`CSS_TINTED_PAIRS` - text over a series TINT.** The `ChartTreemap` writes
 * the category name and value in `fg` over its own color at 30%
 * (`CHART_TINT`), composed over the page or the card. No table knew how to
 * measure that: `CSS_COMPOSED_PAIRS` asks for a token that ALREADY carries
 * alpha, and `--rc-chart-N` is opaque - the alpha belongs to the piece. The
 * line carries the alpha along, and the number has to be the same the piece
 * paints: `test/new-charts.test.tsx` checks `CHART_TINT` against the
 * `TREEMAP_TINT` of `src/shared/chart-layout.ts`, because the file from here
 * travels in `dist/cli.js` and in the native mirror and cannot import the
 * piece. Measured that day: the worst is 6.77:1, `chart-1` in dark, over the
 * card. Why `fg` over tint, and not light text over the full color: the full
 * color asks for `surface` on top in light and in dark, and there light
 * `chart-1` gives 4.10:1 - below 4.5 - with no theme to fix it.
 *
 * The `ChartHeatmap` does NOT write inside the cell, and that is why its scale
 * has no text pair: in a 7 by 24 grid the cell is twenty-some pixels, and the
 * number lives in the tooltip and in the hidden table. The strongest step is
 * the full series color, already covered by `CSS_SERIES` at 3:1; the EMPTY
 * cell is told apart from zero by the dashed border in `border-strong`, which
 * was already measured too.
 *
 * **The `ChartGauge` arc over the track.** The value arc is drawn ON TOP of
 * the `--rc-skeleton` track, at the same thickness, and the first version
 * painted `success`, `warning` and `danger`. The new line caught it on day
 * one: dark `--rc-danger` over the track on the card gave 2.99:1, against the
 * 1.4.11 3 - the critical band, precisely the one that needs to be seen, was
 * the only one that vanished. The fix is the swap the `Meter` had already got:
 * the gauge paints the `-text` roles, which the text pair already guaranteed
 * at 4.5:1 over the three backgrounds. Measured afterwards, the worst is
 * 4.47:1, light `success-text` over the track on the page.
 *
 * ## The signature paper, the third
 *
 * The `SignaturePad` exports what the person drew to a contract, a receipt, a
 * PDF. If the ink were `fg` and the paper `surface`, a signature made in the
 * dark theme would come out LIGHT - and over the document's white sheet it
 * vanishes. By the same symmetric math as the code, no theme pair would see
 * that. The `--rc-signature-*` live in `scales.css`: dark ink and guide over
 * light paper in both themes, measured with polarity (`checkSignaturePaper`),
 * and the inactive guide visible and fainter than the live one.
 */
import {
  CSS_CODE,
  CSS_MEDIA,
  CSS_SIGNATURE,
  checkCodePair,
  checkMediaStage,
  checkSignaturePaper,
  checkThemeCss,
  readTokens,
} from "../src/lib/contrast";
import { countAtLeast, scanAtLeast } from "./scan";

const palette = await Bun.file("src/tokens/palette.css").text();
const files = await scanAtLeast("src/tokens/themes/*.css", 2);
let failed = 0;
let measured = 0;

for (const file of files) {
  const tokens = readTokens(palette + "\n" + (await Bun.file(file).text()));
  // Not every file in the themes folder is a theme: the fonts one, for
  // example, only brings @import. A real theme always declares the background.
  if (!tokens["--rc-bg"]) continue;
  measured += 1;

  for (const finding of checkThemeCss(file, tokens)) {
    if (!finding.ok) failed++;
    console.log(finding.line);
  }
}

const fixed = readTokens(palette + "\n" + (await Bun.file("src/tokens/scales.css").text()));
for (const finding of checkCodePair(
  "src/tokens/scales.css",
  fixed[CSS_CODE.ink],
  fixed[CSS_CODE.paper],
)) {
  if (!finding.ok) failed++;
  console.log(finding.line);
}

const media = Object.fromEntries(
  Object.entries(CSS_MEDIA).map(([role, token]) => [role, fixed[token]]),
);
for (const finding of checkMediaStage("src/tokens/scales.css: media stage", media)) {
  if (!finding.ok) failed++;
  console.log(finding.line);
}

const signature = Object.fromEntries(
  Object.entries(CSS_SIGNATURE).map(([role, token]) => [role, fixed[token]]),
);
for (const finding of checkSignaturePaper("src/tokens/scales.css: signature paper", signature)) {
  if (!finding.ok) failed++;
  console.log(finding.line);
}

for (const file of files) {
  const css = await Bun.file(file).text();
  const declared = Object.values(CSS_CODE).filter((role) => css.includes(`${role}:`));
  if (declared.length > 0) {
    failed++;
    console.error(
      `\n${file} declares ${declared.join(" and ")}.\n` +
        "    The machine-read code pair has a single value, in src/tokens/scales.css,\n" +
        "    and is not a theme role: that is how the QR stays dark over light in the\n" +
        "    dark theme. Delete the declaration from the theme.",
    );
  }
  const stage = Object.values(CSS_MEDIA).filter((role) => css.includes(`${role}:`));
  if (stage.length > 0) {
    failed++;
    console.error(
      `\n${file} declares ${stage.join(", ")}.\n` +
        "    The media stage has a single value, in src/tokens/scales.css, and is not a\n" +
        "    theme role: that is how the full-screen photo stays on a dark stage in the\n" +
        "    light theme and in every client theme. Delete the declaration from the theme.",
    );
  }
  const paper = Object.values(CSS_SIGNATURE).filter((role) => css.includes(`${role}:`));
  if (paper.length > 0) {
    failed++;
    console.error(
      `\n${file} declares ${paper.join(", ")}.\n` +
        "    The signature paper has a single value, in src/tokens/scales.css, and is not\n" +
        "    a theme role: that is how the exported signature stays dark over light in\n" +
        "    the dark theme. Delete the declaration from the theme.",
    );
  }
}

if (failed > 0) {
  console.error(`\n${failed} pair(s) below the minimum.`);
  process.exit(1);
}

countAtLeast("theme with `--rc-bg` declared in `src/tokens/themes/`", measured, 2);

console.log(`\nContrast ok in the ${measured} themes of src/tokens/themes/.`);
