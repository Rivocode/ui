import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import { FileText, LayoutDashboard } from "lucide-react";

import { RivoProvider } from "../src/provider/rivo-provider";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "../src/components/sidebar";

function Tela({ defaultOpen = true }: { defaultOpen?: boolean }) {
  return (
    <RivoProvider scope="local">
      <SidebarProvider defaultOpen={defaultOpen}>
        <Sidebar>
          <SidebarHeader>RivoCode</SidebarHeader>
          <SidebarContent>
            <SidebarGroup label="Operacao">
              <SidebarMenu>
                <SidebarMenuItem href="#" icon={<LayoutDashboard size={16} />} active>
                  Painel
                </SidebarMenuItem>
                <SidebarMenuItem href="#" icon={<FileText size={16} />}>
                  Notas fiscais
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <SidebarTrigger />
        </SidebarInset>
      </SidebarProvider>
    </RivoProvider>
  );
}

test("a barra lista a navegacao e marca a pagina atual", () => {
  render(<Tela />);
  expect(screen.getByText("Operacao")).toBeDefined();
  expect(screen.getByText("Painel").closest("a")!.getAttribute("aria-current")).toBe("page");
  expect(screen.getByText("Notas fiscais").closest("a")!.getAttribute("aria-current")).toBeNull();
});

test("o gatilho fecha e abre, e conta o estado", () => {
  render(<Tela />);
  const gatilho = screen.getByLabelText("Fechar menu");
  expect(gatilho.getAttribute("aria-expanded")).toBe("true");

  fireEvent.click(gatilho);
  expect(screen.getByLabelText("Abrir menu").getAttribute("aria-expanded")).toBe("false");
});

test("encolhida, sobra o icone e o nome vira dica", () => {
  render(<Tela defaultOpen={false} />);
  const barra = document.querySelector("aside")!;
  expect(barra.hasAttribute("data-encolhida")).toBe(true);
  // O texto sai da linha, mas continua alcancavel pela dica do icone.
  expect(barra.textContent).not.toContain("Notas fiscais");
});

test("o atalho do teclado abre e fecha", () => {
  render(<Tela />);
  fireEvent.keyDown(window, { key: "b", ctrlKey: true });
  expect(screen.getByLabelText("Abrir menu")).toBeDefined();

  fireEvent.keyDown(window, { key: "b", metaKey: true });
  expect(screen.getByLabelText("Fechar menu")).toBeDefined();
});

test("usar as pecas sem o provedor falha com recado, e nao com tela branca", () => {
  const original = console.error;
  console.error = () => {};
  try {
    expect(() => render(<SidebarTrigger />)).toThrow(/SidebarProvider/);
  } finally {
    console.error = original;
  }
});
