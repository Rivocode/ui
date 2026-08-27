import { expect, spyOn, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { Stat } from "../src/components/stat";
import { Indicator, indicatorWidthComplaint } from "../src/components/indicator";
import { AvatarGroup } from "../src/components/avatar-group";
import { Avatar } from "../src/components/avatar";
import { Button } from "../src/components/button";

/*
 * O que a reconstrucao de um painel de administracao encontrou: 21% das linhas
 * escritas eram contorno para peca ausente ou para slot que nao existia.
 */

function withTheme(node: React.ReactNode) {
  return render(<RivoProvider scope="local">{node}</RivoProvider>);
}

test("o cartao de indicador aceita icone, acoes e rodape", () => {
  // Sem os tres slots, a peca mais elogiavel do catalogo era abandonada no
  // layout mais comum que existe para ela: 49 linhas remontadas com Card,
  // Badge, Progress e Menu.
  withTheme(
    <Stat
      label="Faturado"
      value="R$ 246,7K"
      delta={20}
      deltaLabel="sobre julho"
      icon={<span data-testid="icone">R$</span>}
      actions={<Button size="iconSm" aria-label="Mais ações" />}
      footer={<span>Meta: 82%</span>}
    />,
  );

  expect(screen.getByTestId("icone")).toBeDefined();
  expect(screen.getByRole("button", { name: "Mais ações" })).toBeDefined();
  expect(screen.getByText("Meta: 82%")).toBeDefined();
});

test("a variacao tambem sai como pastilha, que e a convencao de painel", () => {
  const { container } = withTheme(
    <Stat label="Faturado" value="R$ 48" delta={12} deltaVariant="pill" />,
  );

  const delta = screen.getByText(/12%/);
  expect(delta.className).toContain("rounded-pill");
  expect(container.textContent).toContain("12%");
});

test("a contagem sobre o sino tem peca, e nao um Badge posicionado na mao", () => {
  withTheme(
    <Indicator count={7} label="7 avisos não lidos">
      <Button size="icon" aria-label="Avisos" />
    </Indicator>,
  );

  expect(screen.getByText("7")).toBeDefined();
  // A contagem precisa ser dita, e nao so vista.
  expect(screen.getByText("7 avisos não lidos")).toBeDefined();
});

test("a contagem grande vira um teto, em vez de esticar a pastilha", () => {
  withTheme(
    <Indicator count={150} max={99}>
      <Button size="icon" aria-label="Avisos" />
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

test("filho largo e acusado: a pastilha cobre conteudo, e nada reserva espaco", () => {
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

test("alvo pequeno nao e acusado: o sino, o item da barra e o avatar cabem nos 48px", () => {
  const warn = spyOn(console, "warn").mockImplementation(() => {});

  measuring(48, () =>
    withTheme(
      <Indicator count={3} label="3 avisos não lidos">
        <Button size="icon" aria-label="Avisos" />
      </Indicator>,
    ),
  );

  expect(warn).not.toHaveBeenCalled();
  expect(indicatorWidthComplaint(48)).toBeUndefined();
  expect(indicatorWidthComplaint(49)).toContain("49px");
  warn.mockRestore();
});

test("a moldura que mede ainda entrega o no a quem pediu por ref", () => {
  let node: HTMLSpanElement | null = null;

  withTheme(
    <Indicator count={3} label="3 avisos não lidos" ref={(element) => void (node = element)}>
      <Button size="icon" aria-label="Avisos" />
    </Indicator>,
  );

  expect(node).not.toBeNull();
  expect((node as unknown as HTMLElement).tagName).toBe("SPAN");
});

test("a fila de avatares corta o excedente e diz quantos sobraram", () => {
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

test("na fila sobreposta a inicial sai com uma letra so", () => {
  // Com duas letras a sobreposicao corta o texto, e a correcao e a peca tomar
  // essa decisao uma vez em vez de cinco times tomarem diferente.
  withTheme(
    <AvatarGroup>
      <Avatar fallback="AP" />
      <Avatar fallback="CN" />
    </AvatarGroup>,
  );

  expect(screen.getByText("A")).toBeDefined();
  expect(screen.queryByText("AP")).toBeNull();
});
