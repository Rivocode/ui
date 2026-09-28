import { expect, mock, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import { Trash2 } from "lucide-react";

import { IconButton } from "../src/components/icon-button";
import { RivoProvider } from "../src/provider/rivo-provider";

function mount(ui: React.ReactElement) {
  return render(<RivoProvider scope="local">{ui}</RivoProvider>);
}

test("the label becomes the accessible name, and the icon is hidden", () => {
  mount(
    <IconButton label="Excluir nota">
      <Trash2 />
    </IconButton>,
  );

  const button = screen.getByRole("button", { name: "Excluir nota" });
  const svg = button.querySelector("svg")!;
  expect(svg.closest("[aria-hidden='true']")).not.toBeNull();
});

test("the type rejects an icon button without a label", () => {
  // @ts-expect-error label is required
  const missing = <IconButton>{<Trash2 />}</IconButton>;
  expect(missing).toBeDefined();
});

test("the type rejects a loose aria-label, so the name has a single path", () => {
  const withAria = (
    // @ts-expect-error aria-label is out of the type; the name is the label
    <IconButton label="Excluir" aria-label="Outro">
      <Trash2 />
    </IconButton>
  );
  expect(withAria).toBeDefined();
});

test("the square comes from the control height token, in all three sizes", () => {
  const sizes = ["sm", "md", "lg"] as const;
  for (const size of sizes) {
    const { unmount } = mount(
      <IconButton label={`Baixar ${size}`} size={size}>
        <Trash2 />
      </IconButton>,
    );
    const tokens = screen.getByRole("button", { name: `Baixar ${size}` }).className.split(" ");
    expect(tokens).toContain(`size-[var(--rc-control-${size})]`);
    expect(tokens).toContain("p-0");
    expect(tokens.some((token) => token.startsWith("h-[var"))).toBe(false);
    expect(tokens.some((token) => token.startsWith("px-["))).toBe(false);
    unmount();
  }
});

test("inherits the Button variants, without copying the class", () => {
  mount(
    <IconButton label="Excluir" variant="danger">
      <Trash2 />
    </IconButton>,
  );
  const tokens = screen.getByRole("button", { name: "Excluir" }).className.split(" ");
  expect(tokens).toContain("bg-danger");
  expect(tokens).not.toContain("bg-accent");
});

test("loading swaps the icon for the spinner, blocks the click and keeps the name", () => {
  const onClick = mock(() => {});
  mount(
    <IconButton label="Sincronizar" loading onClick={onClick}>
      <Trash2 />
    </IconButton>,
  );

  const button = screen.getByRole("button", { name: "Sincronizar" });
  expect(button.getAttribute("aria-busy")).toBe("true");
  expect((button as HTMLButtonElement).disabled).toBe(true);
  expect(button.querySelector("svg")).toBeNull();
  expect(button.querySelector(".animate-spin")).not.toBeNull();

  fireEvent.click(button);
  expect(onClick).not.toHaveBeenCalled();
});

test("disabled does not fire the click", () => {
  const onClick = mock(() => {});
  mount(
    <IconButton label="Excluir" disabled onClick={onClick}>
      <Trash2 />
    </IconButton>,
  );
  const button = screen.getByRole("button", { name: "Excluir" });
  fireEvent.click(button);
  expect(onClick).not.toHaveBeenCalled();
  expect((button as HTMLButtonElement).disabled).toBe(true);
});

test("without tooltip no tip is mounted", () => {
  mount(
    <IconButton label="Excluir">
      <Trash2 />
    </IconButton>,
  );
  expect(screen.queryByRole("tooltip")).toBeNull();
});

test("with tooltip, the tip repeats the label and does not enter the name", async () => {
  mount(
    <IconButton label="Excluir nota" tooltip>
      <Trash2 />
    </IconButton>,
  );

  const button = screen.getByRole("button", { name: "Excluir nota" });
  fireEvent.focus(button);
  fireEvent.pointerEnter(button);
  fireEvent.mouseEnter(button);

  const tip = await screen.findByRole("tooltip", {}, { timeout: 2000 });
  expect(tip.textContent).toBe("Excluir nota");
  expect(button.getAttribute("aria-describedby")).toBeNull();
  expect(button.getAttribute("aria-label")).toBe("Excluir nota");
});

test("as a link, it keeps its name and does not become a button", () => {
  mount(
    <IconButton label="Abrir nota" render={<a href="/notas/1" />}>
      <Trash2 />
    </IconButton>,
  );
  const link = screen.getByRole("link", { name: "Abrir nota" });
  expect(link.getAttribute("href")).toBe("/notas/1");
});
