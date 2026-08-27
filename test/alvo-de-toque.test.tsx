import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { Breadcrumb } from "../src/components/breadcrumb";
import { Checkbox } from "../src/components/checkbox";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxInput,
  ComboboxValue,
} from "../src/components/combobox";
import { Slider } from "../src/components/slider";
import { RivoProvider } from "../src/provider/rivo-provider";

/*
 * O alvo de 24x24 da WCAG 2.5.8 (AA).
 *
 * Uma bancada externa contou 30 alvos abaixo de 24 CSS px em 12 telas a
 * 390px, descontando os input escondidos da Base UI e o link em texto
 * corrido, que a norma dispensa. Sobraram quatro desenhos: a marca do
 * Checkbox sem rotulo (o --rc-box, 18px, que e exatamente a coluna de
 * selecao do DataTable, onde o dedo mais mira), o pino do Slider, o botao de
 * remover da ficha do Combobox - o menor da biblioteca, do tamanho do icone -
 * e o link do Breadcrumb, que falha na altura porque e uma linha de texto
 * pequeno.
 *
 * O conserto nao mexe no desenho: um pseudo-elemento transparente estica a
 * area de toque para fora da caixa visivel. Crescer a caixa de verdade
 * engordaria a coluna de selecao, a ficha e a trilha da faixa, que e
 * exatamente o que a densidade da casa nao quer.
 *
 * Onde o rotulo ja existe, nada muda: o `<label>` inteiro ja e o alvo, e
 * pendurar um halo no quadradinho so poria uma camada por cima do texto. Por
 * isso o Checkbox so estica quando sai sozinho, e o teste abaixo guarda os
 * dois lados.
 *
 * Nao ha layout de verdade no happy-dom - nenhum destes elementos tem largura
 * medivel aqui -, entao o teste asserta as classes que produzem a area, como
 * test/classnames.test.tsx faz com as classes que produzem a aparencia. O
 * numero de pixels quem confere e a bancada; o que este arquivo impede e a
 * area sumir num refatoramento.
 */

function withTheme(node: React.ReactNode) {
  return render(<RivoProvider scope="local">{node}</RivoProvider>);
}

/** O alvo esticado por pseudo-elemento, e nao pela caixa desenhada. */
function hasTouchTarget(element: Element, ...insets: string[]) {
  expect(element.className).toContain("relative");
  expect(element.className).toContain("after:absolute");
  for (const inset of insets) expect(element.className).toContain(inset);
}

test("a caixa de marcar sem rotulo estica o alvo alem do quadradinho", () => {
  // O caso da coluna de selecao do DataTable: 18x18 desenhados, sem texto ao
  // lado para emprestar area.
  withTheme(<Checkbox aria-label="Selecionar linha" />);
  hasTouchTarget(screen.getByRole("checkbox"), "after:-inset-1.5");
});

test("com rotulo o alvo continua sendo o label inteiro, sem halo por cima do texto", () => {
  withTheme(<Checkbox>ISS retido na fonte</Checkbox>);

  const box = screen.getByRole("checkbox", { name: "ISS retido na fonte" });
  const label = box.closest("label");
  expect(label).not.toBeNull();
  expect(label!.textContent).toContain("ISS retido na fonte");

  // Sem o halo: aqui ele nao acrescentaria alvo nenhum e ainda deitaria uma
  // camada sobre o texto do proprio rotulo.
  expect(box.className).not.toContain("after:absolute");

  fireEvent.click(screen.getByText("ISS retido na fonte"));
  expect(box.getAttribute("data-checked")).not.toBeNull();
});

test("o pino da faixa estica o alvo, e os dois pinos da faixa dupla tambem", () => {
  const { container } = withTheme(
    <Slider
      defaultValue={[10, 40]}
      thumbLabel={["Mínimo", "Máximo"]}
      classNames={{ thumb: "thumb-mark" }}
    />,
  );

  const thumbs = container.querySelectorAll(".thumb-mark");
  expect(thumbs.length).toBe(2);
  for (const thumb of thumbs) hasTouchTarget(thumb, "after:-inset-1.5");
});

test("o remover da ficha estica o alvo, que e o menor desenho da biblioteca", () => {
  withTheme(
    <Combobox items={["Clinica Sao Lucas"]} multiple defaultValue={["Clinica Sao Lucas"]}>
      <ComboboxChips>
        <ComboboxValue>
          {(chosen: string[]) =>
            chosen.map((customer) => (
              <ComboboxChip key={customer} aria-label={customer}>
                {customer}
              </ComboboxChip>
            ))
          }
        </ComboboxValue>
        <ComboboxInput aria-label="Cliente" />
      </ComboboxChips>
    </Combobox>,
  );

  // O nome do xis passou a carregar a ficha: "Remover" cravado nao distinguia
  // uma ficha da vizinha.
  hasTouchTarget(
    screen.getByRole("button", { name: "Remover Clinica Sao Lucas" }),
    "after:-inset-1.5",
  );
});

test("o link da migalha estica o alvo so na altura, para nao pegar o clique do vizinho", () => {
  // A largura ja passava; quem falha e a altura de uma linha de texto
  // pequeno. Esticar tambem na horizontal poria o halo por cima da migalha
  // seguinte, que fica a seis pixels de distancia.
  withTheme(
    <Breadcrumb
      items={[{ label: "Clientes", href: "/clientes" }, { label: "Clinica Sao Lucas" }]}
    />,
  );

  const link = screen.getByRole("link", { name: "Clientes" });
  hasTouchTarget(link, "after:-inset-y-1.5", "after:inset-x-0");
  expect(link.className).not.toContain("after:-inset-x");
});
