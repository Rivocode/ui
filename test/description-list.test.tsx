import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { DescriptionList, DescriptionItem } from "../src/components/description-list";
import { RivoProvider } from "../src/provider/rivo-provider";

function lista(children: React.ReactNode) {
  return render(
    <RivoProvider scope="local">
      <DescriptionList>{children}</DescriptionList>
    </RivoProvider>,
  );
}

test("sai como dl/dt/dd de verdade", () => {
  const { container } = lista(
    <>
      <DescriptionItem label="CNPJ">12.345.678/0001-90</DescriptionItem>
      <DescriptionItem label="Vencimento">17/09/2026</DescriptionItem>
    </>,
  );

  expect(container.querySelector("dl")).not.toBeNull();
  expect(container.querySelectorAll("dt").length).toBe(2);
  expect(container.querySelectorAll("dd").length).toBe(2);
  expect(screen.getByText("CNPJ").tagName).toBe("DT");
  expect(screen.getByText("17/09/2026").tagName).toBe("DD");
});

test("o valor aceita nó, não só texto", () => {
  lista(
    <DescriptionItem label="Situação">
      <span data-testid="badge">Paga</span>
    </DescriptionItem>,
  );
  expect(screen.getByTestId("badge")).toBeDefined();
});
