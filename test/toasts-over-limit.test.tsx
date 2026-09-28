import { expect, test } from "bun:test";
import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { useEffect } from "react";

import { useToast } from "../src/components/toast";
import { RivoProvider } from "../src/provider/rivo-provider";

const tokens = (element: Element) => (element.getAttribute("class") ?? "").split(" ");

function Four() {
  const toast = useToast();
  useEffect(() => {
    toast.add({ title: "Aviso fixo", timeout: 0 });
    toast.add({ title: "Aviso 2" });
    toast.add({ title: "Aviso 3" });
    toast.add({ title: "Aviso 4" });
  }, [toast]);
  return null;
}

const rootOf = (title: string) =>
  [
    ...document.querySelectorAll<HTMLElement>(
      "[data-rc-portal] [role=dialog], [data-rc-portal] [aria-labelledby]",
    ),
  ].find((node) => node.textContent?.includes(title))!;

test("a toast beyond the limit leaves the screen, instead of staying visible and inert", async () => {
  await act(async () => {
    render(
      <RivoProvider>
        <Four />
      </RivoProvider>,
    );
  });

  const limited = document.querySelectorAll("[data-limited]");
  expect(limited.length).toBe(1);
  expect(limited[0]!.textContent).toContain("Aviso fixo");
  expect(tokens(limited[0]!)).toContain("data-[limited]:hidden");

  const visible = rootOf("Aviso 4");
  expect(visible.hasAttribute("data-limited")).toBe(false);
});

test("a toast without a timeout comes back when another closes, and its x closes it", async () => {
  await act(async () => {
    render(
      <RivoProvider>
        <Four />
      </RivoProvider>,
    );
  });

  const closeOf = (title: string) =>
    rootOf(title).querySelector<HTMLElement>("[data-rc-toast-close]")!;

  await act(async () => {
    fireEvent.click(closeOf("Aviso 4"));
  });
  await waitFor(() => expect(document.querySelectorAll("[data-limited]").length).toBe(0));

  await act(async () => {
    fireEvent.click(closeOf("Aviso fixo"));
  });
  await waitFor(() =>
    expect(document.querySelector("[data-rc-portal]")!.textContent).not.toContain("Aviso fixo"),
  );
});
