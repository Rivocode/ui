import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "../src/components/collapsible";
import { ScrollArea } from "../src/components/scroll-area";
import { Slider } from "../src/components/slider";
import { Meter } from "../src/components/meter";
import { NumberField } from "../src/components/number-field";
import { OTPField } from "../src/components/otp-field";
import { Menubar } from "../src/components/menubar";
import { ToolbarButton, ToolbarRoot } from "../src/components/toolbar";
import { CheckboxGroup } from "../src/components/checkbox-group";
import { Checkbox } from "../src/components/checkbox";
import { FieldsetLegend, FieldsetRoot } from "../src/components/fieldset";
import { Field, FieldLabel, Input } from "../src/components/field";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "../src/components/navigation-menu";

function comTema(no: React.ReactNode) {
  return render(<RivoProvider scope="local">{no}</RivoProvider>);
}

test("o bloco que esconde abre e fecha", () => {
  comTema(
    <Collapsible>
      <CollapsibleTrigger>Chaves de recuperacao</CollapsibleTrigger>
      <CollapsiblePanel>alien-bean-pasta</CollapsiblePanel>
    </Collapsible>,
  );
  const gatilho = screen.getByRole("button", { name: /Chaves/ });
  expect(gatilho.getAttribute("aria-expanded")).toBe("false");
  fireEvent.click(gatilho);
  expect(gatilho.getAttribute("aria-expanded")).toBe("true");
});

test("a area de rolagem entrega o conteudo, e nao so a moldura", () => {
  comTema(
    <ScrollArea className="h-20">
      <p>Texto comprido</p>
    </ScrollArea>,
  );
  expect(screen.getByText("Texto comprido")).toBeDefined();
});

test("o controle de faixa conta o valor", () => {
  comTema(<Slider defaultValue={25} label="Desconto" showValue thumbLabel="Desconto" />);
  const pino = screen.getByRole("slider");
  expect(pino.getAttribute("aria-valuenow")).toBe("25");
  expect(screen.getByText("Desconto")).toBeDefined();
});

test("a medida de capacidade nao se anuncia como progresso", () => {
  comTema(<Meter value={24} max={100} label="Espaco usado" showValue />);
  const medida = screen.getByRole("meter");
  expect(medida.getAttribute("aria-valuenow")).toBe("24");
  expect(screen.queryByRole("progressbar")).toBeNull();
});

test("o campo de numero anda de passo em passo, dentro do limite", () => {
  comTema(<NumberField defaultValue={2} min={0} max={3} />);
  const campo = screen.getByRole("textbox") as HTMLInputElement;
  expect(campo.value).toBe("2");

  fireEvent.click(screen.getByLabelText("Aumentar"));
  expect(campo.value).toBe("3");

  fireEvent.click(screen.getByLabelText("Aumentar"));
  expect(campo.value).toBe("3");
});

test("o codigo de verificacao abre uma casa por digito", () => {
  const { container } = comTema(<OTPField length={6} />);

  // A raiz da Base UI renderiza um input escondido, que e quem guarda o codigo
  // inteiro e recebe a colagem. As casas visiveis sao as outras.
  const guarda = container.querySelector("input[data-length]")!;
  const casas = [...container.querySelectorAll("input")].filter((casa) => casa !== guarda);

  expect(casas.length).toBe(6);
  expect(guarda.getAttribute("autocomplete")).toBe("one-time-code");
  expect(guarda.getAttribute("inputmode")).toBe("numeric");
});

test("a barra de menus agrupa os menus numa peca so", () => {
  comTema(<Menubar aria-label="Principal" />);
  expect(screen.getByLabelText("Principal")).toBeDefined();
});

test("a barra de ferramentas junta os botoes numa parada de tabulacao", () => {
  comTema(
    <ToolbarRoot aria-label="Formatacao">
      <ToolbarButton>Negrito</ToolbarButton>
      <ToolbarButton>Italico</ToolbarButton>
    </ToolbarRoot>,
  );
  const barra = screen.getByRole("toolbar");
  expect(barra.getAttribute("aria-label")).toBe("Formatacao");
  expect(screen.getAllByRole("button").length).toBe(2);
});

test("o grupo de caixas guarda a escolha em lista", () => {
  // Sem <label> em volta: no happy-dom o clique no botao sobe para o rotulo,
  // que devolve outro clique ao mesmo controle e a marcacao volta ao inicio.
  comTema(
    <CheckboxGroup defaultValue={["pix"]} aria-label="Formas">
      <Checkbox name="forma" value="pix" aria-label="Pix" />
      <Checkbox name="forma" value="boleto" aria-label="Boleto" />
    </CheckboxGroup>,
  );
  const caixas = screen.getAllByRole("checkbox");
  expect(caixas[0]!.getAttribute("aria-checked")).toBe("true");
  fireEvent.click(caixas[1]!);
  expect(caixas[1]!.getAttribute("aria-checked")).toBe("true");
});

test("a legenda entra na leitura do campo dentro dela", () => {
  comTema(
    <FieldsetRoot>
      <FieldsetLegend>Endereco</FieldsetLegend>
      <Field>
        <FieldLabel>Numero</FieldLabel>
        <Input placeholder="123" />
      </Field>
    </FieldsetRoot>,
  );
  const grupo = screen.getByRole("group");
  expect(grupo.textContent).toContain("Endereco");
  expect(screen.getByPlaceholderText("123")).toBeDefined();
});

test("a navegacao de topo se anuncia como navegacao", () => {
  comTema(
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>,
  );
  expect(screen.getByRole("navigation")).toBeDefined();
  expect(screen.getByText("Produtos")).toBeDefined();
});

test("o provedor espelha o sentido da escrita", () => {
  render(
    <RivoProvider scope="local" dir="rtl">
      <p>Direita para esquerda</p>
    </RivoProvider>,
  );
  const casca = screen.getByText("Direita para esquerda").closest("[data-rc-theme]")!;
  expect(casca.getAttribute("dir")).toBe("rtl");
});
