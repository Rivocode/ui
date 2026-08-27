import { expect, test } from "bun:test";
import { fireEvent, render, waitFor } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { ChartContainer, type ChartConfig } from "../src/chart/chart";
import { ChartTooltipContent } from "../src/chart/chart-tooltip";

/*
 * A dica do grafico nao era anunciada.
 *
 * A Recharts anda de ponto em ponto com as setas, e o `ChartContainer` ja
 * entrega `role="img"` com nome - mas quem usa leitor de tela ouvia so o nome
 * do grafico: a dica aparecia na tela e nada a lia. O valor exato ficava
 * disponivel apenas para quem enxerga.
 *
 * O que se prova aqui e o mecanismo da moldura: existe regiao viva, ela copia
 * a dica quando a mudanca veio do teclado, e ela fica calada no ponteiro.
 *
 * A dica entra no DOM pela mao do teste, e nao pela Recharts, por uma
 * limitacao do ambiente: o `ResponsiveContainer` mede o pai, o happy-dom
 * responde 0x0 e a Recharts nao desenha grafico nenhum aqui - ela avisa isso
 * no console e devolve arvore vazia. Entao o teste faz o papel dela: insere na
 * moldura a mesma `.recharts-tooltip-wrapper` que ela insere, com o HTML que a
 * nossa `ChartTooltipContent` produz de verdade.
 */

const CONFIG: ChartConfig = { pagas: { label: "Pagas" } };

/** O HTML que a nossa dica desenha, para o teste nao inventar marcacao. */
function tipHtml(label: string, value: number) {
  const { container, unmount } = render(
    <ChartTooltipContent
      active
      label={label}
      config={CONFIG}
      payload={[{ dataKey: "pagas", value }] as never}
    />,
  );
  const html = container.innerHTML;
  unmount();
  return html;
}

function activePoint() {
  return document.querySelector<HTMLElement>("[data-rc-active-point]")!;
}

function chart() {
  const view = render(
    <RivoProvider scope="local">
      <ChartContainer config={CONFIG} className="h-40">
        <svg />
      </ChartContainer>
    </RivoProvider>,
  );

  const root = view.container.querySelector<HTMLElement>("[data-rc-chart]")!;

  /** O que a Recharts faz a cada ponto: por a dica na moldura, ou troca-la. */
  const showTip = (label: string, value: number) => {
    const wrapper =
      root.querySelector<HTMLElement>(".recharts-tooltip-wrapper") ??
      root.appendChild(Object.assign(document.createElement("div"), { className: "recharts-tooltip-wrapper" }));
    wrapper.innerHTML = tipHtml(label, value);
  };

  return { root, showTip };
}

test("a moldura publica uma regiao viva, e ela nasce calada", () => {
  chart();

  const live = activePoint();
  expect(live.getAttribute("aria-live")).toBe("polite");
  expect(live.className).toContain("sr-only");
  expect(live.textContent).toBe("");
});

test("a seta anuncia o ponto ativo, com rotulo e valor", async () => {
  const { root, showTip } = chart();

  fireEvent.keyDown(root, { key: "ArrowRight" });
  showTip("Março", 1200);

  await waitFor(() => {
    expect(activePoint().textContent).toBe("Março, Pagas, 1.200");
  });
});

test("andar para o proximo ponto troca o que a regiao diz", async () => {
  const { root, showTip } = chart();

  fireEvent.keyDown(root, { key: "ArrowRight" });
  showTip("Março", 1200);
  await waitFor(() => expect(activePoint().textContent).toContain("Março"));

  fireEvent.keyDown(root, { key: "ArrowRight" });
  showTip("Abril", 900);
  await waitFor(() => {
    expect(activePoint().textContent).toBe("Abril, Pagas, 900");
  });
});

/*
 * O ponteiro atravessa doze meses num segundo, e o leitor de tela fila tudo
 * que a regiao viva escreve: anunciar por ponteiro faria a pessoa ouvir marco
 * enquanto o cursor ja esta em dezembro. Quem enxerga ja tem a dica na tela.
 */
test("o ponteiro nao anuncia nada", async () => {
  const { root, showTip } = chart();

  fireEvent.pointerMove(root);
  showTip("Março", 1200);

  await Promise.resolve();
  expect(activePoint().textContent).toBe("");
});

test("depois do ponteiro, a tecla volta a anunciar", async () => {
  const { root, showTip } = chart();

  fireEvent.pointerMove(root);
  showTip("Março", 1200);

  fireEvent.keyDown(root, { key: "ArrowLeft" });
  showTip("Abril", 900);

  await waitFor(() => {
    expect(activePoint().textContent).toBe("Abril, Pagas, 900");
  });
});

/*
 * Regiao viva so fala quando o texto MUDA. Sem apagar ao sair, voltar ao mesmo
 * ponto depois seria silencio.
 */
test("sair do grafico apaga o que foi dito", async () => {
  const { root, showTip } = chart();

  fireEvent.keyDown(root, { key: "ArrowRight" });
  showTip("Março", 1200);
  await waitFor(() => expect(activePoint().textContent).toContain("Março"));

  fireEvent.focusOut(root);
  await waitFor(() => expect(activePoint().textContent).toBe(""));
});

/*
 * O nome do grafico ja esta no `aria-label` da superficie. Repeti-lo a cada
 * ponto faria o leitor dizer "Grafico de Pagas" doze vezes seguidas.
 */
test("o anuncio nao repete o nome do grafico", async () => {
  const { root, showTip } = chart();

  fireEvent.keyDown(root, { key: "ArrowRight" });
  showTip("Março", 1200);

  await waitFor(() => expect(activePoint().textContent).toContain("Março"));
  expect(activePoint().textContent).not.toContain("Gráfico");
});
