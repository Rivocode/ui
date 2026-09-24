import { expect, mock, test } from "bun:test";

import { Rating, type RatingProps } from "../src";
import { act, byRole, byType, render } from "./helpers";

function rating(props: Partial<RatingProps> = {}) {
  const onValueChange = mock<(value: number) => void>(() => {});
  const screen = render(<Rating value={0} onValueChange={onValueChange} {...props} />);
  return { screen, onValueChange };
}

const fills = (screen: ReturnType<typeof render>) =>
  screen.root
    .findAll((node) => typeof node.type === "string" && node.props.testID === "rating-fill")
    .map((node) => node.props.style.width as number);

const tap = (screen: ReturnType<typeof render>, index: number, locationX = 30) =>
  act(() => byType(screen, "Pressable")[index]!.props.onPress({ nativeEvent: { locationX } }));

test("o grupo e um controle ajustavel so, com o nome e a nota dita por extenso", () => {
  const { screen } = rating({ value: 3 });
  const [group] = byRole(screen, "adjustable");
  expect(group!.props.accessibilityLabel).toBe("Avaliação");
  expect(group!.props.accessibilityValue).toEqual({ min: 0, max: 5, now: 3, text: "3 estrelas" });
});

test("as estrelas ficam fora da arvore de acessibilidade, e cada uma tem 44pt de alvo", () => {
  const { screen } = rating({ size: "sm" });
  const stars = byType(screen, "Pressable");
  expect(stars).toHaveLength(5);
  for (const star of stars)
    expect(star.props.importantForAccessibility).toBe("no-hide-descendants");

  const boxes = screen.root.findAll(
    (node) => typeof node.type === "string" && node.props.testID === "rating-star",
  );
  expect(boxes.every((box) => box.props.style.width === 44 && box.props.style.height === 44)).toBe(
    true,
  );
});

test("tocar a terceira estrela escolhe 3, e a nota pinta ate ela", () => {
  const { screen, onValueChange } = rating({ value: 3 });
  expect(fills(screen)).toEqual([44, 44, 44, 0, 0]);

  const other = rating({ value: 0 });
  tap(other.screen, 2);
  expect(other.onValueChange).toHaveBeenCalledWith(3);
  expect(onValueChange).not.toHaveBeenCalled();
});

test("com allowHalf, a metade da esquerda da meia estrela", () => {
  const { screen, onValueChange } = rating({ allowHalf: true, value: 2.5 });
  expect(fills(screen)).toEqual([44, 44, 22, 0, 0]);
  tap(screen, 3, 10);
  expect(onValueChange).toHaveBeenLastCalledWith(3.5);
  tap(screen, 3, 30);
  expect(onValueChange).toHaveBeenLastCalledWith(4);
});

test("clearable limpa ao tocar de novo; sem ele, tocar de novo nao chama nada", () => {
  const first = rating({ value: 4 });
  tap(first.screen, 3);
  expect(first.onValueChange).not.toHaveBeenCalled();

  const second = rating({ value: 4, clearable: true });
  tap(second.screen, 3);
  expect(second.onValueChange).toHaveBeenCalledWith(0);
});

test("o gesto de ajuste do leitor de tela anda uma estrela e para nas pontas", () => {
  const { screen, onValueChange } = rating({ value: 5 });
  const [group] = byRole(screen, "adjustable");
  act(() => group!.props.onAccessibilityAction({ nativeEvent: { actionName: "increment" } }));
  expect(onValueChange).not.toHaveBeenCalled();
  act(() => group!.props.onAccessibilityAction({ nativeEvent: { actionName: "decrement" } }));
  expect(onValueChange).toHaveBeenLastCalledWith(4);
});

test("desabilitado nao escolhe, avisa o estado e esmaece a camada inteira", () => {
  const { screen, onValueChange } = rating({ value: 2, disabled: true });
  const [group] = byRole(screen, "adjustable");
  expect(group!.props.accessibilityState).toEqual({ disabled: true });
  expect(group!.props.className.split(" ")).toContain("opacity-50");
  expect(byType(screen, "Pressable")).toHaveLength(0);
  act(() => group!.props.onAccessibilityAction({ nativeEvent: { actionName: "increment" } }));
  expect(onValueChange).not.toHaveBeenCalled();
});

test("readOnly sai como imagem com a media em portugues, e pinta a fracao", () => {
  const { screen } = rating({ readOnly: true, value: 4.3, size: "md" });
  const [image] = byRole(screen, "image");
  expect(image!.props.accessibilityLabel).toBe("4,3 de 5");
  expect(byRole(screen, "adjustable")).toHaveLength(0);
  const last = fills(screen)[4]!;
  expect(last).toBeCloseTo(26 * 0.3, 5);
});

test("a funcao de icone recebe a cor do tema, o tamanho e a camada", () => {
  const seen: { filled: boolean; size: number }[] = [];
  rating({
    max: 1,
    value: 1,
    icon: ({ filled, size }) => {
      seen.push({ filled, size });
      return null;
    },
  });
  expect(seen).toEqual([
    { filled: false, size: 26 },
    { filled: true, size: 26 },
  ]);
});

test("a estrela padrao pinta warning cheia e border-strong vazia", () => {
  const { screen } = rating({ value: 1, max: 1 });
  const glyphs = byType(screen, "Text").map((node) => node.props.className.split(" "));
  expect(glyphs[0]).toContain("text-border-strong");
  expect(glyphs[1]).toContain("text-warning");
});
