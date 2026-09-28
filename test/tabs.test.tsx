import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { TabPanel, Tab, TabList, Tabs } from "../src/components/tabs";

function Example() {
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

test("the tabs render with the tab role", () => {
  render(<Example />);
  expect(screen.getAllByRole("tab")).toHaveLength(2);
  expect(screen.getByRole("tablist")).toBeDefined();
});

test("only the active tab's panel shows", () => {
  render(<Example />);
  expect(screen.getByText("doze notas abertas")).toBeDefined();
  expect(screen.queryByText("quarenta notas pagas")).toBeNull();
});

test("the active tab announces itself as selected", () => {
  render(<Example />);
  const active = screen.getByRole("tab", { name: "Abertas" });
  expect(active.getAttribute("aria-selected")).toBe("true");
});

test("the active tab uses the accent as text, never the raw lime", () => {
  render(<Example />);
  expect(screen.getByRole("tab", { name: "Abertas" }).className).toContain(
    "data-[active]:text-accent-text",
  );
});
