import { afterEach, expect, mock, test } from "bun:test";
import { act, fireEvent, render, screen } from "@testing-library/react";

import {
  ImageViewer,
  type ImageViewerImage,
  type ImageViewerProps,
} from "../src/components/image-viewer";
import { RivoProvider } from "../src/provider/rivo-provider";
import { ZOOM_REST, clampZoom, zoomAround } from "../src/shared/zoom";

const HOST = "https://exemplo.com.br";

const PHOTOS: ImageViewerImage[] = Array.from({ length: 8 }, (_, position) => ({
  src: `${HOST}/fotos/sala-${position + 1}.jpg`,
  thumbnail: `${HOST}/fotos/sala-${position + 1}-p.jpg`,
  alt: `Sala comercial, foto ${position + 1}`,
  caption: position === 2 ? "Recepção com vista para a avenida" : undefined,
}));

function viewer(props: Partial<ImageViewerProps> = {}) {
  return render(
    <RivoProvider scope="local">
      <ImageViewer images={PHOTOS} {...props} />
    </RivoProvider>,
  );
}

const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));
const thumb = (position: number) =>
  screen.getByRole("button", { name: `Sala comercial, foto ${position}` });
const dialog = () => screen.getByRole("dialog");
const big = () => dialog().querySelector<HTMLImageElement>("img")!;
const scale = () => /scale\(([\d.]+)\)/.exec(big().style.transform)?.[1];

async function openAt(position: number) {
  fireEvent.click(thumb(position));
  await settle();
  fireEvent.load(big());
}

const OriginalImage = window.Image;
afterEach(() => {
  window.Image = OriginalImage;
});

test("a grade de miniaturas nomeia cada botao pelo alt e avisa que abre um dialogo", () => {
  viewer();
  const third = thumb(3);
  expect(third.getAttribute("aria-haspopup")).toBe("dialog");
  expect(third.querySelector("img")!.getAttribute("src")).toBe(`${HOST}/fotos/sala-3-p.jpg`);
  expect(screen.queryByRole("dialog")).toBeNull();
});

test("a miniatura abre a imagem grande, com o contador e o alt", async () => {
  const onIndexChange = mock(() => {});
  viewer({ onIndexChange });
  await openAt(3);

  expect(onIndexChange).toHaveBeenLastCalledWith(2);
  expect(big().getAttribute("src")).toBe(`${HOST}/fotos/sala-3.jpg`);
  expect(big().getAttribute("alt")).toBe("Sala comercial, foto 3");
  expect(dialog().textContent).toContain("3 de 8");
  expect(dialog().querySelector("[aria-live]")!.textContent).toBe("3 de 8: Sala comercial, foto 3");
});

test("a legenda aparece quando a imagem tem uma", async () => {
  viewer();
  await openAt(3);
  expect(dialog().textContent).toContain("Recepção com vista para a avenida");
});

test("anterior e proximo navegam, e travam nas pontas", async () => {
  viewer();
  await openAt(1);
  const previous = screen.getByRole("button", { name: "Imagem anterior" }) as HTMLButtonElement;
  expect(previous.disabled).toBe(true);

  fireEvent.click(screen.getByRole("button", { name: "Próxima imagem" }));
  expect(big().getAttribute("src")).toBe(`${HOST}/fotos/sala-2.jpg`);
  expect(dialog().textContent).toContain("2 de 8");

  fireEvent.click(screen.getByRole("button", { name: "Imagem anterior" }));
  expect(big().getAttribute("src")).toBe(`${HOST}/fotos/sala-1.jpg`);
});

test("com loop, da ultima a proxima e a primeira", async () => {
  viewer({ loop: true, defaultIndex: 7 });
  await settle();
  const next = screen.getByRole("button", { name: "Próxima imagem" }) as HTMLButtonElement;
  expect(next.disabled).toBe(false);
  fireEvent.click(next);
  expect(big().getAttribute("src")).toBe(`${HOST}/fotos/sala-1.jpg`);
});

test("as setas do teclado navegam dentro do visualizador", async () => {
  viewer();
  await openAt(4);
  fireEvent.keyDown(dialog(), { key: "ArrowRight" });
  expect(big().getAttribute("src")).toBe(`${HOST}/fotos/sala-5.jpg`);
  fireEvent.keyDown(dialog(), { key: "ArrowLeft" });
  fireEvent.keyDown(dialog(), { key: "ArrowLeft" });
  expect(big().getAttribute("src")).toBe(`${HOST}/fotos/sala-3.jpg`);
});

test("Esc fecha, avisa com null e devolve o foco a miniatura da imagem que estava aberta", async () => {
  const onIndexChange = mock(() => {});
  viewer({ onIndexChange });
  thumb(2).focus();
  await openAt(2);
  fireEvent.keyDown(dialog(), { key: "ArrowRight" });

  fireEvent.keyDown(dialog(), { key: "Escape" });
  await settle();
  await settle();

  expect(onIndexChange).toHaveBeenLastCalledWith(null);
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(document.activeElement).toBe(thumb(3));
});

test("enquanto carrega, o giro diz o que espera e o zoom nao liga", async () => {
  viewer();
  fireEvent.click(thumb(1));
  await settle();
  await settle();
  expect(screen.getByRole("status", { name: "Carregando a imagem" })).toBeDefined();
  const zoomIn = screen.getByRole("button", { name: "Aumentar o zoom" }) as HTMLButtonElement;
  expect(zoomIn.disabled).toBe(true);

  fireEvent.load(big());
  expect(screen.queryByRole("status", { name: "Carregando a imagem" })).toBeNull();
  expect(zoomIn.disabled).toBe(false);
});

test("imagem que nao carrega diz isso, e nao fica girando", async () => {
  viewer();
  fireEvent.click(thumb(1));
  await settle();
  fireEvent.error(big());
  expect(screen.getByRole("alert").textContent).toBe("Não foi possível carregar a imagem.");
  expect(screen.queryByRole("status", { name: "Carregando a imagem" })).toBeNull();
});

test("os botoes de zoom aumentam e diminuem, e o menos trava no tamanho que cabe", async () => {
  viewer();
  await openAt(1);
  const zoomOut = screen.getByRole("button", { name: "Diminuir o zoom" }) as HTMLButtonElement;
  expect(zoomOut.disabled).toBe(true);
  expect(scale()).toBe("1");

  fireEvent.click(screen.getByRole("button", { name: "Aumentar o zoom" }));
  expect(scale()).toBe("1.5");
  expect(zoomOut.disabled).toBe(false);

  fireEvent.click(zoomOut);
  expect(scale()).toBe("1");
});

test("o zoom para no maxZoom", async () => {
  viewer({ maxZoom: 2 });
  await openAt(1);
  const zoomIn = screen.getByRole("button", { name: "Aumentar o zoom" }) as HTMLButtonElement;
  fireEvent.click(zoomIn);
  fireEvent.click(zoomIn);
  expect(scale()).toBe("2");
  expect(zoomIn.disabled).toBe(true);
});

test("duplo clique dobra o zoom, e o segundo volta ao tamanho que cabe", async () => {
  viewer();
  await openAt(1);
  const stage = big().closest("[class*='touch-none']")!;
  fireEvent.doubleClick(stage);
  expect(scale()).toBe("2");
  fireEvent.doubleClick(stage);
  expect(scale()).toBe("1");
});

test("a roda so aproxima com ctrl, que e o gesto de pinca do trackpad", async () => {
  viewer();
  await openAt(1);
  const stage = big().closest("[class*='touch-none']")!;
  fireEvent.wheel(stage, { deltaY: -100 });
  expect(scale()).toBe("1");
  const pinch = new WheelEvent("wheel", { deltaY: -100, bubbles: true, cancelable: true });
  Object.defineProperty(pinch, "ctrlKey", { value: true });
  act(() => {
    stage.dispatchEvent(pinch);
  });
  expect(pinch.defaultPrevented).toBe(true);
  expect(Number(scale())).toBeGreaterThan(1);
});

test("+, - e 0 no teclado mexem no zoom", async () => {
  viewer();
  await openAt(1);
  fireEvent.keyDown(dialog(), { key: "+" });
  expect(scale()).toBe("1.5");
  fireEvent.keyDown(dialog(), { key: "+" });
  expect(scale()).toBe("2.25");
  fireEvent.keyDown(dialog(), { key: "0" });
  expect(scale()).toBe("1");
});

test("trocar de imagem volta o zoom ao tamanho que cabe", async () => {
  viewer();
  await openAt(1);
  fireEvent.keyDown(dialog(), { key: "+" });
  fireEvent.keyDown(dialog(), { key: "ArrowRight" });
  await settle();
  expect(scale()).toBe("1");
});

test("deslizar para o lado troca de imagem, e so sem zoom", async () => {
  viewer();
  await openAt(2);
  const stage = big().closest("[class*='touch-none']")!;
  fireEvent.pointerDown(stage, { pointerId: 1, button: 0, clientX: 300, clientY: 200 });
  fireEvent.pointerUp(stage, { pointerId: 1, button: 0, clientX: 180, clientY: 210 });
  expect(big().getAttribute("src")).toBe(`${HOST}/fotos/sala-3.jpg`);

  fireEvent.pointerDown(stage, { pointerId: 2, button: 0, clientX: 100, clientY: 200 });
  fireEvent.pointerUp(stage, { pointerId: 2, button: 0, clientX: 260, clientY: 200 });
  expect(big().getAttribute("src")).toBe(`${HOST}/fotos/sala-2.jpg`);
});

test("carrega antes as duas vizinhas da imagem aberta", async () => {
  const loaded: string[] = [];
  window.Image = class {
    set src(value: string) {
      loaded.push(value);
    }
  } as unknown as typeof window.Image;

  viewer();
  fireEvent.click(thumb(4));
  await settle();
  expect(loaded).toContain(`${HOST}/fotos/sala-3.jpg`);
  expect(loaded).toContain(`${HOST}/fotos/sala-5.jpg`);
});

test("controlado e sem grade, quem abre e o index", async () => {
  const onIndexChange = mock(() => {});
  const { rerender } = render(
    <RivoProvider scope="local">
      <ImageViewer images={PHOTOS} thumbnails={false} index={null} onIndexChange={onIndexChange} />
    </RivoProvider>,
  );
  expect(screen.queryAllByRole("button")).toHaveLength(0);

  rerender(
    <RivoProvider scope="local">
      <ImageViewer images={PHOTOS} thumbnails={false} index={5} onIndexChange={onIndexChange} />
    </RivoProvider>,
  );
  await settle();
  expect(big().getAttribute("src")).toBe(`${HOST}/fotos/sala-6.jpg`);
  fireEvent.click(screen.getByRole("button", { name: "Próxima imagem" }));
  expect(onIndexChange).toHaveBeenLastCalledWith(6);
  expect(big().getAttribute("src")).toBe(`${HOST}/fotos/sala-6.jpg`);
});

test("uma imagem so nao tem anterior nem proximo", async () => {
  viewer({ images: PHOTOS.slice(0, 1) });
  await openAt(1);
  expect(screen.queryByRole("button", { name: "Próxima imagem" })).toBeNull();
});

test("sem imagens, nao desenha nada", () => {
  const { container } = viewer({ images: [] });
  expect(container.querySelector("ul")).toBeNull();
  expect(screen.queryAllByRole("button")).toHaveLength(0);
});

test("o tipo recusa imagem sem alt", () => {
  // @ts-expect-error alt e obrigatorio
  const missing: ImageViewerImage = { src: "/fotos/sala.jpg" };
  expect(missing).toBeDefined();
});

test("a conta do zoom segura a foto aproximada dentro da tela e aproxima no ponto pedido", () => {
  expect(clampZoom({ zoom: 2, x: 900, y: -900 }, 4, 400, 300)).toEqual({
    zoom: 2,
    x: 200,
    y: -150,
  });
  expect(clampZoom({ zoom: 0.5, x: 10, y: 10 }, 4, 400, 300)).toEqual(ZOOM_REST);
  expect(clampZoom({ zoom: 9, x: 0, y: 0 }, 4, 400, 300).zoom).toBe(4);

  const zoomed = zoomAround(ZOOM_REST, 2, 100, 0, 4, 400, 300);
  expect(zoomed).toEqual({ zoom: 2, x: -100, y: 0 });
  expect(zoomAround(zoomed, 1, 0, 0, 4, 400, 300)).toEqual(ZOOM_REST);
});
