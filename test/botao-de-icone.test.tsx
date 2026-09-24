import { expect, mock, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import { Trash2 } from "lucide-react";

import { IconButton } from "../src/components/icon-button";
import { RivoProvider } from "../src/provider/rivo-provider";

function mount(ui: React.ReactElement) {
  return render(<RivoProvider scope="local">{ui}</RivoProvider>);
}

test("o label vira o nome acessivel, e o icone sai mudo", () => {
  mount(
    <IconButton label="Excluir nota">
      <Trash2 />
    </IconButton>,
  );

  const button = screen.getByRole("button", { name: "Excluir nota" });
  const svg = button.querySelector("svg")!;
  expect(svg.closest("[aria-hidden='true']")).not.toBeNull();
});

test("o tipo recusa botao de icone sem label", () => {
  // @ts-expect-error label e obrigatorio
  const missing = <IconButton>{<Trash2 />}</IconButton>;
  expect(missing).toBeDefined();
});

test("o tipo recusa aria-label solto, para o nome ter um caminho so", () => {
  const withAria = (
    // @ts-expect-error aria-label sai do tipo; o nome e o label
    <IconButton label="Excluir" aria-label="Outro">
      <Trash2 />
    </IconButton>
  );
  expect(withAria).toBeDefined();
});

test("o quadrado sai do token de altura de controle, nos tres tamanhos", () => {
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

test("herda as variantes do Button, sem copiar a classe", () => {
  mount(
    <IconButton label="Excluir" variant="destructive">
      <Trash2 />
    </IconButton>,
  );
  const tokens = screen.getByRole("button", { name: "Excluir" }).className.split(" ");
  expect(tokens).toContain("bg-danger");
  expect(tokens).not.toContain("bg-accent");
});

test("carregando troca o icone pela espera, trava o clique e mantem o nome", () => {
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

test("desabilitado nao dispara o clique", () => {
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

test("sem tooltip nao ha dica montada", () => {
  mount(
    <IconButton label="Excluir">
      <Trash2 />
    </IconButton>,
  );
  expect(screen.queryByRole("tooltip")).toBeNull();
});

test("com tooltip, a dica repete o label e nao entra no nome", async () => {
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

test("como link, continua com nome e sem virar button", () => {
  mount(
    <IconButton label="Abrir nota" render={<a href="/notas/1" />}>
      <Trash2 />
    </IconButton>,
  );
  const link = screen.getByRole("link", { name: "Abrir nota" });
  expect(link.getAttribute("href")).toBe("/notas/1");
});
