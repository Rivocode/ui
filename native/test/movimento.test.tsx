import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, mock, test } from "bun:test";
import { AccessibilityInfo, Text } from "react-native";
import { timingCalls } from "react-native-reanimated";

import { tokens } from "../tokens";
import {
  Accordion,
  AccordionItem,
  AlertDialog,
  Button,
  Collapsible,
  Dialog,
  Sheet,
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
});

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
      .map((node) => node.props.style as { transform?: { rotate: string }[] } | undefined)
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
      if (name === "motion.ts") continue;
      const code = readFileSync(file, "utf8");

      if (!/from "\.\/motion"/.test(code)) offenders.push(`${name}: nao importa ./motion`);
      for (const hit of code.matchAll(/withTiming\(([^;]*?)\)\s*;/g)) {
        if (!/motion\.timing\(/.test(hit[1]!))
          offenders.push(`${name}: withTiming sem motion.timing`);
      }
      for (const hit of code.matchAll(/\b(entering|exiting|layout)=\{([^}]*)\}/g)) {
        if (!hit[2]!.startsWith("motion.")) offenders.push(`${name}: ${hit[1]} sem motion.`);
      }
      for (const hit of code.matchAll(/animationType=(\{[^}]*\}|"[^"]*")/g)) {
        if (!/reduced \?/.test(hit[1]!)) offenders.push(`${name}: animationType sem reduced`);
      }
    }

    expect(offenders).toEqual([]);
  });
});
