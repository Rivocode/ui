import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, mock, test } from "bun:test";
import { AccessibilityInfo, Text } from "react-native";
import { repeatCalls, timingCalls } from "react-native-reanimated";
import type { ReactElement } from "react";

import { tokens } from "../tokens";
import {
  Accordion,
  AccordionItem,
  AlertDialog,
  Button,
  Calendar,
  Checkbox,
  Collapsible,
  Dialog,
  Field,
  Meter,
  Progress,
  RadioGroup,
  RivoProvider,
  Sheet,
  Skeleton,
  Steps,
  Tabs,
  TagsInput,
  Toggle,
  useToast,
} from "../src";
import { act, byRole, byType, render } from "./helpers";

type Timing = { to: number; config: { duration: number; easing: unknown; reduceMotion: string } };
type Built = {
  preset: string;
  config: { duration: number; easing: unknown; reduceMotion: string };
};

const reduceMotion = (enabled: boolean) =>
  act(() =>
    (AccessibilityInfo as unknown as { setReduceMotion: (next: boolean) => void }).setReduceMotion(
      enabled,
    ),
  );

const timings = () => timingCalls as unknown as Timing[];

afterEach(() => {
  reduceMotion(false);
  timingCalls.length = 0;
  repeatCalls.length = 0;
});

const swap = (screen: ReturnType<typeof render>, element: ReactElement) =>
  act(() => screen.update(<RivoProvider>{element}</RivoProvider>));

const views = (screen: ReturnType<typeof render>) => byType(screen, "View");

const entered = (screen: ReturnType<typeof render>) =>
  views(screen)
    .map((node) => node.props.entering as Built | undefined)
    .filter((built): built is Built => built !== undefined);

const bezier = (name: keyof typeof tokens.easings) => ({ bezier: [...tokens.easings[name]] });

describe("os tokens de movimento", () => {
  test("a curva e as duracoes do nativo sao as do forma.css do web", () => {
    const css = readFileSync(
      fileURLToPath(new URL("../../src/tokens/forma.css", import.meta.url)),
      "utf8",
    );
    const root = css.slice(0, css.indexOf("}"));

    const curve = (name: string) =>
      new RegExp(`--rc-${name}:\\s*cubic-bezier\\(([^)]+)\\)`)
        .exec(root)![1]!
        .split(",")
        .map((point) => Number(point.trim()));
    const duration = (name: string) =>
      Number(new RegExp(`--rc-duration-${name}:\\s*(\\d+)ms`).exec(root)![1]);

    expect([...tokens.easings.ease]).toEqual(curve("ease"));
    expect([...tokens.easings["ease-sheet"]]).toEqual(curve("ease-sheet"));
    for (const name of ["fast", "base", "slow", "sheet"] as const) {
      expect(tokens.scales[`duration-${name}`]).toBe(duration(name));
    }
    expect(tokens.scales["duration-fast"]).toBeGreaterThan(0);
  });
});

describe("Button", () => {
  const scaleOf = (node: { props: { style?: unknown } }) => {
    const layers = ([] as unknown[]).concat(node.props.style ?? []);
    const animated = layers.find(
      (layer): layer is { transform: { scale: number }[] } =>
        typeof layer === "object" && layer !== null && "transform" in layer,
    );
    return animated?.transform[0]?.scale;
  };

  test("o toque afunda o botao com a duracao e a curva da casa, e o soltar devolve", () => {
    const onPressIn = mock(() => {});
    const screen = render(<Button onPressIn={onPressIn}>Emitir</Button>);
    const [button] = byRole(screen, "button");
    expect(scaleOf(button!)).toBe(1);

    act(() => button!.props.onPressIn({}));
    expect(onPressIn).toHaveBeenCalledTimes(1);
    expect(timings().at(-1)).toEqual({
      to: 1,
      config: {
        duration: tokens.scales["duration-fast"],
        easing: bezier("ease"),
        reduceMotion: "never",
      },
    });
    expect(scaleOf(byRole(screen, "button")[0]!)).toBeCloseTo(0.97);

    act(() => byRole(screen, "button")[0]!.props.onPressOut({}));
    expect(timings().at(-1)!.to).toBe(0);
    expect(timings().at(-1)!.config.duration).toBe(tokens.scales["duration-base"]);
    expect(scaleOf(byRole(screen, "button")[0]!)).toBe(1);
  });

  test("com reduzir movimento, o toque nao escala e o handler de quem usa continua valendo", () => {
    reduceMotion(true);
    const onPressIn = mock(() => {});
    const screen = render(<Button onPressIn={onPressIn}>Emitir</Button>);
    const [button] = byRole(screen, "button");
    const before = timings().length;

    act(() => button!.props.onPressIn({}));
    expect(onPressIn).toHaveBeenCalledTimes(1);
    expect(timings().slice(before)).toEqual([]);
    expect(scaleOf(byRole(screen, "button")[0]!)).toBeUndefined();
    expect(button!.props.className.split(" ")).toContain("active:bg-accent-active");
  });
});

describe("useToast", () => {
  function Emitter() {
    const toast = useToast();
    return <Button onPress={() => toast.add({ title: "Nota emitida" })}>Emitir</Button>;
  }

  const toastLayer = (screen: ReturnType<typeof render>) =>
    byType(screen, "View").find((node) => node.props.entering !== undefined || node.props.layout);

  test("o aviso sobe e desce com os tokens slow e base", () => {
    const screen = render(<Emitter />);
    act(() => byRole(screen, "button")[0]!.props.onPress());

    const layer = toastLayer(screen)!;
    const entering = layer.props.entering as Built;
    const exiting = layer.props.exiting as Built;
    expect(entering.preset).toBe("FadeInDown");
    expect(entering.config).toEqual({
      duration: tokens.scales["duration-slow"],
      easing: bezier("ease"),
      reduceMotion: "never",
    });
    expect(exiting.preset).toBe("FadeOutDown");
    expect(exiting.config.duration).toBe(tokens.scales["duration-base"]);
    expect((layer.props.layout as Built).preset).toBe("LinearTransition");
  });

  test("com reduzir movimento, o aviso aparece sem animacao nenhuma", () => {
    reduceMotion(true);
    const screen = render(<Emitter />);
    act(() => byRole(screen, "button")[0]!.props.onPress());

    const live = byType(screen, "View").find((node) => node.props.accessibilityLiveRegion);
    expect(live).toBeDefined();
    const animated = byType(screen, "View").filter(
      (node) => node.props.entering || node.props.exiting || node.props.layout,
    );
    expect(animated).toEqual([]);
  });
});

describe("Accordion e Collapsible", () => {
  const turnOf = (screen: ReturnType<typeof render>) =>
    byType(screen, "View")
      .map(
        (node) =>
          Object.assign({}, ...[node.props.style].flat()) as { transform?: { rotate: string }[] },
      )
      .find((style) => style?.transform?.[0]?.rotate !== undefined)!.transform![0]!.rotate;

  test("a seta gira meia volta no tempo base, e o corpo entra por fade", () => {
    const screen = render(
      <Accordion>
        <AccordionItem title="Como emitir?">
          <Text>Pelo botão Emitir nota.</Text>
        </AccordionItem>
      </Accordion>,
    );
    expect(turnOf(screen)).toBe("0deg");

    act(() => byRole(screen, "button")[0]!.props.onPress());
    expect(turnOf(screen)).toBe("180deg");
    expect(timings().at(-1)).toEqual({
      to: 1,
      config: {
        duration: tokens.scales["duration-base"],
        easing: bezier("ease"),
        reduceMotion: "never",
      },
    });

    const body = byType(screen, "View").find((node) => node.props.entering)!;
    expect((body.props.entering as Built).preset).toBe("FadeIn");
    expect((body.props.exiting as Built).preset).toBe("FadeOut");
    const item = byType(screen, "View").find((node) => node.props.layout)!;
    expect((item.props.layout as Built).preset).toBe("LinearTransition");
    expect((item.props.layout as Built).config.duration).toBe(tokens.scales["duration-base"]);
  });

  test("com reduzir movimento, a seta salta e nada entra nem sai animado", () => {
    reduceMotion(true);
    const screen = render(
      <Collapsible label="Ver o detalhe">
        <Text>O detalhe inteiro.</Text>
      </Collapsible>,
    );
    act(() => byRole(screen, "button")[0]!.props.onPress());

    expect(turnOf(screen)).toBe("180deg");
    expect(timings().at(-1)!.config).toEqual({
      duration: 0,
      easing: bezier("ease"),
      reduceMotion: "always",
    });
    const animated = byType(screen, "View").filter(
      (node) => node.props.entering || node.props.exiting || node.props.layout,
    );
    expect(animated).toEqual([]);
  });
});

describe("Dialog, AlertDialog e Sheet", () => {
  const modalOf = (screen: ReturnType<typeof render>) => byType(screen, "Modal")[0]!;

  test("abrem com o movimento da plataforma, e sem ele quando o sistema pede", () => {
    const dialog = () => <Dialog open onOpenChange={() => {}} title="Nota 4813" />;
    const alert = () => (
      <AlertDialog
        open
        onOpenChange={() => {}}
        title="Cancelar a nota?"
        description="Não dá para desfazer."
        actionLabel="Cancelar nota"
        onAction={() => {}}
      />
    );
    const sheet = () => <Sheet open onOpenChange={() => {}} title="Filtros" />;

    expect(modalOf(render(dialog())).props.animationType).toBe("fade");
    expect(modalOf(render(alert())).props.animationType).toBe("fade");
    expect(modalOf(render(sheet())).props.animationType).toBe("slide");

    reduceMotion(true);
    expect(modalOf(render(dialog())).props.animationType).toBe("none");
    expect(modalOf(render(alert())).props.animationType).toBe("none");
    expect(modalOf(render(sheet())).props.animationType).toBe("none");
  });

  test("a preferencia trocada com a tela aberta vale na hora, sem remontar", () => {
    const screen = render(<Sheet open onOpenChange={() => {}} title="Filtros" />);
    expect(modalOf(screen).props.animationType).toBe("slide");

    reduceMotion(true);
    expect(modalOf(screen).props.animationType).toBe("none");

    reduceMotion(false);
    expect(modalOf(screen).props.animationType).toBe("slide");
  });
});

const SOURCE = fileURLToPath(new URL("../src", import.meta.url));

function walk(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) found.push(...walk(path));
    else if (/\.tsx?$/.test(path)) found.push(path);
  }
  return found;
}

function sourceFiles(): string[] {
  const found = walk(SOURCE);
  expect(found.length).toBeGreaterThan(60);
  return found;
}

describe("nenhuma peca anima por fora do useMotion", () => {
  test("todo movimento do pacote passa pela preferencia do sistema", () => {
    const files = sourceFiles();

    const animating = files.filter((file) =>
      /react-native-reanimated|animationType/.test(readFileSync(file, "utf8")),
    );
    expect(animating.length).toBeGreaterThan(4);

    const offenders: string[] = [];
    for (const file of animating) {
      const name = file.slice(SOURCE.length + 1);
      if (name === "motion.tsx") continue;
      const code = readFileSync(file, "utf8");

      if (!/from "\.\/motion"/.test(code)) offenders.push(`${name}: nao importa ./motion`);
      for (const hit of code.matchAll(/withTiming\(([^;]*?)\)\s*;/g)) {
        if (!/motion\.(timing\(|pulse)/.test(hit[1]!))
          offenders.push(`${name}: withTiming sem motion.timing`);
      }
      for (const hit of code.matchAll(/\b(entering|exiting|layout)=\{([^}]*)\}/g)) {
        if (!/\bmotion\./.test(hit[2]!)) offenders.push(`${name}: ${hit[1]} sem motion.`);
      }
      for (const hit of code.matchAll(/animationType=(\{[^}]*\}|"[^"]*")/g)) {
        if (!/reduced \?/.test(hit[1]!)) offenders.push(`${name}: animationType sem reduced`);
      }
    }

    expect(offenders).toEqual([]);
  });
});

describe("barras que andam: Progress, Meter e Steps", () => {
  const widthOf = (screen: ReturnType<typeof render>) =>
    views(screen)
      .map((node) => node.props.style as { width?: string } | undefined)
      .find((style) => typeof style?.width === "string")!.width;

  test("a barra nasce no valor, sem animar, e anda ate o novo no tempo slow", () => {
    const screen = render(<Progress value={20} label="Envio" />);
    expect(widthOf(screen)).toBe("20%");

    timingCalls.length = 0;
    swap(screen, <Progress value={60} label="Envio" />);
    expect(widthOf(screen)).toBe("60%");
    expect(timings().at(-1)).toEqual({
      to: 60,
      config: {
        duration: tokens.scales["duration-slow"],
        easing: bezier("ease"),
        reduceMotion: "never",
      },
    });

    const meter = render(<Meter value={3} max={4} label="Cota" />);
    expect(widthOf(meter)).toBe("75%");
  });

  test("o passo novo entra por fade e a barra do Steps anda; o primeiro nao anima", () => {
    const steps = [
      { id: "dados", title: "Dados" },
      { id: "revisao", title: "Revisão" },
    ];
    const screen = render(<Steps steps={steps} current={0} />);
    expect(entered(screen)).toEqual([]);
    expect(widthOf(screen)).toBe("50%");

    swap(screen, <Steps steps={steps} current={1} />);
    expect(entered(screen).map((built) => built.preset)).toEqual(["FadeIn"]);
    expect(widthOf(screen)).toBe("100%");
    expect(timings().at(-1)!.config.duration).toBe(tokens.scales["duration-slow"]);
  });

  test("com reduzir movimento, a barra salta e o passo troca parado", () => {
    reduceMotion(true);
    const steps = [
      { id: "dados", title: "Dados" },
      { id: "revisao", title: "Revisão" },
    ];
    const screen = render(<Steps steps={steps} current={0} />);
    swap(screen, <Steps steps={steps} current={1} />);
    expect(entered(screen)).toEqual([]);
    expect(timings().at(-1)!.config).toEqual({
      duration: 0,
      easing: bezier("ease"),
      reduceMotion: "always",
    });
  });
});

describe("formulario: Field, Checkbox, RadioGroup, Toggle e TagsInput", () => {
  test("o erro que chega depois entra por fade; o que ja estava nao anima", () => {
    const field = (error?: string) => (
      <Field label="CNPJ" description="Só os números." error={error}>
        <Text>campo</Text>
      </Field>
    );
    const screen = render(field());
    expect(entered(screen)).toEqual([]);

    swap(screen, field("CNPJ inválido."));
    const [built] = entered(screen);
    expect(built!.preset).toBe("FadeIn");
    expect(built!.config.duration).toBe(tokens.scales["duration-base"]);
  });

  test("a marca do Checkbox e do RadioGroup aparece crescendo, e so ao marcar", () => {
    const box = (checked: boolean) => <Checkbox checked={checked} onCheckedChange={() => {}} />;
    const born = render(box(true));
    expect(entered(born)).toEqual([]);

    const screen = render(box(false));
    swap(screen, box(true));
    expect(entered(screen).map(({ preset, config }) => ({ preset, config }))).toEqual([
      {
        preset: "ZoomIn",
        config: {
          duration: tokens.scales["duration-fast"],
          easing: bezier("ease"),
          reduceMotion: "never",
        },
      },
    ]);

    const items = [
      { label: "Pix", value: "pix" },
      { label: "Boleto", value: "boleto" },
    ];
    const radio = render(<RadioGroup items={items} value="pix" onValueChange={() => {}} />);
    expect(entered(radio)).toEqual([]);
    swap(radio, <RadioGroup items={items} value="boleto" onValueChange={() => {}} />);
    expect(entered(radio).map((built) => built.preset)).toEqual(["ZoomIn"]);
  });

  test("o Toggle afunda no toque como o Button", () => {
    const screen = render(
      <Toggle pressed={false} onPressedChange={() => {}}>
        Negrito
      </Toggle>,
    );
    act(() => byRole(screen, "togglebutton")[0]!.props.onPressIn({}));
    expect(timings().at(-1)!.config.duration).toBe(tokens.scales["duration-fast"]);
    const layers = ([] as unknown[]).concat(byRole(screen, "togglebutton")[0]!.props.style);
    expect(layers).toContainEqual({ transform: [{ scale: 0.97 }] });
  });

  test("a ficha nova do TagsInput entra crescendo, sai por fade, e as outras se reacomodam", () => {
    const tags = (value: string[]) => (
      <TagsInput value={value} onValueChange={() => {}} accessibilityLabel="Etiquetas" />
    );
    const screen = render(tags(["nfse"]));
    expect(entered(screen)).toEqual([]);

    swap(screen, tags(["nfse", "iss"]));
    const chips = views(screen).filter((node) => node.props.layout);
    expect(chips.length).toBe(2);
    expect(chips.map((chip) => (chip.props.exiting as Built).preset)).toEqual([
      "FadeOut",
      "FadeOut",
    ]);
    expect((chips[1]!.props.entering as Built).preset).toBe("ZoomIn");
  });

  test("com reduzir movimento, nenhuma peca de formulario anima", () => {
    reduceMotion(true);
    const field = render(
      <Field label="CNPJ">
        <Text>campo</Text>
      </Field>,
    );
    swap(
      field,
      <Field label="CNPJ" error="CNPJ inválido.">
        <Text>campo</Text>
      </Field>,
    );
    const box = render(<Checkbox checked={false} onCheckedChange={() => {}} />);
    swap(box, <Checkbox checked onCheckedChange={() => {}} />);
    const tags = render(<TagsInput value={[]} onValueChange={() => {}} />);
    swap(tags, <TagsInput value={["iss"]} onValueChange={() => {}} />);

    for (const screen of [field, box, tags]) {
      const animated = views(screen).filter(
        (node) => node.props.entering || node.props.exiting || node.props.layout,
      );
      expect(animated).toEqual([]);
    }
  });
});

describe("Tabs", () => {
  const items = [
    { label: "Mês", value: "mes" },
    { label: "Ano", value: "ano" },
  ];

  const lay = (screen: ReturnType<typeof render>) => {
    const tabs = byRole(screen, "tab");
    act(() => tabs[0]!.props.onLayout({ nativeEvent: { layout: { x: 2, width: 100 } } }));
    act(() => tabs[1]!.props.onLayout({ nativeEvent: { layout: { x: 102, width: 100 } } }));
  };

  const indicatorOf = (screen: ReturnType<typeof render>) =>
    views(screen).find((node) => node.props.className?.split(" ").includes("bg-surface-raised"));

  test("antes de medir, a aba ativa se pinta sozinha; medida, o indicador desliza no tempo base", () => {
    const screen = render(<Tabs items={items} value="mes" onValueChange={() => {}} />);
    expect(byRole(screen, "tab")[0]!.props.className.split(" ")).toContain("bg-surface-raised");

    lay(screen);
    expect(byRole(screen, "tab")[0]!.props.className.split(" ")).not.toContain("bg-surface-raised");
    expect(indicatorOf(screen)!.props.style).toEqual({
      left: 0,
      width: 100,
      transform: [{ translateX: 2 }],
    });
    expect(timings()).toEqual([]);

    swap(screen, <Tabs items={items} value="ano" onValueChange={() => {}} />);
    expect(indicatorOf(screen)!.props.style.transform).toEqual([{ translateX: 102 }]);
    expect(timings().map((call) => call.to)).toEqual([102, 100]);
    expect(timings()[0]!.config.duration).toBe(tokens.scales["duration-base"]);
  });

  test("com reduzir movimento, o indicador salta", () => {
    reduceMotion(true);
    const screen = render(<Tabs items={items} value="mes" onValueChange={() => {}} />);
    lay(screen);
    const before = timings().length;
    swap(screen, <Tabs items={items} value="ano" onValueChange={() => {}} />);
    const moved = timings().slice(before);
    expect(moved.map((call) => call.to)).toEqual([102, 100]);
    expect(moved.every((call) => call.config.duration === 0)).toBe(true);
  });
});

describe("Skeleton e Calendar", () => {
  test("o Skeleton pulsa sem fim no ciclo do web, e fica parado com reduzir movimento", () => {
    render(<Skeleton className="h-4 w-24" />);
    expect(repeatCalls.at(-1)).toEqual({ times: -1, steps: [0.5, 1] });
    expect(timings().at(-1)!.config.duration).toBe(1000);

    repeatCalls.length = 0;
    reduceMotion(true);
    repeatCalls.length = 0;
    const still = render(<Skeleton className="h-4 w-24" />);
    expect(repeatCalls).toEqual([]);
    const bone = views(still).find((node) =>
      node.props.className?.split(" ").includes("bg-skeleton"),
    );
    expect(bone!.props.style).toEqual({ opacity: 1 });
  });

  test("o mes seguinte entra por fade, e o primeiro nao anima", () => {
    const screen = render(<Calendar value="2026-08-10" onValueChange={() => {}} />);
    expect(entered(screen)).toEqual([]);

    act(() =>
      byRole(screen, "button")
        .find((node) => node.props.accessibilityLabel === "Mês seguinte")!
        .props.onPress(),
    );
    expect(entered(screen).map((built) => built.preset)).toEqual(["FadeIn"]);
  });
});
