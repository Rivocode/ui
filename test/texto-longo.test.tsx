import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { Accordion, AccordionItem } from "../src/components/accordion";
import { DescriptionItem, DescriptionList } from "../src/components/description-list";
import { PageHeader } from "../src/components/page-header";

const LONG = "https://cobranca.rivocode.com.br/faturas/2026/agosto/0000000000000000000000000000";

function tokens(node: Element | null) {
  return (node?.getAttribute("class") ?? "").split(" ");
}

test("o valor e o rotulo do DescriptionItem quebram em qualquer ponto em vez de estourar", () => {
  render(
    <DescriptionList>
      <DescriptionItem label={LONG}>{LONG}</DescriptionItem>
    </DescriptionList>,
  );

  const [label, value] = screen.getAllByText(LONG);
  expect(tokens(label!)).toContain("wrap-anywhere");
  expect(tokens(label!)).toContain("max-w-1/2");
  expect(tokens(value!)).toContain("wrap-anywhere");
  expect(tokens(value!)).toContain("min-w-0");
});

test("o titulo e a descricao do PageHeader quebram a palavra que nao cabe", () => {
  render(<PageHeader title={LONG} description={`${LONG}-descricao`} />);

  expect(tokens(screen.getByRole("heading", { name: LONG }))).toContain("wrap-anywhere");
  expect(tokens(screen.getByText(`${LONG}-descricao`))).toContain("wrap-anywhere");
});

test("o titulo do AccordionItem mora num trecho que encolhe e quebra, e a seta nao sai da linha", () => {
  render(
    <Accordion>
      <AccordionItem value="a" title={LONG}>
        corpo
      </AccordionItem>
    </Accordion>,
  );

  const title = screen.getByText(LONG);
  expect(title.tagName).toBe("SPAN");
  expect(tokens(title)).toContain("min-w-0");
  expect(tokens(title)).toContain("wrap-anywhere");
});
