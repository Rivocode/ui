import { expect, test } from "bun:test";

import { compose, contrastRatio, readTokens } from "../src/lib/contrast";

const read = (p: string) => Bun.file(p).text();

/** The layers every theme inherits: palette, scale and shape. */
const base = async () =>
  [
    await read("src/tokens/palette.css"),
    await read("src/tokens/scales.css"),
    await read("src/tokens/forma.css"),
  ].join("\n");

test("every token the contract references exists in both themes", async () => {
  const contract = await read("src/tokens/contract.css");
  const referenced = [...contract.matchAll(/var\((--rc-[\w-]+)\)/g)].map((m) => m[1]!);
  expect(referenced.length).toBeGreaterThan(20);

  const shared = await base();
  const dark = readTokens(shared + (await read("src/tokens/themes/rivocode-dark.css")));
  const light = readTokens(shared + (await read("src/tokens/themes/rivocode-light.css")));

  const missing = referenced.filter((t) => !dark[t] || !light[t]);
  expect(missing).toEqual([]);
});

test("no component reads from the raw palette", async () => {
  const { Glob } = await import("bun");
  const files = await Array.fromAsync(
    new Glob("src/{components,provider}/**/*.{ts,tsx}").scan("."),
  );
  expect(files.length).toBeGreaterThan(70);

  for (const file of files) {
    expect(await Bun.file(file).text()).not.toContain("--rc-p-");
  }
});

test("compact density shrinks every control", async () => {
  const scales = readTokens(await read("src/tokens/scales.css"));
  expect(scales["--rc-control-md"]).toBeDefined();
});

test("the light theme accent passes as text, and the raw lime would not", async () => {
  const shared = await base();
  const light = readTokens(shared + (await read("src/tokens/themes/rivocode-light.css")));
  expect(contrastRatio(light["--rc-accent-text"]!, light["--rc-bg"]!)).toBeGreaterThan(4.5);
  expect(contrastRatio("#d4f34a", light["--rc-bg"]!)).toBeLessThan(2);
});

test("compact density reaches panel, list item, box and day", async () => {
  const scales = await Bun.file("src/tokens/scales.css").text();
  const compact = scales.slice(scales.indexOf('[data-rc-density="compact"]'));

  for (const token of ["--rc-pad-panel", "--rc-item-y", "--rc-box", "--rc-day"]) {
    expect(compact).toContain(token);
  }
});

test("no catalog component uses a fixed pixel control size", async () => {
  const { Glob } = await import("bun");
  const suspects: string[] = [];
  const files = await Array.fromAsync(new Glob("src/components/*.tsx").scan("."));
  expect(files.length).toBeGreaterThan(70);

  for (const path of files) {
    const source = await Bun.file(path).text();
    // Control height, checkbox side and panel padding must come from a token.
    // A loose pixel here is density that never arrives.
    if (/size-\[(1[6-9]|2\d)px\]|h-\[(3[0-9]|4[0-8])px\]/.test(source)) {
      suspects.push(path);
    }
  }

  expect(suspects).toEqual([]);
});

test("the alert reads on its own alert background, and not only on the page", async () => {
  // The Alert paints <state>-subtle over the page and writes <state>-text on
  // top. That is the pair the person reads, and not the text against --rc-bg:
  // without compositing the alpha before measuring, the light theme passed at 4.39.
  const shared = await base();

  for (const theme of ["rivocode-light", "rivocode-dark"]) {
    const t = readTokens(shared + (await read(`src/tokens/themes/${theme}.css`)));
    for (const state of ["info", "success", "warning", "danger"]) {
      const background = compose(t[`--rc-${state}-subtle`]!, t["--rc-bg"]!);
      const ratio = contrastRatio(t[`--rc-${state}-text`]!, background);
      expect(`${theme} ${state} ${ratio >= 4.5}`).toBe(`${theme} ${state} true`);
    }
  }
});

test("the control boundary reaches the 3:1 the standard requires", async () => {
  // WCAG 1.4.11: what identifies a control needs 3:1 against what is behind
  // it. Here the alpha is composited before measuring, otherwise the math is
  // about a color nobody sees.
  const shared = await base();

  for (const theme of ["rivocode-light", "rivocode-dark"]) {
    const t = readTokens(shared + (await read(`src/tokens/themes/${theme}.css`)));
    for (const over of ["--rc-bg", "--rc-surface", "--rc-surface-raised"]) {
      const background = t[over]!;
      const border = compose(t["--rc-border-strong"]!, background);
      const ratio = contrastRatio(border, background);
      expect(`${theme} ${over} ${ratio >= 3}`).toBe(`${theme} ${over} true`);
    }

    // Hover must stay stronger than rest, otherwise the response to the mouse
    // disappears too.
    const atRest = contrastRatio(
      compose(t["--rc-border-strong"]!, t["--rc-surface"]!),
      t["--rc-surface"]!,
    );
    const hover = contrastRatio(
      compose(t["--rc-line-hover"]!, t["--rc-surface"]!),
      t["--rc-surface"]!,
    );
    expect(`${theme} hover>atRest ${hover > atRest}`).toBe(`${theme} hover>atRest true`);
  }
});

test("the focus ring also reaches 3:1, on both backgrounds", async () => {
  const shared = await base();

  for (const theme of ["rivocode-light", "rivocode-dark"]) {
    const t = readTokens(shared + (await read(`src/tokens/themes/${theme}.css`)));
    for (const over of ["--rc-bg", "--rc-surface"]) {
      const ratio = contrastRatio(compose(t["--rc-ring"]!, t[over]!), t[over]!);
      expect(`${theme} ${over} ${ratio >= 3}`).toBe(`${theme} ${over} true`);
    }
  }
});

test("shape, motion and font live outside the scale, where the theme reaches", async () => {
  // Square corners, crisp motion and spaced labels are the three visual
  // signals that change most between one brand and another, and they were on
  // the wrong side of the boundary: inside the global scale, together with
  // density - which is something else and has its own owner.
  const shape = await read("src/tokens/forma.css");
  const scales = await read("src/tokens/scales.css");

  for (const token of [
    "--rc-radius-sm",
    "--rc-radius-md",
    "--rc-radius-lg",
    "--rc-radius-xl",
    "--rc-radius-pill",
    "--rc-duration-fast",
    "--rc-duration-base",
    "--rc-ease",
    "--rc-tracking-display",
  ]) {
    expect(`${token} in forma.css: ${shape.includes(`${token}:`)}`).toBe(
      `${token} in forma.css: true`,
    );
    expect(`${token} outside scales.css: ${!scales.includes(`${token}:`)}`).toBe(
      `${token} outside scales.css: true`,
    );
  }

  const families = ["--rc-font-sans", "--rc-font-display", "--rc-font-mono"];

  for (const token of families) {
    expect(`${token} outside scales.css: ${!scales.includes(`${token}:`)}`).toBe(
      `${token} outside scales.css: true`,
    );
  }

  for (const theme of ["rivocode-light", "rivocode-dark"]) {
    const css = await read(`src/tokens/themes/${theme}.css`);
    for (const token of families) {
      expect(`${theme} declares ${token}: ${css.includes(`${token}:`)}`).toBe(
        `${theme} declares ${token}: true`,
      );
    }
  }
});

test("the preset imports shape before the themes, otherwise the theme does not win", async () => {
  // :root and [data-rc-theme="x"] have the same specificity, so file order
  // decides. Importing shape after the theme would make the house default
  // erase the client's choice, silently.
  const preset = await read("src/preset.css");
  const shapeAt = preset.indexOf("tokens/forma.css");
  const themeAt = preset.indexOf("tokens/themes/rivocode-dark.css");

  expect(shapeAt).toBeGreaterThan(-1);
  expect(shapeAt).toBeLessThan(themeAt);
});

test("density still belongs to density, and not to the theme", async () => {
  // The opposite of the one above: control height and padding stay in the
  // scale file, because data-rc-density is what decides them.
  const scales = await read("src/tokens/scales.css");

  expect(scales).toContain("--rc-control-md:");
  expect(scales).toContain("--rc-pad-panel:");
});

test("no native component reads the theme directly, bypassing the context", async () => {
  // A component that paints outside the class - the Switch track, the Button
  // spinner - must read `colors` from the context. Reading `tokens.themes[...]`
  // it always gets the house theme, and the client's screen comes out with half
  // their colors and half RivoCode's lime. The provider is the only exception:
  // it is what resolves which theme applies.
  const { Glob } = await import("bun");
  const offenders: string[] = [];
  const files = await Array.fromAsync(new Glob("native/src/**/*.{ts,tsx}").scan("."));
  expect(files.length).toBeGreaterThan(60);

  for (const file of files) {
    if (file.endsWith("provider.tsx")) continue;
    const code = await Bun.file(file).text();
    if (/tokens\.themes\[/.test(code)) offenders.push(file);
  }

  expect(offenders).toEqual([]);
});

test("the optional finish starts neutral in both house themes", async () => {
  // Accent gradient, accent glow and overlay glass are roles the theme may
  // fill, and both house themes leave them empty. Empty here is `none`, and not
  // the absence of a value: `--rc-accent-image: ;` is a legal CSS declaration,
  // but substitution produces `background-image: ;`, which is invalid at
  // computed-value time - the declaration still wins the cascade and falls to
  // `unset`. For background-image that gives `none` by luck, since it is not
  // inherited; on an inherited role the same spelling would bring the parent's
  // value. `none` says the same thing and says it out loud.
  //
  // The three must also exist in BOTH themes: CSS variables inherit, so a
  // `scope="local"` with the house theme inside the tree of a client that paints
  // a gradient would inherit their gradient if the house did not reset it.
  const finish = ["--rc-accent-image", "--rc-accent-shadow", "--rc-overlay-filter"];

  for (const theme of ["rivocode-light", "rivocode-dark"]) {
    const css = await read(`src/tokens/themes/${theme}.css`);
    for (const role of finish) {
      expect(`${theme} ${role} neutral: ${css.includes(`${role}: none;`)}`).toBe(
        `${theme} ${role} neutral: true`,
      );
    }
  }
});

test("the contract composes the finish over the role, without stealing the utility", async () => {
  // The composition lives in the contract layer because that is what
  // translates role into class. Two things keep it harmless, and both are
  // tested here:
  //
  // `@layer utilities` - a rule outside any layer beats ANY layer, so a loose
  // `background-image` would knock down even the `bg-linear-to-r` of someone
  // who wanted their own gradient.
  //
  // `:where()` - zero specificity, so within the same layer any class utility
  // (0,1,0) wins. The theme proposes the finish; the class of whoever writes
  // the screen undoes it.
  const contract = await read("src/tokens/contract.css");

  expect(contract).toContain("@layer utilities {");
  for (const rule of [":where(.bg-accent", ":where(.bg-overlay)"]) {
    expect(`${rule} in :where: ${contract.includes(rule)}`).toBe(`${rule} in :where: true`);
  }

  for (const role of ["--rc-accent-image", "--rc-accent-shadow", "--rc-overlay-filter"]) {
    // Fallback in the var() itself: a client theme that ignores the three
    // needs to declare nothing, and the effect simply does not happen.
    expect(`${role} with fallback: ${contract.includes(`var(${role}, none)`)}`).toBe(
      `${role} with fallback: true`,
    );
  }
});

test("the accent finish does not paint the disabled button", async () => {
  // The Button neutralizes the disabled primary on purpose - faded lime looks
  // like a defect - but it does so by swapping background-COLOR. A gradient
  // painted over `.bg-accent` would survive that swap and the disabled state
  // would wear the brand again. `data-loading` stays out of the exception for
  // the same reason it does in the Button: loading also disables, and there the
  // color must remain the action's.
  const contract = await read("src/tokens/contract.css");
  const rule = contract.slice(contract.indexOf(":where(.bg-accent"));

  expect(rule.slice(0, rule.indexOf(")) {") + 4)).toContain(":disabled:not([data-loading])");
});
