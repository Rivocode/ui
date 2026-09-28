import { describe, expect, mock, test } from "bun:test";

import { timingCalls } from "react-native-reanimated";

import { tokens } from "../tokens";
import { RivoProvider } from "../src";
import { act, byLabel, byRole, byType, render, textOf } from "./helpers";

/*
 * expo-document-picker comes in as a double for the same reason as
 * `chart-svg.test.tsx` and `clipboard.test.tsx`: an OPTIONAL peer and a native
 * module, installed only in `examples/native`. The double is also the only way
 * to stage what the device decides - giving up, returning a file without a
 * size, returning two when only one was asked for.
 */
type Options = { type?: string | string[]; multiple?: boolean; copyToCacheDirectory?: boolean };
type Asset = { uri: string; name: string; size?: number; mimeType?: string; lastModified: number };

let asked: Options | undefined;
let answer: { canceled: true; assets: null } | { canceled: false; assets: Asset[] } = {
  canceled: true,
  assets: null,
};

/** When on, the double refuses to open - what Android does on the second tap. */
let refuses = false;

mock.module("expo-document-picker", () => ({
  getDocumentAsync: async (options: Options) => {
    asked = options;
    if (refuses) throw new Error("Different document picking in progress");
    return answer;
  },
}));

const { FileUpload, FileUploadItem, FileUploadList } =
  await import("../src/file-upload/file-upload");

const asset = (over: Partial<Asset> = {}): Asset => ({
  uri: "file:///cache/nota.xml",
  name: "nota.xml",
  size: 48_200,
  mimeType: "text/xml",
  lastModified: 0,
  ...over,
});

function answers(assets: Asset[]) {
  answer = { canceled: false, assets };
}

async function choose(screen: Parameters<typeof byRole>[0]) {
  const [button] = byRole(screen, "button");
  await act(async () => {
    await button!.props.onPress();
  });
}

describe("FileUpload", () => {
  test("there is no drop area: what opens the picker is a control-height button", () => {
    const screen = render(<FileUpload label="Escolher o XML" />);
    const [button] = byRole(screen, "button");

    expect(button!.props.className).toContain("h-12");
    // No dashes: on the phone there is no dropping, and a dashed border is,
    // letter by letter, the idiom for "drop here".
    expect(button!.props.className).not.toContain("dashed");
  });

  test("the hint goes into the spoken name, so the refusal is not the first news", () => {
    const screen = render(<FileUpload label="Escolher o XML" hint="XML ou PDF, até 5 MB" />);

    expect(byLabel(screen, "Escolher o XML. XML ou PDF, até 5 MB")).toHaveLength(1);
    // And the text below is hidden from the screen reader, or it reads it twice.
    expect(textOf(screen)).toContain("XML ou PDF, até 5 MB");
  });

  test("only the MIME goes to the system picker; the extension would match nothing", async () => {
    const onSelect = mock(() => {});
    answers([asset()]);
    const screen = render(
      <FileUpload label="Anexar" accept=".xml,text/xml,application/pdf" onSelect={onSelect} />,
    );

    await choose(screen);

    expect(asked?.type).toEqual(["text/xml", "application/pdf"]);
    expect(asked?.copyToCacheDirectory).toBe(true);
  });

  test("without accept the picker opens unrestricted", async () => {
    answers([asset()]);
    const screen = render(<FileUpload label="Anexar" />);
    await choose(screen);
    expect(asked?.type).toBeUndefined();
  });

  test("giving up is not an ending: no callback fires", async () => {
    const onSelect = mock(() => {});
    const onReject = mock(() => {});
    answer = { canceled: true, assets: null };

    const screen = render(<FileUpload label="Anexar" onSelect={onSelect} onReject={onReject} />);
    await choose(screen);

    expect(onSelect).toHaveBeenCalledTimes(0);
    expect(onReject).toHaveBeenCalledTimes(0);
  });

  test("the wrong type becomes a refusal with the reason ready for a notice", async () => {
    const onSelect = mock(() => {});
    const onReject = mock(() => {});
    answers([asset({ name: "foto.png", mimeType: "image/png" })]);

    const screen = render(
      <FileUpload label="Anexar" accept="text/xml" onSelect={onSelect} onReject={onReject} />,
    );
    await choose(screen);

    expect(onSelect).toHaveBeenCalledTimes(0);
    expect(onReject.mock.calls[0]![0]).toEqual([
      {
        file: {
          uri: "file:///cache/nota.xml",
          name: "foto.png",
          size: 48_200,
          mimeType: "image/png",
        },
        reason: "tipo não aceito",
      },
    ]);
  });

  test("the type wildcard counts, and the extension matches by name", async () => {
    const onSelect = mock(() => {});
    answers([asset({ name: "foto.png", mimeType: "image/png" })]);
    await choose(render(<FileUpload label="Anexar" accept="image/*" onSelect={onSelect} />));
    expect(onSelect).toHaveBeenCalledTimes(1);

    const byExtension = mock(() => {});
    answers([asset({ mimeType: undefined })]);
    await choose(render(<FileUpload label="Anexar" accept=".xml" onSelect={byExtension} />));
    expect(byExtension).toHaveBeenCalledTimes(1);
  });

  test("larger than maxSize is refused, and the reason comes out formatted without Intl", async () => {
    const onReject = mock(() => {});
    answers([asset({ size: 6_000_000 })]);

    await choose(
      render(<FileUpload label="Anexar" maxSize={5 * 1024 * 1024} onReject={onReject} />),
    );

    expect(onReject.mock.calls[0]![0][0].reason).toBe("maior que 5 MB");
  });

  test("a size the device did not report passes: what was not measured is not refused", async () => {
    const onSelect = mock(() => {});
    answers([asset({ size: undefined })]);

    await choose(render(<FileUpload label="Anexar" maxSize={10} onSelect={onSelect} />));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  test("without multiple only the first gets in, even if the picker returns two", async () => {
    const onSelect = mock(() => {});
    answers([asset(), asset({ name: "outra.xml" })]);

    await choose(render(<FileUpload label="Anexar" onSelect={onSelect} />));

    expect(onSelect.mock.calls[0]![0]).toHaveLength(1);
    expect(asked?.multiple).toBeUndefined();
  });

  test("disabled does not open the picker", async () => {
    asked = undefined;
    answers([asset()]);
    const onSelect = mock(() => {});

    const screen = render(<FileUpload label="Anexar" disabled onSelect={onSelect} />);
    await choose(screen);

    expect(asked).toBeUndefined();
    expect(onSelect).toHaveBeenCalledTimes(0);
  });
});

describe("FileUploadItem", () => {
  test("each file's bar starts at the value and moves to the new one in the slow duration", () => {
    const item = (progress: number) => (
      <FileUploadItem name="nota.xml" size={1024} progress={progress} onRemove={() => {}} />
    );
    const widthOf = (screen: ReturnType<typeof render>) =>
      byType(screen, "View")
        .map((node) => node.props.style as { width?: string } | undefined)
        .find((style) => typeof style?.width === "string")!.width;

    const screen = render(item(20));
    expect(widthOf(screen)).toBe("20%");

    timingCalls.length = 0;
    act(() => screen.update(<RivoProvider>{item(70)}</RivoProvider>));
    expect(widthOf(screen)).toBe("70%");
    expect(timingCalls.at(-1)).toEqual({
      to: 70,
      config: {
        duration: tokens.scales["duration-slow"],
        easing: { bezier: [...tokens.easings.ease] },
        reduceMotion: "never",
      },
    });
  });

  test("the size comes out formatted by the piece, with the pt-BR comma", () => {
    const screen = render(
      <FileUploadList>
        <FileUploadItem name="nota.xml" size={48_200} onRemove={() => {}} />
      </FileUploadList>,
    );

    expect(textOf(screen)).toContain("47,1 KB");
  });

  test("progress becomes an announced bar, with the file name along", () => {
    const screen = render(
      <FileUploadItem name="nota.xml" size={1024} progress={40} onRemove={() => {}} />,
    );

    const [bar] = byRole(screen, "progressbar");
    expect(bar!.props.accessibilityLabel).toBe("Enviando nota.xml");
    expect(bar!.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 40 });
  });

  test("the error wins over progress and offers a retry", () => {
    const onRetry = mock(() => {});
    const screen = render(
      <FileUploadItem
        name="nota.xml"
        size={1024}
        progress={40}
        error="A rede caiu"
        onRetry={onRetry}
        onRemove={() => {}}
      />,
    );

    // A bar moving under a failure says two contradictory things.
    expect(byRole(screen, "progressbar")).toHaveLength(0);
    expect(textOf(screen)).toContain("A rede caiu");

    act(() => byLabel(screen, "Tentar enviar nota.xml de novo")[0]!.props.onPress());
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  test("remove has its own name and a target beyond the drawing", () => {
    const onRemove = mock(() => {});
    const screen = render(<FileUploadItem name="nota.xml" size={1024} onRemove={onRemove} />);

    const [remove] = byLabel(screen, "Remover nota.xml");
    expect(remove!.props.hitSlop).toBe(14);

    act(() => remove!.props.onPress());
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  test("a long name is cut by numberOfLines, not by a class", () => {
    const screen = render(
      <FileUploadItem
        name="nota-fiscal-eletronica-serie-1-numero-48131-do-cliente.xml"
        size={1024}
        onRemove={() => {}}
      />,
    );

    const [name] = screen.root.findAll(
      (node) => typeof node.type === "string" && node.props?.numberOfLines === 1,
    );
    expect(name).toBeDefined();
  });
});

describe("FileUpload, when the picker refuses to open", () => {
  test("counts as having chosen nothing, and no promise dies unhandled", async () => {
    const onSelect = mock(() => {});
    const onReject = mock(() => {});
    refuses = true;

    // Without the piece's catch the rejection would die unhandled: the
    // Pressable's `onPress` awaits nobody's return.
    const screen = render(<FileUpload label="Anexar" onSelect={onSelect} onReject={onReject} />);
    await choose(screen);

    expect(onSelect).toHaveBeenCalledTimes(0);
    expect(onReject).toHaveBeenCalledTimes(0);
    refuses = false;
  });
});
