import { describe, expect, mock, test } from "bun:test";
import type { ReactTestInstance, ReactTestRenderer } from "react-test-renderer";

import { FilterBar, FilterChip, type AppliedFilter } from "../src";
import { I18nManager } from "../../test/react-native-mock";
import { act, byClass, byLabel, byRole, byType, render, textOf } from "./helpers";

const APPLIED: AppliedFilter[] = [
  { id: "status", label: "Situação", value: "Em aberto" },
  { id: "customer", label: "Cliente", value: "Clínica São Lucas" },
];

function chipRoot(screen: ReactTestRenderer): ReactTestInstance {
  return byClass(screen, /gap-1 px-2\.5/)[0];
}

function cross(screen: ReactTestRenderer): ReactTestInstance | undefined {
  return byRole(screen, "button").find((node) =>
    String(node.props.accessibilityLabel).startsWith("Remover"),
  );
}

function clearButton(screen: ReactTestRenderer): ReactTestInstance | undefined {
  return byRole(screen, "button").find((node) => textOf2(node).startsWith("Limpar"));
}

function edges(screen: ReactTestRenderer): string[] {
  return byClass(screen, /\bw-px\b/).map((node) =>
    String(node.props.className).includes("left-0") ? "esquerda" : "direita",
  );
}

function settle(screen: ReactTestRenderer, frame: number, content: number): void {
  const [scroller] = byType(screen, "ScrollView");
  act(() => {
    scroller!.props.onLayout({ nativeEvent: { layout: { x: 0, y: 0, width: frame, height: 44 } } });
    scroller!.props.onContentSizeChange(content, 44);
  });
}

function scrollTo(screen: ReactTestRenderer, offset: number, frame: number, content: number): void {
  const [scroller] = byType(screen, "ScrollView");
  act(() =>
    scroller!.props.onScroll({
      nativeEvent: {
        contentOffset: { x: offset, y: 0 },
        contentSize: { width: content, height: 44 },
        layoutMeasurement: { width: frame, height: 44 },
      },
    }),
  );
}

function inRTL<T>(run: () => T): T {
  I18nManager.isRTL = true;
  try {
    return run();
  } finally {
    I18nManager.isRTL = false;
  }
}

function textOf2(node: ReactTestInstance): string {
  const found = node.findAll((child) => typeof child.type === "string" && child.type === "Text");
  return found.map((child) => String(child.props.children ?? "")).join(" ");
}

describe("FilterChip", () => {
  test("a ficha mostra o campo e o valor, e o valor tem o peso", () => {
    const screen = render(<FilterChip label="Cliente" value="Clínica São Lucas" />);

    expect(textOf(screen)).toContain("Cliente");
    const value = byType(screen, "Text").find(
      (node) => node.props.children === "Clínica São Lucas",
    );
    expect(value!.props.className).toContain("font-medium");
  });

  test("o xis diz qual filtro sai, e não só 'Remover'", () => {
    const screen = render(
      <FilterChip label="Cliente" value="Clínica São Lucas" onRemove={() => {}} />,
    );

    expect(byLabel(screen, "Remover filtro Cliente: Clínica São Lucas").length).toBe(1);
  });

  test("ficha sem valor cai para o nome do campo", () => {
    const screen = render(<FilterChip label="Cliente" onRemove={() => {}} />);

    expect(byLabel(screen, "Remover filtro Cliente").length).toBe(1);
  });

  test("o nome do xis se troca pelo labels.remove, como no TagsInput", () => {
    const screen = render(
      <FilterChip
        label="Emissão"
        value="01/08"
        labels={{ remove: (text) => `Tirar o filtro ${text}` }}
        onRemove={() => {}}
      />,
    );

    expect(byLabel(screen, "Tirar o filtro Emissão: 01/08").length).toBe(1);
  });

  test("sem onRemove a ficha não tem xis, que é como se mostra filtro travado", () => {
    const screen = render(<FilterChip label="Filial" value="Matriz" />);

    expect(byRole(screen, "button").length).toBe(0);
  });

  test("o alvo do xis chega aos 44pt sem engordar a pílula", () => {
    const screen = render(<FilterChip label="Cliente" value="Acme" onRemove={() => {}} />);

    expect(chipRoot(screen).props.className).toContain("h-11");
    expect(byClass(screen, /rounded-pill border border-border/)[0].props.className).toContain(
      "top-2 bottom-2",
    );

    const button = cross(screen)!;
    expect(String(button.props.className).split(" ")).toContain("self-stretch");
    expect(String(button.props.className).split(" ")).toContain("w-4");
    expect(button.props.hitSlop).toEqual({ top: 0, bottom: 0, left: 14, right: 14 });
  });

  test("a faixa de toque não encolhe com o size; a pílula sim", () => {
    const small = render(<FilterChip label="Cliente" value="Acme" size="sm" />);

    expect(byClass(small, /gap-1 px-2\b/)[0].props.className).toContain("h-11");
    expect(byClass(small, /rounded-pill border border-border/)[0].props.className).toContain(
      "top-2.5 bottom-2.5",
    );
  });

  test("o valor corta numa linha só e em 10rem, para não empurrar o vizinho", () => {
    const long = "Clínica São Lucas Serviços Médicos e Hospitalares Ltda";
    const screen = render(<FilterChip label="Cliente" value={long} />);
    const value = byType(screen, "Text").find((node) => node.props.children === long)!;

    expect(value.props.numberOfLines).toBe(1);
    expect(value.props.className).toContain("max-w-40");
  });

  test("a ficha não carrega cor literal nem tom de estado", () => {
    const screen = render(<FilterChip label="Cliente" value="Acme" onRemove={() => {}} />);
    const classes = byClass(screen, /./)
      .map((node) => String(node.props.className))
      .join(" ");

    expect(classes).not.toMatch(/#[0-9a-f]{3,6}|rgba?\(/i);
    expect(classes).not.toMatch(/bg-(success|warning|danger|info)/);
    expect(classes).toContain("rounded-pill");
  });

  test("a ficha desabilitada trava o xis e anuncia isso", () => {
    const screen = render(<FilterChip label="Cliente" value="Acme" onRemove={() => {}} disabled />);
    const button = cross(screen)!;

    expect(button.props.disabled).toBe(true);
    expect(button.props.accessibilityState.disabled).toBe(true);
    expect(chipRoot(screen).props.className).toContain("opacity-60");
  });
});

describe("FilterBar", () => {
  test("a fileira rola na horizontal e não quebra linha", () => {
    const screen = render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);
    const [scroller] = byType(screen, "ScrollView");

    expect(scroller.props.horizontal).toBe(true);
    expect(scroller.props.contentContainerClassName).toContain("flex-row");
    expect(scroller.props.contentContainerClassName).not.toContain("flex-wrap");
    expect(scroller.props.accessibilityRole).toBe("list");
    expect(scroller.props.accessibilityLabel).toBe("Filtros aplicados");
  });

  test("o limpar fica ancorado fora do trecho que rola", () => {
    const screen = render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);
    const [scroller] = byType(screen, "ScrollView");

    const inside = scroller.findAll(
      (node) => typeof node.type === "string" && node.props?.accessibilityRole === "button",
    );

    expect(byRole(screen, "button").length).toBe(3);
    expect(inside.length).toBe(2);
  });

  test("não colapsa em contador: cada filtro tem a própria ficha", () => {
    const screen = render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);

    expect(textOf(screen)).toContain("Situação");
    expect(textOf(screen)).toContain("Cliente");
    expect(textOf(screen)).not.toContain("+1");
  });

  test("o xis avisa qual filtro saiu e entrega o que sobrou", () => {
    const left = mock(() => {});
    const rest = mock(() => {});
    const screen = render(<FilterBar filters={APPLIED} onRemove={left} onFiltersChange={rest} />);

    act(() => byLabel(screen, "Remover filtro Cliente: Clínica São Lucas")[0].props.onPress());

    expect(left).toHaveBeenCalledWith(APPLIED[1]);
    expect(rest).toHaveBeenCalledWith([APPLIED[0]]);
  });

  test("a peça não guarda lista própria: sem quem mude o estado, a ficha continua lá", () => {
    const screen = render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);

    act(() => byLabel(screen, "Remover filtro Cliente: Clínica São Lucas")[0].props.onPress());

    expect(textOf(screen)).toContain("Clínica São Lucas");
  });

  test("filtro com removable false aparece sem xis", () => {
    const screen = render(
      <FilterBar
        filters={[{ id: "branch", label: "Filial", value: "Matriz", removable: false }, ...APPLIED]}
        onFiltersChange={() => {}}
      />,
    );

    expect(textOf(screen)).toContain("Filial");
    expect(byLabel(screen, "Remover filtro Filial: Matriz").length).toBe(0);
    expect(byLabel(screen, "Remover filtro Cliente: Clínica São Lucas").length).toBe(1);
  });

  test("o limpar aparece a partir de dois filtros, com a contagem dentro", () => {
    const one = render(<FilterBar filters={[APPLIED[0]!]} onFiltersChange={() => {}} />);
    expect(clearButton(one)).toBeUndefined();

    const two = render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);
    expect(textOf2(clearButton(two)!)).toBe("Limpar 2 filtros");
  });

  test("clearFrom troca a régua, e com 1 o limpar fica desde o primeiro", () => {
    const screen = render(
      <FilterBar filters={[APPLIED[0]!]} onFiltersChange={() => {}} clearFrom={1} />,
    );

    expect(textOf2(clearButton(screen)!)).toBe("Limpar 1 filtro");
  });

  test("o limpar avisa antes e entrega a lista vazia depois", () => {
    const cleared = mock(() => {});
    const rest = mock(() => {});
    const screen = render(<FilterBar filters={APPLIED} onClear={cleared} onFiltersChange={rest} />);

    act(() => clearButton(screen)!.props.onPress());

    expect(cleared).toHaveBeenCalled();
    expect(rest).toHaveBeenCalledWith([]);
  });

  test("sem quem escute, não há limpar nem xis: botão que não faz nada é mentira", () => {
    const screen = render(<FilterBar filters={APPLIED} />);

    expect(byRole(screen, "button").length).toBe(0);
  });

  test("a linha fica guardada quando não há filtro, e o que ela guarda é um alvo de toque", () => {
    const screen = render(<FilterBar filters={[]} onFiltersChange={() => {}} />);
    const [row] = byClass(screen, /w-full flex-row/);

    expect(row.props.className).toContain("h-11");
    expect(textOf(screen)).toContain("Nenhum filtro aplicado");
  });

  test("reserve false some com a linha e mantém o aviso montado", () => {
    const screen = render(<FilterBar filters={[]} onFiltersChange={() => {}} reserve={false} />);
    const [row] = byClass(screen, /w-full flex-row/);

    expect(row.props.className).not.toContain("h-11");
    expect(byLabel(screen, "Nenhum filtro aplicado").length).toBe(1);
  });

  test("a contagem sai num aviso vivo, que é onde quem ouve fica sabendo que mudou", () => {
    for (const [filters, said] of [
      [[], "Nenhum filtro aplicado"],
      [[APPLIED[0]!], "1 filtro aplicado"],
      [APPLIED, "2 filtros aplicados"],
    ] as const) {
      const screen = render(<FilterBar filters={[...filters]} onFiltersChange={() => {}} />);
      const [live] = byLabel(screen, said);

      expect(live).toBeDefined();
      expect(live.props.accessibilityLiveRegion).toBe("polite");
    }
  });

  test("com filtro na tela o aviso vivo sai do fluxo, para não abrir buraco na fileira", () => {
    const screen = render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);
    const [live] = byLabel(screen, "2 filtros aplicados");

    expect(live.props.className).toContain("absolute");
    expect(live.props.children).toBe("");
  });

  test("tudo cabendo, nenhuma borda aparece", () => {
    const screen = render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);
    settle(screen, 390, 300);

    expect(edges(screen)).toEqual([]);
  });

  test("com ficha escondida à direita, a borda avisa desse lado antes de qualquer toque", () => {
    const screen = render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);
    settle(screen, 390, 1429);

    expect(edges(screen)).toEqual(["direita"]);
  });

  test("no meio da rolagem há filtro escondido dos dois lados, e as duas bordas dizem isso", () => {
    const screen = render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);
    scrollTo(screen, 400, 390, 1429);

    expect(edges(screen).sort()).toEqual(["direita", "esquerda"]);
  });

  test("no fim da rolagem só a borda de trás fica, porque à frente não sobrou nada", () => {
    const screen = render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);
    scrollTo(screen, 1039, 390, 1429);

    expect(edges(screen)).toEqual(["esquerda"]);
  });

  test("a borda não custa largura da fileira nem come o arrasto que começa nela", () => {
    const screen = render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);
    settle(screen, 390, 1429);
    const [rule] = byClass(screen, /\bw-px\b/);

    expect(rule!.props.pointerEvents).toBe("none");
    expect(rule!.props.className).toContain("absolute");
    expect(rule!.props.className).toContain("bg-border-strong");
    expect(String(rule!.props.className)).not.toMatch(/#[0-9a-f]{3,6}|rgba?\(/i);
  });

  test("o disabled trava o xis e o limpar de uma vez", () => {
    const screen = render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} disabled />);

    expect(clearButton(screen)!.props.disabled).toBe(true);
    for (const button of byLabel(screen, "Remover filtro Cliente: Clínica São Lucas")) {
      expect(button.props.disabled).toBe(true);
    }
  });
});

describe("FilterBar em rtl", () => {
  test("em repouso a fileira já está no começo da leitura, e a régua avisa o lado que ficou para trás", () => {
    const ltr = render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);
    settle(ltr, 390, 1429);
    expect(edges(ltr)).toEqual(["direita"]);

    const screen = inRTL(() => {
      const rendered = render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);
      settle(rendered, 390, 1429);
      return rendered;
    });

    expect(edges(screen)).toEqual(["esquerda"]);
  });

  test("com o evento na mão a conta é física, e o mesmo contentOffset dá a mesma régua nos dois sentidos", () => {
    for (const [offset, said] of [
      [0, "direita"],
      [1039, "esquerda"],
    ] as const) {
      const ltr = render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);
      scrollTo(ltr, offset, 390, 1429);
      expect(edges(ltr)).toEqual([said]);

      const screen = inRTL(() => {
        const rendered = render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);
        scrollTo(rendered, offset, 390, 1429);
        return rendered;
      });

      expect(edges(screen)).toEqual([said]);
    }
  });

  test("no meio da rolagem em rtl as duas réguas continuam aparecendo", () => {
    const screen = inRTL(() => {
      const rendered = render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);
      scrollTo(rendered, 639, 390, 1429);
      return rendered;
    });

    expect(edges(screen).sort()).toEqual(["direita", "esquerda"]);
  });

  test("em rtl, tudo cabendo, nenhuma régua aparece", () => {
    const screen = inRTL(() => {
      const rendered = render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);
      settle(rendered, 390, 300);
      return rendered;
    });

    expect(edges(screen)).toEqual([]);
  });

  test("o ScrollView não leva contentOffset: quem para no começo da leitura é o próprio React Native", () => {
    const ltr = render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);
    const screen = inRTL(() => render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />));

    for (const rendered of [ltr, screen]) {
      const [scroller] = byType(rendered, "ScrollView");
      expect(scroller.props.contentOffset).toBeUndefined();
      expect(scroller.props.contentContainerClassName).toContain("flex-row");
      expect(scroller.props.contentContainerClassName).not.toContain("row-reverse");
    }
  });

  test("a fileira não espelha de novo o que o RN já espelha: a ordem das fichas é a da lista", () => {
    const screen = inRTL(() => render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />));
    const said = byType(screen, "Text")
      .map((node) => String(node.props.children ?? ""))
      .filter((text) => text.length > 0);

    expect(said.indexOf("Situação")).toBeLessThan(said.indexOf("Cliente"));
  });

  test("o limpar não se cola por margem física: o espaço vem do gap da fileira", () => {
    const screen = render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);
    const [row] = byClass(screen, /w-full flex-row/);

    expect(String(row.props.className).split(" ")).toContain("gap-2");
    expect(String(clearButton(screen)!.props.className ?? "")).not.toMatch(/\b(ml|mr)-\d/);
  });
});
