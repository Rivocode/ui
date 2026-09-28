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

test("the area is a real button, with the visible label", () => {
  dropzone({ hint: "XML até 5 MB" });
  expect(screen.getByRole("button", { name: /arraste o xml/i })).toBeDefined();
  expect(screen.getByText("XML até 5 MB")).toBeDefined();
});

test("picking through the file chooser delivers the accepted ones", () => {
  let received: File[] = [];
  const { container } = dropzone({ onSelect: (files) => (received = files) });

  const input = container.querySelector<HTMLInputElement>("input[type=file]")!;
  fireEvent.change(input, { target: { files: [file("nota.xml", 100)] } });

  expect(received.map((file) => file.name)).toEqual(["nota.xml"]);
});

test("dropping on the area also delivers", () => {
  let received: File[] = [];
  dropzone({ onSelect: (files) => (received = files) });

  const area = screen.getByRole("button", { name: /arraste o xml/i });
  fireEvent.drop(area, { dataTransfer: { files: [file("nota.xml", 100)] } });

  expect(received.map((file) => file.name)).toEqual(["nota.xml"]);
});

test("without multiple, dropping several delivers the first and rejects the others with a reason", () => {
  let received: File[] = [];
  let rejections: { file: File; reason: string }[] = [];
  dropzone({ onSelect: (files) => (received = files), onReject: (list) => (rejections = list) });

  const area = screen.getByRole("button", { name: /arraste o xml/i });
  fireEvent.drop(area, {
    dataTransfer: { files: [file("a.xml", 10), file("b.xml", 10), file("c.xml", 10)] },
  });

  expect(received.map((item) => item.name)).toEqual(["a.xml"]);
  expect(rejections.map((item) => item.file.name)).toEqual(["b.xml", "c.xml"]);
  expect(rejections.map((item) => item.reason)).toEqual(["só um arquivo por vez", "só um arquivo por vez"]);
});

test("the reason for the extra file is replaced through labels", () => {
  let rejections: { file: File; reason: string }[] = [];
  dropzone({ onReject: (list) => (rejections = list), labels: { tooMany: "one file only" } });

  fireEvent.drop(screen.getByRole("button", { name: /arraste o xml/i }), {
    dataTransfer: { files: [file("a.xml", 10), file("b.xml", 10)] },
  });
  expect(rejections.map((item) => item.reason)).toEqual(["one file only"]);
});

test("dragging over lights up, leaving turns it off", () => {
  dropzone();
  const area = screen.getByRole("button", { name: /arraste o xml/i });

  fireEvent.dragEnter(area);
  expect(area.getAttribute("data-drag")).toBe("");

  fireEvent.dragLeave(area);
  expect(area.getAttribute("data-drag")).toBeNull();
});

test("larger than maxSize is rejected with a readable reason", () => {
  let rejections: Rejection[] = [];
  let accepted: File[] = [];
  dropzone({
    maxSize: 1024,
    onSelect: (files) => (accepted = files),
    onReject: (rejected) => (rejections = rejected),
  });

  const area = screen.getByRole("button", { name: /arraste o xml/i });
  fireEvent.drop(area, { dataTransfer: { files: [file("pesado.xml", 4096)] } });

  expect(accepted).toEqual([]);
  expect(rejections[0]?.file.name).toBe("pesado.xml");
  expect(rejections[0]?.reason).toMatch(/1 KB/);
});

test("a type outside accept is rejected, the others pass", () => {
  let rejections: Rejection[] = [];
  let accepted: File[] = [];
  dropzone({
    accept: ".xml,application/pdf",
    multiple: true,
    onSelect: (files) => (accepted = files),
    onReject: (rejected) => (rejections = rejected),
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

  expect(accepted.map((file) => file.name)).toEqual(["nota.xml", "recibo.pdf"]);
  expect(rejections.map((rejection) => rejection.file.name)).toEqual(["foto.png"]);
});

test("when disabled, the area accepts neither click nor drop", () => {
  let accepted: File[] = [];
  dropzone({ disabled: true, onSelect: (files) => (accepted = files) });

  const area = screen.getByRole("button", { name: /arraste o xml/i });
  expect(area.hasAttribute("disabled")).toBe(true);

  fireEvent.drop(area, { dataTransfer: { files: [file("nota.xml", 100)] } });
  expect(accepted).toEqual([]);
});

test("the item shows name and size formatted in pt-BR", () => {
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

test("progress becomes a bar with an announced value", () => {
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

test("error beats progress and offers a retry", () => {
  let attempts = 0;
  render(
    <RivoProvider scope="local">
      <FileUploadList>
        <FileUploadItem
          name="nota.xml"
          size={100}
          progress={62}
          error="A conexão caiu"
          onRetry={() => (attempts += 1)}
          onRemove={() => {}}
        />
      </FileUploadList>
    </RivoProvider>,
  );

  expect(screen.queryByRole("progressbar")).toBeNull();
  expect(screen.getByText("A conexão caiu")).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: /tentar de novo/i }));
  expect(attempts).toBe(1);
});
