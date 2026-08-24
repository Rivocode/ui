import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { TabPanel, Tab, TabList, Tabs } from "../src/primitives/tabs";

function Exemplo() {
  return (
    <Tabs defaultValue="abertas">
      <TabList>
        <Tab value="abertas">Abertas</Tab>
        <Tab value="pagas">Pagas</Tab>
      </TabList>
      <TabPanel value="abertas">doze notas abertas</TabPanel>
      <TabPanel value="pagas">quarenta notas pagas</TabPanel>
    </Tabs>
  );
}

test("as abas saem com papel de aba", () => {
  render(<Exemplo />);
  expect(screen.getAllByRole("tab")).toHaveLength(2);
  expect(screen.getByRole("tablist")).toBeDefined();
});

test("so o painel da aba ativa aparece", () => {
  render(<Exemplo />);
  expect(screen.getByText("doze notas abertas")).toBeDefined();
  expect(screen.queryByText("quarenta notas pagas")).toBeNull();
});

test("a aba ativa se anuncia como selecionada", () => {
  render(<Exemplo />);
  const ativa = screen.getByRole("tab", { name: "Abertas" });
  expect(ativa.getAttribute("aria-selected")).toBe("true");
});

test("a aba ativa usa o acento como texto, nunca a lima crua", () => {
  render(<Exemplo />);
  expect(screen.getByRole("tab", { name: "Abertas" }).className).toContain(
    "data-[active]:text-accent-text",
  );
});
