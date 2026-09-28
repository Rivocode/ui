export type RoleBreak = {
  role: string;
  silent: boolean;
  effect: string;
  version?: string;
  note?: string;
  meant?: string;
};

export type ThemeReport = {
  selector: string;
  files: string[];
  declared: number;
  required: number;
  missing: RoleBreak[];
  unknown: string[];
};

export const OPTIONAL: Record<string, string> = {
  "--rc-accent-image":
    "finish: the accent as a gradient. Absent, the primary button stays flat, which is how the two house themes are born.",
  "--rc-accent-shadow":
    "finish: the accent glow. Absent, the primary does not light up by itself, and no piece asks it to.",
  "--rc-overlay-filter":
    "finish: the frosted glass behind the dialog, the sheet and the palette. Absent, the scrim is just color, which is the default.",
};

export const ARRIVED: Record<string, { version: string; note: string }> = {
  "--rc-font-sans": {
    version: "0.7.0",
    note: "the three families left `src/tokens/scales.css`, which is a global layer, and moved inside the theme selector. A theme written for 0.6.x compiles, builds and renders with no family at all.",
  },
  "--rc-font-display": {
    version: "0.7.0",
    note: "left the global layer together with `--rc-font-sans` and `--rc-font-mono`. A theme written before it declares none of the three.",
  },
  "--rc-font-mono": {
    version: "0.7.0",
    note: "left the global layer together with `--rc-font-sans` and `--rc-font-display`. A theme written before it declares none of the three.",
  },
  "--rc-border-disabled": {
    version: "0.7.0",
    note: "was born so the locked control has a visual cue where `--rc-surface` and `--rc-surface-raised` are the same color. A theme written before it does not have it.",
  },
};

const EFFECTS: Array<{ role: RegExp; silent: boolean; effect: string }> = [
  {
    role: /^--rc-bg$/,
    silent: false,
    effect:
      "The page loses its own background and the browser white shows through, with the theme's light text on top of it.",
  },
  {
    role: /^--rc-surface$/,
    silent: false,
    effect:
      "Card, panel and field lose their body: they merge into the page background, and the screen becomes a single block.",
  },
  {
    role: /^--rc-surface-raised$/,
    silent: false,
    effect:
      "Menu, tooltip and table header stop standing out from the rest: the floating layer takes the color of whatever is under it.",
  },
  {
    role: /^--rc-overlay$/,
    silent: false,
    effect:
      "Dialog, sheet and palette open without a scrim: the page behind stays sharp, and nothing shows that it is locked.",
  },
  {
    role: /^--rc-fg$/,
    silent: false,
    effect:
      "The main text loses the theme color and inherits the one above it; in a dark theme it comes out black on black.",
  },
  {
    role: /^--rc-fg-muted$/,
    silent: true,
    effect:
      "Supporting text comes out in the main text color, and the page hierarchy disappears without anything looking broken.",
  },
  {
    role: /^--rc-fg-subtle$/,
    silent: true,
    effect:
      "Label, caption and column header rise to the main text color and start competing with it.",
  },
  {
    role: /^--rc-fg-disabled$/,
    silent: true,
    effect:
      "The text of a disabled control looks the same as that of a control that still responds, and the person clicks what does not respond.",
  },
  {
    role: /^--rc-accent$/,
    silent: false,
    effect:
      "The primary button comes out without a fill: the main action of the screen becomes a transparent rectangle.",
  },
  {
    role: /^--rc-accent-hover$/,
    silent: true,
    effect:
      "The primary stops reacting to the pointer. A screenshot shows nothing, and only live does the screen feel dead.",
  },
  {
    role: /^--rc-accent-active$/,
    silent: true,
    effect:
      "The moment of the click is gone: the button does not change when pressed, and the person clicks twice for not knowing whether it took.",
  },
  {
    role: /^--rc-accent-fg$/,
    silent: false,
    effect:
      "What is read on the accent inherits the page text color and vanishes into the brand color.",
  },
  {
    role: /^--rc-accent-text$/,
    silent: true,
    effect:
      "Link and active item come out in the plain text color: what is selected can no longer be seen, and the navigation looks frozen.",
  },
  {
    role: /^--rc-accent-subtle$/,
    silent: true,
    effect:
      "The menu item under the pointer and the checked item lose their background, and the menu stops showing where the person is.",
  },
  {
    role: /^--rc-selected$/,
    silent: true,
    effect:
      "The selected table row looks like the others: the selection still happens, it just cannot be seen.",
  },
  {
    role: /^--rc-skeleton$/,
    silent: true,
    effect:
      "Loading has no placeholder and the body of the `Avatar` disappears: the screen looks empty instead of busy.",
  },
  {
    role: /^--rc-border$/,
    silent: false,
    effect:
      "Every plain line falls back to `currentColor` and takes the text color: the screen gains heavy grids nobody drew.",
  },
  {
    role: /^--rc-border-strong$/,
    silent: false,
    effect:
      "The border that identifies fields and controls falls back to the text color, and the 3:1 boundary WCAG 1.4.11 asks for is no longer the one that was measured.",
  },
  {
    role: /^--rc-border-disabled$/,
    silent: false,
    effect:
      "The locked control gets its border in the text color, stronger than that of the live control: the disabled one starts to look like the only clickable one.",
  },
  {
    role: /^--rc-line-hover$/,
    silent: true,
    effect: "The border stops responding to the pointer, and the field stops saying it accepts focus.",
  },
  {
    role: /^--rc-ring$/,
    silent: true,
    effect:
      "The keyboard focus ring comes out in the text color and vanishes against it. No screenshot catches this: whoever navigates with Tab loses track, and the screen becomes inaccessible in silence.",
  },
  {
    role: /^--rc-(success|warning|danger|info)$/,
    silent: false,
    effect:
      "The fill of this tone disappears: the tone's `Badge`, `Alert` and `Progress` come out colorless, and success and danger become the same nothing.",
  },
  {
    role: /^--rc-(success|warning|danger|info)-fg$/,
    silent: false,
    effect:
      "The text read on this tone's fill inherits the page color and vanishes into it.",
  },
  {
    role: /^--rc-(success|warning|danger|info)-text$/,
    silent: true,
    effect:
      "This tone's message comes out in the plain text color: a form error stops looking like an error.",
  },
  {
    role: /^--rc-(success|warning|danger|info)-subtle$/,
    silent: true,
    effect:
      "This tone's `Alert` comes out without its faint background, and the strip that separates the notice from the rest of the page disappears.",
  },
  {
    role: /^--rc-font-sans$/,
    silent: true,
    effect:
      "The whole page falls back to the browser font. There is no `:root` value underneath to catch the fall, and that is on purpose: `tsc` compiles, Vite builds, and the only thing wrong is the screen.",
  },
  {
    role: /^--rc-font-display$/,
    silent: true,
    effect:
      "Every heading loses the brand family and goes back to the browser's. Since the body text may be right, the screen only looks a little odd, and nobody files a ticket for it.",
  },
  {
    role: /^--rc-font-mono$/,
    silent: true,
    effect:
      "`Kbd`, code block and number column come out in the text font, and the digits stop lining up in the table.",
  },
  {
    role: /^--rc-text-(display|hero)$/,
    silent: true,
    effect:
      "The brand heading loses its `clamp()` size and inherits the paragraph's: the page hero becomes a bold paragraph.",
  },
  {
    role: /^--rc-shadow-[1-3]$/,
    silent: true,
    effect:
      "The floating layer loses its shadow and the 1px hairline that comes with it: menu, panel and dialog touch the page with nothing separating them.",
  },
  {
    role: /^--rc-glow-accent$/,
    silent: true,
    effect:
      "The `shadow-glow` class stops lighting up. No piece turns it on by itself, so the gap only shows where your screen asked for the glow.",
  },
  {
    role: /^--rc-chart-[1-8]$/,
    silent: false,
    effect:
      "The chart draws this series without color. The eight are used in order, so missing a high-numbered one only shows in a chart with many series.",
  },
  {
    role: /^--rc-chart-grid$/,
    silent: true,
    effect: "The chart background grid disappears, and the value has no ruler to be read against.",
  },
];

export function effectOf(role: string) {
  return EFFECTS.find((entry) => entry.role.test(role));
}

export function requiredRoles(roles: readonly string[]) {
  return roles.filter((role) => !(role in OPTIONAL));
}

type Block = {
  selector: string;
  files: Set<string>;
  roles: Set<string>;
  values: Map<string, string>;
};

const DECLARATION = /^\s*(--rc-[a-z0-9-]+)\s*:([\s\S]*)$/;

function scan(file: string, css: string, into: Map<string, Block>) {
  const stack: string[] = [];
  let buffer = "";

  const close = () => {
    const found = DECLARATION.exec(buffer);
    const selector = stack[stack.length - 1];
    buffer = "";

    if (!found || !selector || selector.startsWith("@")) return;

    const block = into.get(selector) ?? {
      selector,
      files: new Set<string>(),
      roles: new Set<string>(),
      values: new Map<string, string>(),
    };
    block.files.add(file);
    block.roles.add(found[1]!);
    block.values.set(found[1]!, found[2]!.trim());
    into.set(selector, block);
  };

  for (const char of css.replace(/\/\*[\s\S]*?\*\//g, " ")) {
    if (char === "{") {
      stack.push(buffer.replace(/\s+/g, " ").trim());
      buffer = "";
    } else if (char === "}") {
      close();
      stack.pop();
    } else if (char === ";") {
      close();
    } else {
      buffer += char;
    }
  }
}

function distance(one: string, other: string) {
  if (Math.abs(one.length - other.length) > 2) return 9;

  let row = Array.from({ length: other.length + 1 }, (_, at) => at);

  for (let here = 1; here <= one.length; here++) {
    const next = [here];
    for (let there = 1; there <= other.length; there++) {
      next[there] = Math.min(
        row[there]! + 1,
        next[there - 1]! + 1,
        row[there - 1]! + (one[here - 1] === other[there - 1] ? 0 : 1),
      );
    }
    row = next;
  }

  return row[other.length]!;
}

export type ThemeBlock = {
  selector: string;
  files: string[];
  tokens: Record<string, string>;
};

export function themeBlocks(sources: ReadonlyArray<{ file: string; css: string }>): ThemeBlock[] {
  const blocks = new Map<string, Block>();
  for (const { file, css } of sources) scan(file, css, blocks);

  return [...blocks.values()].map((block) => ({
    selector: block.selector,
    files: [...block.files],
    tokens: Object.fromEntries(block.values),
  }));
}

export function reportOf(
  selector: string,
  files: readonly string[],
  present: ReadonlySet<string>,
  roles: readonly string[],
): ThemeReport | undefined {
  const required = requiredRoles(roles);
  const known = new Set<string>(roles);

  const declared = required.filter((role) => present.has(role));
  if (declared.length === 0) return undefined;

  const unknown = [...present].filter((role) => !known.has(role) && !role.startsWith("--rc-p-"));

  const missing = required
    .filter((role) => !present.has(role))
    .map((role): RoleBreak => {
      const what = effectOf(role);
      const arrived = ARRIVED[role];
      const meant = unknown.find((wrong) => distance(wrong, role) <= 2);

      return {
        role,
        silent: what?.silent ?? true,
        effect: what?.effect ?? "Theme role with no written consequence in this version of the command.",
        ...(arrived ? { version: arrived.version, note: arrived.note } : {}),
        ...(meant ? { meant } : {}),
      };
    });

  return {
    selector,
    files: [...files],
    declared: declared.length,
    required: required.length,
    missing,
    unknown,
  };
}

export function checkThemes(
  sources: ReadonlyArray<{ file: string; css: string }>,
  roles: readonly string[],
): ThemeReport[] {
  const reports: ThemeReport[] = [];

  for (const block of themeBlocks(sources)) {
    const report = reportOf(block.selector, block.files, new Set(Object.keys(block.tokens)), roles);
    if (report) reports.push(report);
  }

  return reports;
}
