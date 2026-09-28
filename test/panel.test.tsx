import { expect, spyOn, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { Stat } from "../src/components/stat";
import { Indicator, indicatorWidthComplaint } from "../src/components/indicator";
import { AvatarGroup } from "../src/components/avatar-group";
import { Avatar } from "../src/components/avatar";
import { IconButton } from "../src/components/icon-button";

/*
 * What rebuilding an admin dashboard found: 21% of the lines written were
 * workarounds for a missing piece or for a slot that did not exist.
 */

function withTheme(node: React.ReactNode) {
  return render(<RivoProvider scope="local">{node}</RivoProvider>);
}

test("the stat card accepts icon, actions and footer", () => {
  // Without the three slots, the most praiseworthy piece in the catalog was
  // abandoned in the most common layout there is for it: 49 lines rebuilt
  // with Card, Badge, Progress and Menu.
  withTheme(
    <Stat
      label="Faturado"
      value="R$ 246,7K"
      delta={20}
      deltaLabel="sobre julho"
      icon={<span data-testid="icon">R$</span>}
      actions={<IconButton size="sm" label="Mais ações"><span /></IconButton>}
      footer={<span>Meta: 82%</span>}
    />,
  );

  expect(screen.getByTestId("icon")).toBeDefined();
  expect(screen.getByRole("button", { name: "Mais ações" })).toBeDefined();
  expect(screen.getByText("Meta: 82%")).toBeDefined();
});

test("the delta also comes out as a pill, which is the dashboard convention", () => {
  const { container } = withTheme(
    <Stat label="Faturado" value="R$ 48" delta={12} deltaVariant="pill" />,
  );

  const delta = screen.getByText(/12%/);
  expect(delta.className).toContain("rounded-pill");
  expect(container.textContent).toContain("12%");
});

test("the count over the bell has its own piece, not a hand-positioned Badge", () => {
  withTheme(
    <Indicator count={7} label="7 avisos não lidos">
      <IconButton label="Avisos"><span /></IconButton>
    </Indicator>,
  );

  expect(screen.getByText("7")).toBeDefined();
  // The count needs to be spoken, not just seen.
  expect(screen.getByText("7 avisos não lidos")).toBeDefined();
});

test("a large count becomes a cap, instead of stretching the badge", () => {
  withTheme(
    <Indicator count={150} max={99}>
      <IconButton label="Avisos"><span /></IconButton>
    </Indicator>,
  );

  expect(screen.getByText("99+")).toBeDefined();
});

function measuring(width: number, act: () => void) {
  const real = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", { configurable: true, value: width });
  try {
    act();
  } finally {
    if (real) Object.defineProperty(HTMLElement.prototype, "offsetWidth", real);
    else Reflect.deleteProperty(HTMLElement.prototype, "offsetWidth");
  }
}

test("a wide child is flagged: the badge covers content, and nothing reserves space", () => {
  const warn = spyOn(console, "warn").mockImplementation(() => {});

  measuring(320, () =>
    withTheme(
      <Indicator count={3} label="3 avisos não lidos">
        <span>Uma linha inteira de conteúdo</span>
      </Indicator>,
    ),
  );

  expect(warn).toHaveBeenCalledTimes(1);
  expect(String(warn.mock.calls[0]?.[0])).toContain("[rivocode/ui]");
  expect(String(warn.mock.calls[0]?.[0])).toContain("320px");
  warn.mockRestore();
});

test("a small target is not flagged: the bell, the bar item and the avatar fit in 48px", () => {
  const warn = spyOn(console, "warn").mockImplementation(() => {});

  measuring(48, () =>
    withTheme(
      <Indicator count={3} label="3 avisos não lidos">
        <IconButton label="Avisos"><span /></IconButton>
      </Indicator>,
    ),
  );

  expect(warn).not.toHaveBeenCalled();
  expect(indicatorWidthComplaint(48)).toBeUndefined();
  expect(indicatorWidthComplaint(49)).toContain("49px");
  warn.mockRestore();
});

test("the measuring wrapper still hands the node to whoever asked by ref", () => {
  let node: HTMLSpanElement | null = null;

  withTheme(
    <Indicator count={3} label="3 avisos não lidos" ref={(element) => void (node = element)}>
      <IconButton label="Avisos"><span /></IconButton>
    </Indicator>,
  );

  expect(node).not.toBeNull();
  expect((node as unknown as HTMLElement).tagName).toBe("SPAN");
});

test("the avatar row cuts the excess and says how many are left", () => {
  withTheme(
    <AvatarGroup max={2}>
      <Avatar fallback="AP" />
      <Avatar fallback="CN" />
      <Avatar fallback="EB" />
      <Avatar fallback="MS" />
    </AvatarGroup>,
  );

  expect(screen.getByText("+2")).toBeDefined();
  expect(screen.queryByText("EB")).toBeNull();
});

test("in the overlapping row the initial comes out as a single letter", () => {
  // With two letters the overlap cuts the text, and the fix is for the piece
  // to make that decision once instead of five teams making it differently.
  withTheme(
    <AvatarGroup>
      <Avatar fallback="AP" />
      <Avatar fallback="CN" />
    </AvatarGroup>,
  );

  expect(screen.getByText("A")).toBeDefined();
  expect(screen.queryByText("AP")).toBeNull();
});
