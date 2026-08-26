import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import {
  FileUpload,
  FileUploadItem,
  FileUploadList,
  type Rejection,
} from "../src/components/file-upload";
import { RivoProvider } from "../src/provider/rivo-provider";

const file = (name: string, size: number, type = "application/xml") => {
  const file = new File([new Uint8Array(size)], name, { type });
  return file;
};

function dropzone(props: Partial<React.ComponentProps<typeof FileUpload>> = {}) {
  return render(
    <RivoProvider scope="local">
      <FileUpload label="Arraste o XML da nota" {...props} />
    </RivoProvider>,
  );
}

test("a area e um botao de verdade, com o rotulo visivel", () => {
  dropzone({ hint: "XML até 5 MB" });
  expect(screen.getByRole("button", { name: /arraste o xml/i })).toBeDefined();
  expect(screen.getByText("XML até 5 MB")).toBeDefined();
});

test("escolher pelo seletor entrega os aceitos", () => {
  let recebidos: File[] = [];
  const { container } = dropzone({ onSelect: (files) => (recebidos = files) });

  const input = container.querySelector<HTMLInputElement>("input[type=file]")!;
  fireEvent.change(input, { target: { files: [file("nota.xml", 100)] } });

  expect(recebidos.map((file) => file.name)).toEqual(["nota.xml"]);
});

test("soltar na area tambem entrega", () => {
  let recebidos: File[] = [];
  dropzone({ onSelect: (files) => (recebidos = files) });

  const area = screen.getByRole("button", { name: /arraste o xml/i });
  fireEvent.drop(area, { dataTransfer: { files: [file("nota.xml", 100)] } });

  expect(recebidos.map((file) => file.name)).toEqual(["nota.xml"]);
});

test("arrastar por cima acende, sair apaga", () => {
  dropzone();
  const area = screen.getByRole("button", { name: /arraste o xml/i });

  fireEvent.dragEnter(area);
  expect(area.getAttribute("data-drag")).toBe("");

  fireEvent.dragLeave(area);
  expect(area.getAttribute("data-drag")).toBeNull();
});

test("maior que maxSize e recusado com motivo legivel", () => {
  let recusas: Rejection[] = [];
  let aceitos: File[] = [];
  dropzone({
    maxSize: 1024,
    onSelect: (files) => (aceitos = files),
    onReject: (rejected) => (recusas = rejected),
  });

  const area = screen.getByRole("button", { name: /arraste o xml/i });
  fireEvent.drop(area, { dataTransfer: { files: [file("pesado.xml", 4096)] } });

  expect(aceitos).toEqual([]);
  expect(recusas[0]?.file.name).toBe("pesado.xml");
  expect(recusas[0]?.reason).toMatch(/1 KB/);
});

test("tipo fora do accept e recusado, os demais passam", () => {
  let recusas: Rejection[] = [];
  let aceitos: File[] = [];
  dropzone({
    accept: ".xml,application/pdf",
    multiple: true,
    onSelect: (files) => (aceitos = files),
    onReject: (rejected) => (recusas = rejected),
  });

  const area = screen.getByRole("button", { name: /arraste o xml/i });
  fireEvent.drop(area, {
    dataTransfer: {
      files: [
        file("nota.xml", 100),
        file("recibo.pdf", 100, "application/pdf"),
        file("foto.png", 100, "image/png"),
      ],
    },
  });

  expect(aceitos.map((file) => file.name)).toEqual(["nota.xml", "recibo.pdf"]);
  expect(recusas.map((rejection) => rejection.file.name)).toEqual(["foto.png"]);
});

test("desabilitada, a area nao aceita nem clique nem soltar", () => {
  let aceitos: File[] = [];
  dropzone({ disabled: true, onSelect: (files) => (aceitos = files) });

  const area = screen.getByRole("button", { name: /arraste o xml/i });
  expect(area.hasAttribute("disabled")).toBe(true);

  fireEvent.drop(area, { dataTransfer: { files: [file("nota.xml", 100)] } });
  expect(aceitos).toEqual([]);
});

test("o item mostra nome e tamanho formatado em pt-BR", () => {
  render(
    <RivoProvider scope="local">
      <FileUploadList>
        <FileUploadItem name="nota-4813.xml" size={48_213} onRemove={() => {}} />
      </FileUploadList>
    </RivoProvider>,
  );

  expect(screen.getByText("nota-4813.xml")).toBeDefined();
  expect(screen.getByText(/47,1 KB/)).toBeDefined();
  expect(screen.getByRole("button", { name: /remover nota-4813.xml/i })).toBeDefined();
});

test("progress vira barra com valor anunciado", () => {
  render(
    <RivoProvider scope="local">
      <FileUploadList>
        <FileUploadItem name="nota.xml" size={100} progress={62} onRemove={() => {}} />
      </FileUploadList>
    </RivoProvider>,
  );

  const bar = screen.getByRole("progressbar");
  expect(bar.getAttribute("aria-valuenow")).toBe("62");
});

test("erro vence progresso e oferece nova tentativa", () => {
  let tentativas = 0;
  render(
    <RivoProvider scope="local">
      <FileUploadList>
        <FileUploadItem
          name="nota.xml"
          size={100}
          progress={62}
          error="A conexão caiu"
          onRetry={() => (tentativas += 1)}
          onRemove={() => {}}
        />
      </FileUploadList>
    </RivoProvider>,
  );

  expect(screen.queryByRole("progressbar")).toBeNull();
  expect(screen.getByText("A conexão caiu")).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: /tentar de novo/i }));
  expect(tentativas).toBe(1);
});
