import { describe, expect, mock, test } from "bun:test";

import { act, byLabel, byRole, render, textOf } from "./helpers";

/*
 * O expo-document-picker entra como duble pela mesma razao do
 * `chart-svg.test.tsx` e do `clipboard.test.tsx`: peer OPCIONAL e modulo
 * nativo, instalado so em `examples/native`. O duble tambem e o unico jeito de
 * encenar o que o aparelho decide - desistir, devolver um arquivo sem tamanho,
 * devolver dois quando so se pediu um.
 */
type Options = { type?: string | string[]; multiple?: boolean; copyToCacheDirectory?: boolean };
type Asset = { uri: string; name: string; size?: number; mimeType?: string; lastModified: number };

let asked: Options | undefined;
let answer: { canceled: true; assets: null } | { canceled: false; assets: Asset[] } = {
  canceled: true,
  assets: null,
};

/** Ligado, o duble recusa abrir - o que o Android faz no segundo toque. */
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
  test("nao ha area de soltar: o que abre o seletor e um botao de altura de controle", () => {
    const screen = render(<FileUpload label="Escolher o XML" />);
    const [button] = byRole(screen, "button");

    expect(button!.props.className).toContain("h-12");
    // Nada de tracejado: no celular nao existe soltar, e a borda tracejada e,
    // letra por letra, o idioma de "solte aqui".
    expect(button!.props.className).not.toContain("dashed");
  });

  test("o hint entra no nome falado, para a recusa nao ser a primeira noticia", () => {
    const screen = render(<FileUpload label="Escolher o XML" hint="XML ou PDF, até 5 MB" />);

    expect(byLabel(screen, "Escolher o XML. XML ou PDF, até 5 MB")).toHaveLength(1);
    // E o texto de baixo sai do leitor de tela, senao ele o le duas vezes.
    expect(textOf(screen)).toContain("XML ou PDF, até 5 MB");
  });

  test("so o MIME vai para o seletor do sistema; a extensao ficaria sem casar nada", async () => {
    const onSelect = mock(() => {});
    answers([asset()]);
    const screen = render(
      <FileUpload label="Anexar" accept=".xml,text/xml,application/pdf" onSelect={onSelect} />,
    );

    await choose(screen);

    expect(asked?.type).toEqual(["text/xml", "application/pdf"]);
    expect(asked?.copyToCacheDirectory).toBe(true);
  });

  test("sem accept o seletor abre sem restricao", async () => {
    answers([asset()]);
    const screen = render(<FileUpload label="Anexar" />);
    await choose(screen);
    expect(asked?.type).toBeUndefined();
  });

  test("desistir nao e um final: nenhum callback dispara", async () => {
    const onSelect = mock(() => {});
    const onReject = mock(() => {});
    answer = { canceled: true, assets: null };

    const screen = render(<FileUpload label="Anexar" onSelect={onSelect} onReject={onReject} />);
    await choose(screen);

    expect(onSelect).toHaveBeenCalledTimes(0);
    expect(onReject).toHaveBeenCalledTimes(0);
  });

  test("o tipo errado vira recusa com o motivo pronto para um aviso", async () => {
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

  test("o curinga de tipo vale, e a extensao casa pelo nome", async () => {
    const onSelect = mock(() => {});
    answers([asset({ name: "foto.png", mimeType: "image/png" })]);
    await choose(render(<FileUpload label="Anexar" accept="image/*" onSelect={onSelect} />));
    expect(onSelect).toHaveBeenCalledTimes(1);

    const byExtension = mock(() => {});
    answers([asset({ mimeType: undefined })]);
    await choose(render(<FileUpload label="Anexar" accept=".xml" onSelect={byExtension} />));
    expect(byExtension).toHaveBeenCalledTimes(1);
  });

  test("maior que maxSize e recusado, e o motivo sai formatado sem Intl", async () => {
    const onReject = mock(() => {});
    answers([asset({ size: 6_000_000 })]);

    await choose(
      render(<FileUpload label="Anexar" maxSize={5 * 1024 * 1024} onReject={onReject} />),
    );

    expect(onReject.mock.calls[0]![0][0].reason).toBe("maior que 5 MB");
  });

  test("tamanho que o aparelho nao informou passa: nao se recusa o que nao se mediu", async () => {
    const onSelect = mock(() => {});
    answers([asset({ size: undefined })]);

    await choose(render(<FileUpload label="Anexar" maxSize={10} onSelect={onSelect} />));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  test("sem multiple so o primeiro entra, mesmo se o seletor devolver dois", async () => {
    const onSelect = mock(() => {});
    answers([asset(), asset({ name: "outra.xml" })]);

    await choose(render(<FileUpload label="Anexar" onSelect={onSelect} />));

    expect(onSelect.mock.calls[0]![0]).toHaveLength(1);
    expect(asked?.multiple).toBeUndefined();
  });

  test("desabilitado nao abre o seletor", async () => {
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
  test("o tamanho sai formatado pela peca, com a virgula do pt-BR", () => {
    const screen = render(
      <FileUploadList>
        <FileUploadItem name="nota.xml" size={48_200} onRemove={() => {}} />
      </FileUploadList>,
    );

    expect(textOf(screen)).toContain("47,1 KB");
  });

  test("o progresso vira barra anunciada, com o nome do arquivo junto", () => {
    const screen = render(
      <FileUploadItem name="nota.xml" size={1024} progress={40} onRemove={() => {}} />,
    );

    const [bar] = byRole(screen, "progressbar");
    expect(bar!.props.accessibilityLabel).toBe("Enviando nota.xml");
    expect(bar!.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 40 });
  });

  test("o erro vence o progresso e oferece nova tentativa", () => {
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

    // Barra andando embaixo de uma falha diz duas coisas contrarias.
    expect(byRole(screen, "progressbar")).toHaveLength(0);
    expect(textOf(screen)).toContain("A rede caiu");

    act(() => byLabel(screen, "Tentar enviar nota.xml de novo")[0]!.props.onPress());
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  test("remover tem nome proprio e alvo alem do desenho", () => {
    const onRemove = mock(() => {});
    const screen = render(<FileUploadItem name="nota.xml" size={1024} onRemove={onRemove} />);

    const [remove] = byLabel(screen, "Remover nota.xml");
    expect(remove!.props.hitSlop).toBe(14);

    act(() => remove!.props.onPress());
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  test("o nome longo corta por numberOfLines, e nao por classe", () => {
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

describe("FileUpload, quando o seletor recusa abrir", () => {
  test("vale como nao ter escolhido nada, e nenhuma promessa morre solta", async () => {
    const onSelect = mock(() => {});
    const onReject = mock(() => {});
    refuses = true;

    // Sem o catch da peca a rejeicao morreria solta: o `onPress` do Pressable
    // nao espera o retorno de ninguem.
    const screen = render(<FileUpload label="Anexar" onSelect={onSelect} onReject={onReject} />);
    await choose(screen);

    expect(onSelect).toHaveBeenCalledTimes(0);
    expect(onReject).toHaveBeenCalledTimes(0);
    refuses = false;
  });
});
