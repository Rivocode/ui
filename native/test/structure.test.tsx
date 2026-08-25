import { describe, expect, mock, test } from "bun:test";
import { Text } from "react-native";

import {
  Accordion,
  AccordionItem,
  AspectRatio,
  Badge,
  Collapsible,
  DescriptionItem,
  DescriptionList,
  PageHeader,
  Toggle,
  ToggleGroup,
} from "../src";
import { act, byRole, render, textOf } from "./helpers";

describe("Toggle e ToggleGroup", () => {
  test("o toggle anuncia apertado e alterna", () => {
    const onPressedChange = mock(() => {});
    const screen = render(
      <Toggle pressed onPressedChange={onPressedChange}>
        Negrito
      </Toggle>,
    );
    const [toggle] = byRole(screen, "togglebutton");
    expect(toggle.props.accessibilityState.selected).toBe(true);
    act(() => toggle.props.onPress());
    expect(onPressedChange).toHaveBeenCalledWith(false);
  });

  test("no grupo, single desaperta o anterior; o padrao acumula", () => {
    const items = [
      { label: "Paga", value: "paga" },
      { label: "Vencida", value: "vencida" },
    ];

    const single = mock(() => {});
    const one = render(
      <ToggleGroup items={items} value={["paga"]} onValueChange={single} single />,
    );
    act(() => byRole(one, "togglebutton")[1].props.onPress());
    expect(single).toHaveBeenCalledWith(["vencida"]);

    const multi = mock(() => {});
    const many = render(<ToggleGroup items={items} value={["paga"]} onValueChange={multi} />);
    act(() => byRole(many, "togglebutton")[1].props.onPress());
    expect(multi).toHaveBeenCalledWith(["paga", "vencida"]);
  });
});

describe("Accordion e Collapsible", () => {
  test("o item fechado esconde o corpo e anuncia expanded ao abrir", () => {
    const screen = render(
      <Accordion>
        <AccordionItem title="Como emitir?">
          <Text>Pelo botão Emitir nota.</Text>
        </AccordionItem>
      </Accordion>,
    );

    expect(textOf(screen)).not.toContain("Pelo botão");
    const [trigger] = byRole(screen, "button");
    expect(trigger.props.accessibilityState.expanded).toBe(false);

    act(() => trigger.props.onPress());
    expect(textOf(screen)).toContain("Pelo botão Emitir nota.");
  });

  test("o collapsible mostra-esconde com o mesmo contrato", () => {
    const screen = render(
      <Collapsible label="Ver o detalhe" defaultOpen>
        <Text>O detalhe inteiro.</Text>
      </Collapsible>,
    );
    expect(textOf(screen)).toContain("O detalhe inteiro.");
    act(() => byRole(screen, "button")[0].props.onPress());
    expect(textOf(screen)).not.toContain("O detalhe inteiro.");
  });
});

describe("PageHeader", () => {
  test("titulo, contexto, etiqueta e acoes no mesmo topo", () => {
    const screen = render(
      <PageHeader
        title="Notas fiscais"
        description="Agosto, até agora."
        badge={<Badge tone="accent">beta</Badge>}
        actions={<Text>Emitir</Text>}
      />,
    );
    for (const chunk of ["Notas fiscais", "Agosto, até agora.", "beta", "Emitir"]) {
      expect(textOf(screen)).toContain(chunk);
    }
  });
});

describe("DescriptionList", () => {
  test("cada linha e um par rotulo-valor, texto ou no", () => {
    const screen = render(
      <DescriptionList>
        <DescriptionItem label="Número">4813</DescriptionItem>
        <DescriptionItem label="Situação">
          <Badge tone="success">Paga</Badge>
        </DescriptionItem>
      </DescriptionList>,
    );
    expect(textOf(screen)).toContain("Número");
    expect(textOf(screen)).toContain("4813");
    expect(textOf(screen)).toContain("Paga");
  });
});

describe("AspectRatio", () => {
  test("a caixa reserva a proporcao pedida", () => {
    const screen = render(
      <AspectRatio ratio={16 / 9}>
        <Text>mapa</Text>
      </AspectRatio>,
    );
    const box = screen.root.findAll(
      (node) => typeof node.type === "string" && node.props.style?.aspectRatio === 16 / 9,
    );
    expect(box.length).toBe(1);
  });
});
