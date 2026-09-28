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

test("the thumbnail grid names each button by its alt and announces that it opens a dialog", () => {
  viewer();
  const third = thumb(3);
  expect(third.getAttribute("aria-haspopup")).toBe("dialog");
  expect(third.querySelector("img")!.getAttribute("src")).toBe(`${HOST}/fotos/sala-3-p.jpg`);
  expect(screen.queryByRole("dialog")).toBeNull();
});

test("the thumbnail opens the large image, with the counter and the alt", async () => {
  const onIndexChange = mock(() => {});
  viewer({ onIndexChange });
  await openAt(3);

  expect(onIndexChange).toHaveBeenLastCalledWith(2);
  expect(big().getAttribute("src")).toBe(`${HOST}/fotos/sala-3.jpg`);
  expect(big().getAttribute("alt")).toBe("Sala comercial, foto 3");
  expect(dialog().textContent).toContain("3 de 8");
  expect(dialog().querySelector("[aria-live]")!.textContent).toBe("3 de 8: Sala comercial, foto 3");
});

test("the caption shows when the image has one", async () => {
  viewer();
  await openAt(3);
  expect(dialog().textContent).toContain("Recepção com vista para a avenida");
});

test("previous and next navigate, and lock at the ends", async () => {
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

test("with loop, next after the last is the first", async () => {
  viewer({ loop: true, defaultIndex: 7 });
  await settle();
  const next = screen.getByRole("button", { name: "Próxima imagem" }) as HTMLButtonElement;
  expect(next.disabled).toBe(false);
  fireEvent.click(next);
  expect(big().getAttribute("src")).toBe(`${HOST}/fotos/sala-1.jpg`);
});

test("the arrow keys navigate inside the viewer", async () => {
  viewer();
  await openAt(4);
  fireEvent.keyDown(dialog(), { key: "ArrowRight" });
  expect(big().getAttribute("src")).toBe(`${HOST}/fotos/sala-5.jpg`);
  fireEvent.keyDown(dialog(), { key: "ArrowLeft" });
  fireEvent.keyDown(dialog(), { key: "ArrowLeft" });
  expect(big().getAttribute("src")).toBe(`${HOST}/fotos/sala-3.jpg`);
});

test("Esc closes, reports null and returns focus to the thumbnail of the image that was open", async () => {
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

test("while loading, the spinner says what it waits for and zoom stays off", async () => {
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

test("an image that fails to load says so, and does not keep spinning", async () => {
  viewer();
  fireEvent.click(thumb(1));
  await settle();
  fireEvent.error(big());
  expect(screen.getByRole("alert").textContent).toBe("Não foi possível carregar a imagem.");
  expect(screen.queryByRole("status", { name: "Carregando a imagem" })).toBeNull();
});

test("the zoom buttons zoom in and out, and minus locks at the fit size", async () => {
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

test("zoom stops at maxZoom", async () => {
  viewer({ maxZoom: 2 });
  await openAt(1);
  const zoomIn = screen.getByRole("button", { name: "Aumentar o zoom" }) as HTMLButtonElement;
  fireEvent.click(zoomIn);
  fireEvent.click(zoomIn);
  expect(scale()).toBe("2");
  expect(zoomIn.disabled).toBe(true);
});

test("double click doubles the zoom, and the second one returns to the fit size", async () => {
  viewer();
  await openAt(1);
  const stage = big().closest("[class*='touch-none']")!;
  fireEvent.doubleClick(stage);
  expect(scale()).toBe("2");
  fireEvent.doubleClick(stage);
  expect(scale()).toBe("1");
});

test("the wheel only zooms with ctrl, which is the trackpad pinch gesture", async () => {
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

test("+, - and 0 on the keyboard change the zoom", async () => {
  viewer();
  await openAt(1);
  fireEvent.keyDown(dialog(), { key: "+" });
  expect(scale()).toBe("1.5");
  fireEvent.keyDown(dialog(), { key: "+" });
  expect(scale()).toBe("2.25");
  fireEvent.keyDown(dialog(), { key: "0" });
  expect(scale()).toBe("1");
});

test("changing image resets zoom to the fit size", async () => {
  viewer();
  await openAt(1);
  fireEvent.keyDown(dialog(), { key: "+" });
  fireEvent.click(screen.getByRole("button", { name: "Próxima imagem" }));
  await settle();
  expect(big().getAttribute("src")).toBe(`${HOST}/fotos/sala-2.jpg`);
  expect(scale()).toBe("1");
});

test("swiping sideways changes image, and only without zoom", async () => {
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

test("preloads the two neighbors of the open image", async () => {
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

test("controlled and without grid, index is what opens it", async () => {
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

test("a single image has neither previous nor next", async () => {
  viewer({ images: PHOTOS.slice(0, 1) });
  await openAt(1);
  expect(screen.queryByRole("button", { name: "Próxima imagem" })).toBeNull();
});

test("with no images, renders nothing", () => {
  const { container } = viewer({ images: [] });
  expect(container.querySelector("ul")).toBeNull();
  expect(screen.queryAllByRole("button")).toHaveLength(0);
});

test("the type rejects an image without alt", () => {
  // @ts-expect-error alt is required
  const missing: ImageViewerImage = { src: "/fotos/sala.jpg" };
  expect(missing).toBeDefined();
});

test("the zoom math keeps the zoomed photo inside the screen and zooms at the requested point", () => {
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

const focusState = () => {
  const active = document.activeElement as HTMLElement | null;
  return {
    inDialog: Boolean(active && dialog().contains(active)),
    disabled: (active as HTMLButtonElement | null)?.disabled === true,
  };
};

test("on the last image, the focused Next disables and focus drops to the stage, and the arrows keep working", async () => {
  viewer();
  await openAt(7);
  const next = screen.getByRole("button", { name: "Próxima imagem" });
  next.focus();
  fireEvent.click(next);
  await settle();

  expect(big().getAttribute("src")).toBe(`${HOST}/fotos/sala-8.jpg`);
  expect(focusState()).toEqual({ inDialog: true, disabled: false });
  expect(document.activeElement).toBe(big().closest("[tabindex='-1']"));

  fireEvent.keyDown(document.activeElement!, { key: "ArrowLeft" });
  expect(big().getAttribute("src")).toBe(`${HOST}/fotos/sala-7.jpg`);
});

test("on the first image, the focused Previous disables and focus drops to the stage", async () => {
  viewer();
  await openAt(2);
  const previous = screen.getByRole("button", { name: "Imagem anterior" });
  previous.focus();
  fireEvent.click(previous);
  await settle();

  expect(focusState()).toEqual({ inDialog: true, disabled: false });
});

test("zoom at the ceiling and at the floor does not leave focus on a disabled button", async () => {
  viewer({ maxZoom: 2 });
  await openAt(1);
  const zoomIn = screen.getByRole("button", { name: "Aumentar o zoom" });
  zoomIn.focus();
  fireEvent.click(zoomIn);
  fireEvent.click(zoomIn);
  await settle();
  expect(scale()).toBe("2");
  expect(focusState()).toEqual({ inDialog: true, disabled: false });

  const zoomOut = screen.getByRole("button", { name: "Diminuir o zoom" });
  zoomOut.focus();
  fireEvent.click(zoomOut);
  fireEvent.click(zoomOut);
  await settle();
  expect(scale()).toBe("1");
  expect(focusState()).toEqual({ inDialog: true, disabled: false });
});

test("with zoom, the arrows pan the zoomed photo and do not change image", async () => {
  viewer();
  await openAt(3);
  const stage = big().closest("[class*='touch-none']") as HTMLElement;
  stage.getBoundingClientRect = () =>
    ({ width: 400, height: 300, left: 0, top: 0, right: 400, bottom: 300 }) as DOMRect;
  fireEvent.keyDown(dialog(), { key: "+" });
  fireEvent.keyDown(dialog(), { key: "+" });
  expect(scale()).toBe("2.25");

  fireEvent.keyDown(dialog(), { key: "ArrowRight" });
  fireEvent.keyDown(dialog(), { key: "ArrowDown" });
  expect(big().getAttribute("src")).toBe(`${HOST}/fotos/sala-3.jpg`);
  expect(big().style.transform).toBe("translate(-40px, -40px) scale(2.25)");

  for (let press = 0; press < 20; press += 1) fireEvent.keyDown(dialog(), { key: "ArrowLeft" });
  expect(big().style.transform).toBe("translate(250px, -40px) scale(2.25)");
  expect(big().getAttribute("src")).toBe(`${HOST}/fotos/sala-3.jpg`);
});

test("PageDown and PageUp change image with or without zoom, and the change resets zoom", async () => {
  viewer();
  await openAt(3);
  fireEvent.keyDown(dialog(), { key: "PageDown" });
  expect(big().getAttribute("src")).toBe(`${HOST}/fotos/sala-4.jpg`);

  fireEvent.load(big());
  fireEvent.keyDown(dialog(), { key: "+" });
  fireEvent.keyDown(dialog(), { key: "PageUp" });
  await settle();
  expect(big().getAttribute("src")).toBe(`${HOST}/fotos/sala-3.jpg`);
  expect(scale()).toBe("1");
});
