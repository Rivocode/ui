import { afterEach, expect, mock, test } from "bun:test";
import { act, fireEvent, render, screen } from "@testing-library/react";

import { Clipboard } from "../src/components/clipboard";
import { RivoProvider } from "../src/provider/rivo-provider";

const written: string[] = [];

function allowClipboard() {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: {
      writeText: async (text: string) => {
        written.push(text);
      },
    },
  });
}

afterEach(() => {
  written.length = 0;
});

async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

test("com children, o texto do botao e o children ate copiar, e o de confirmado depois", async () => {
  allowClipboard();
  render(
    <RivoProvider scope="local">
      <Clipboard value="00020126580014br.gov.bcb.pix">Copiar código Pix</Clipboard>
    </RivoProvider>,
  );

  const button = screen.getByRole("button", { name: "Copiar código Pix" });
  expect(button.textContent).toBe("Copiar código Pix");

  fireEvent.click(button);
  await settle();

  expect(written).toEqual(["00020126580014br.gov.bcb.pix"]);
  expect(screen.getByRole("button", { name: "Copiado" })).toBe(button);
});

test("o onClick de quem usa e chamado, e a copia acontece mesmo assim", async () => {
  allowClipboard();
  const onClick = mock(() => {});
  const onCopy = mock((value: string) => void value);
  render(
    <RivoProvider scope="local">
      <Clipboard value="4813" onClick={onClick} onCopy={onCopy} />
      <Clipboard value="1234" onClick={onClick}>
        Copiar a chave
      </Clipboard>
    </RivoProvider>,
  );

  fireEvent.click(screen.getByRole("button", { name: "Copiar" }));
  fireEvent.click(screen.getByRole("button", { name: "Copiar a chave" }));
  await settle();

  expect(onClick).toHaveBeenCalledTimes(2);
  expect(onCopy).toHaveBeenCalledWith("4813");
  expect(written).toEqual(["4813", "1234"]);
});
