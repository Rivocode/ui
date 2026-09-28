import { describe, expect, mock, test } from "bun:test";

import { act, byClass, byLabel, byRole, render, textOf } from "./helpers";

/*
 * expo-clipboard is not installed where the suite runs, and will not be: it is
 * an OPTIONAL peer and an Expo native module, so the only place in the
 * repository that has it is `examples/native`, which is not a workspace - and
 * where `check:native:types` goes to fetch the types. Here it comes in as a
 * double, and the double is useful in itself: `setStringAsync` returning
 * `false` is the case no device reproduces on demand.
 *
 * `mock.module` MUST run before the piece is evaluated, and `import` is
 * hoisted to the top of the file: that is why the piece comes in through
 * `await import` right below. It is the same trap as `chart-svg.test.tsx`.
 */
let written: string[] = [];
let accepts = true;

mock.module("expo-clipboard", () => ({
  setStringAsync: async (text: string) => {
    written.push(text);
    return accepts;
  },
}));

const { Clipboard } = await import("../src/clipboard/clipboard");

const CHAVE = "35240612345678000199550010000048131000048139";

function reset() {
  written = [];
  accepts = true;
}

/** The tap, with the await the asynchronous copy asks for. */
async function press(node: { props: { onPress: () => unknown } }) {
  await act(async () => {
    await node.props.onPress();
  });
}

describe("Clipboard", () => {
  test("copies the value and confirms on both channels: the button and the notice", async () => {
    reset();
    const screen = render(<Clipboard value={CHAVE} />);

    const [button] = byLabel(screen, "Copiar");
    await press(button!);

    expect(written).toEqual([CHAVE]);
    // The button: the spoken name becomes the confirmation.
    expect(byLabel(screen, "Copiado")).toHaveLength(1);
    expect(byLabel(screen, "Copiar")).toHaveLength(0);
    // The notice: it is what speaks on its own, because changing the
    // accessibilityLabel of an already focused Pressable is re-announced by no
    // screen reader.
    expect(textOf(screen)).toContain("Copiado");
  });

  test("a clipboard that refuses confirms nothing", async () => {
    reset();
    accepts = false;
    const screen = render(<Clipboard value={CHAVE} />);

    await press(byLabel(screen, "Copiar")[0]!);

    // Lying that it copied is worse than not confirming: the person pastes
    // what they had before and only finds out at the destination.
    expect(byLabel(screen, "Copiar")).toHaveLength(1);
    expect(byLabel(screen, "Copiado")).toHaveLength(0);
    expect(textOf(screen)).not.toContain("Copiado");
  });

  test("onCopy only fires when it really copied", async () => {
    reset();
    const onCopy = mock(() => {});

    accepts = false;
    const refused = render(<Clipboard value={CHAVE} onCopy={onCopy} />);
    await press(byLabel(refused, "Copiar")[0]!);
    expect(onCopy).toHaveBeenCalledTimes(0);

    accepts = true;
    const done = render(<Clipboard value={CHAVE} onCopy={onCopy} />);
    await press(byLabel(done, "Copiar")[0]!);
    expect(onCopy).toHaveBeenCalledWith(CHAVE);
  });

  test("the confirmation reverts on its own, or the button stays stuck in a state that is over", async () => {
    reset();
    const screen = render(<Clipboard value={CHAVE} timeout={5} />);

    await press(byLabel(screen, "Copiar")[0]!);
    expect(byLabel(screen, "Copiado")).toHaveLength(1);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(byLabel(screen, "Copiar")).toHaveLength(1);
  });

  test("toast off leaves only the button's confirmation", async () => {
    reset();
    const screen = render(<Clipboard value={CHAVE} toast={false} />);

    await press(byLabel(screen, "Copiar")[0]!);

    expect(byLabel(screen, "Copiado")).toHaveLength(1);
    expect(textOf(screen)).not.toContain("Copiado");
  });

  test("the two names change one without the other, and the visible text follows the spoken one", async () => {
    reset();
    const screen = render(
      <Clipboard value={CHAVE} labels={{ copy: "Copiar a chave" }}>
        Copiar a chave
      </Clipboard>,
    );

    expect(textOf(screen)).toContain("Copiar a chave");
    await press(byLabel(screen, "Copiar a chave")[0]!);

    // Changing only the verb does not force rewriting the confirmation too.
    expect(byLabel(screen, "Copiado")).toHaveLength(1);
    expect(textOf(screen)).toContain("Copiado");
  });

  test("children is the button text until it copies, and copied comes in afterwards", async () => {
    reset();
    const screen = render(<Clipboard value={CHAVE}>Copiar a chave de acesso</Clipboard>);

    expect(textOf(screen)).toContain("Copiar a chave de acesso");
    const [button] = byLabel(screen, "Copiar a chave de acesso");
    expect(button).toBeDefined();

    await press(button!);
    expect(byLabel(screen, "Copiado")).toHaveLength(1);
    expect(textOf(screen)).not.toContain("Copiar a chave de acesso");
  });

  test("icon-only, the target is square and full, without relying on hitSlop", () => {
    reset();
    const icon = render(<Clipboard value={CHAVE} />);
    expect(byLabel(icon, "Copiar")[0]!.props.className).toContain("h-11 w-11");

    const withText = render(<Clipboard value={CHAVE}>Copiar</Clipboard>);
    expect(byLabel(withText, "Copiar")[0]!.props.className).toContain("h-11 px-4");
  });

  test("disabled does not copy and says it is disabled", async () => {
    reset();
    const screen = render(<Clipboard value={CHAVE} disabled />);
    const [button] = byRole(screen, "button");

    expect(button!.props.accessibilityState).toEqual({ disabled: true });
    expect(button!.props.disabled).toBe(true);
  });

  test("the consumer's class wins over the piece's", () => {
    reset();
    const screen = render(<Clipboard value={CHAVE} className="h-14" />);
    const className = byLabel(screen, "Copiar")[0]!.props.className as string;

    expect(className).toContain("h-14");
    expect(className).not.toContain("h-11 w-11");
  });
});

const VARIANTS = [
  {
    variant: "primary",
    fill: ["bg-accent", "active:bg-accent-active"],
    label: "text-accent-fg",
    copy: "border-accent-fg",
    check: "border-accent-fg",
  },
  {
    variant: "secondary",
    fill: ["bg-surface", "border", "border-border-strong", "active:bg-surface-raised"],
    label: "text-fg",
    copy: "border-fg-muted",
    check: "border-success-text",
  },
  {
    variant: "ghost",
    fill: ["active:bg-accent-subtle"],
    label: "text-fg-muted",
    copy: "border-fg-muted",
    check: "border-success-text",
  },
  {
    variant: "outline",
    fill: ["border-2", "border-border-strong", "active:bg-accent-subtle"],
    label: "text-fg",
    copy: "border-fg-muted",
    check: "border-success-text",
  },
  {
    variant: "danger",
    fill: ["bg-danger", "active:opacity-90"],
    label: "text-danger-fg",
    copy: "border-danger-fg",
    check: "border-danger-fg",
  },
] as const;

describe("Clipboard in the Button variants", () => {
  test("without variant the look stays secondary", () => {
    reset();
    const screen = render(<Clipboard value={CHAVE} />);
    const tokens = (byLabel(screen, "Copiar")[0]!.props.className as string).split(" ");

    expect(tokens).toContain("bg-surface");
    expect(tokens).toContain("border-border-strong");
    expect(tokens).not.toContain("bg-accent");
  });

  for (const { variant, fill, label, copy, check } of VARIANTS) {
    test(`${variant}: the background, the label and both icons are those of Button ${variant}`, async () => {
      reset();
      const screen = render(
        <Clipboard value={CHAVE} variant={variant} toast={false}>
          Copiar
        </Clipboard>,
      );

      const button = byLabel(screen, "Copiar")[0]!;
      const tokens = (button.props.className as string).split(" ");
      for (const token of fill) expect(tokens).toContain(token);
      for (const other of VARIANTS) {
        if (other.variant === variant) continue;
        for (const token of other.fill) if (!fill.includes(token as never)) expect(tokens).not.toContain(token);
      }

      const text = byClass(screen, /font-rc-medium/);
      expect(text.length).toBeGreaterThan(0);
      for (const node of text) {
        const words = (node.props.className as string).split(" ");
        expect(words).toContain(label);
      }

      const frames = byClass(screen, /rounded-sm/);
      expect(frames).toHaveLength(2);
      for (const frame of frames) {
        expect((frame.props.className as string).split(" ")).toContain(copy);
      }

      await press(button);
      const ticks = byClass(screen, /-rotate-45/);
      expect(ticks).toHaveLength(1);
      const tick = (ticks[0]!.props.className as string).split(" ");
      expect(tick).toContain(check);
      if (check !== "border-success-text") expect(tick).not.toContain("border-success-text");
    });
  }
});
