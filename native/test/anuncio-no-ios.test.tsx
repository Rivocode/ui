import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, setSystemTime, test } from "bun:test";
import type { ReactElement } from "react";
import { AccessibilityInfo, Platform, Text } from "react-native";
import type { ReactTestRenderer } from "react-test-renderer";

import {
  Banner,
  Button,
  Carousel,
  DateRangePicker,
  FilterBar,
  ImageViewer,
  RivoProvider,
  useToast,
  type AppliedFilter,
} from "../src";
import { Conversation, Message, PromptInput } from "../src/ai";
import { act, byLabel, byRole, render } from "./helpers";

const spoken = AccessibilityInfo as unknown as {
  announced: readonly string[];
  clearAnnouncements: () => void;
};

const platform = Platform as unknown as { OS: string };
const home = platform.OS;

beforeEach(() => spoken.clearAnnouncements());
afterEach(() => {
  platform.OS = home;
});

const again = (screen: ReactTestRenderer, element: ReactElement) =>
  act(() => screen.update(<RivoProvider>{element}</RivoProvider>));

const SYSTEMS = ["ios", "android", "web"] as const;

function heardOn(os: (typeof SYSTEMS)[number], run: () => void): readonly string[] {
  platform.OS = os;
  spoken.clearAnnouncements();
  run();
  return [...spoken.announced];
}

describe("Banner", () => {
  const banner = (description: string, tone: "info" | "danger" = "danger") => (
    <Banner tone={tone} title="Pagamento recusado" description={description} />
  );

  const story = () => {
    const screen = render(banner("O cartão foi recusado."));
    again(screen, banner("Tente outro cartão."));
    again(screen, banner("Tente outro cartão."));
  };

  test("no iOS o tom urgente fala ao montar, e cada troca de texto fala uma vez", () => {
    expect(heardOn("ios", story)).toEqual([
      "Pagamento recusado. O cartão foi recusado.",
      "Pagamento recusado. Tente outro cartão.",
    ]);
  });

  test("o tom educado nao fala ao montar, so quando o texto muda", () => {
    const heard = heardOn("ios", () => {
      const screen = render(banner("Sincronizando.", "info"));
      again(screen, banner("Sincronizado.", "info"));
    });
    expect(heard).toEqual(["Pagamento recusado. Sincronizado."]);
  });

  test("no Android e no web quem fala e a regiao viva, e o anuncio nao dobra", () => {
    expect(heardOn("android", story)).toEqual([]);
    expect(heardOn("web", story)).toEqual([]);
  });
});

describe("DateRangePicker", () => {
  beforeAll(() => setSystemTime(new Date("2026-08-15T12:00:00")));
  afterAll(() => setSystemTime());

  const story = () => {
    const screen = render(<DateRangePicker value={null} onValueChange={() => {}} label="Período" />);
    act(() => byLabel(screen, "Período")[0]!.props.onPress());
    act(() => byLabel(screen, "20/08/2026")[0]!.props.onPress());
    act(() => byLabel(screen, "05/08/2026")[0]!.props.onPress());
  };

  test("no iOS abrir a folha nao fala, e cada toque diz o resumo novo", () => {
    const heard = heardOn("ios", story);
    expect(heard).toEqual(["20/08/2026 – toque no último dia.", "05/08/2026 – 20/08/2026"]);
  });

  test("no Android o resumo sai so pela regiao viva", () => {
    expect(heardOn("android", story)).toEqual([]);
  });
});

describe("ImageViewer", () => {
  const PHOTOS = Array.from({ length: 4 }, (_, position) => ({
    src: `https://exemplo.com.br/sala-${position + 1}.jpg`,
    alt: `Sala comercial, foto ${position + 1}`,
  }));
  const viewer = (index: number | null) => (
    <ImageViewer images={PHOTOS} index={index} onIndexChange={() => {}} />
  );

  const story = () => {
    const screen = render(viewer(null));
    again(screen, viewer(0));
    again(screen, viewer(1));
    again(screen, viewer(null));
    again(screen, viewer(2));
  };

  test("no iOS abrir nao fala, porque o foco ja le o contador; trocar de foto fala", () => {
    expect(heardOn("ios", story)).toEqual(["2 de 4: Sala comercial, foto 2"]);
  });

  test("no Android a troca sai so pela regiao viva", () => {
    expect(heardOn("android", story)).toEqual([]);
  });
});

describe("FilterBar", () => {
  const APPLIED: AppliedFilter[] = [
    { id: "status", label: "Situação", value: "Em aberto" },
    { id: "customer", label: "Cliente", value: "Clínica São Lucas" },
  ];
  const bar = (filters: AppliedFilter[]) => (
    <FilterBar filters={filters} onFiltersChange={() => {}} />
  );

  const story = () => {
    const screen = render(bar(APPLIED));
    again(screen, bar(APPLIED.slice(0, 1)));
    again(screen, bar([]));
  };

  test("no iOS montar nao fala, e cada contagem nova fala", () => {
    expect(heardOn("ios", story)).toEqual(["1 filtro aplicado", "Nenhum filtro aplicado"]);
  });

  test("no Android a contagem sai so pela regiao viva", () => {
    expect(heardOn("android", story)).toEqual([]);
  });
});

describe("useToast", () => {
  function Emitter() {
    const toast = useToast();
    return (
      <Button onPress={() => toast.add({ title: "Nota emitida", description: "Foi por e-mail." })}>
        Emitir
      </Button>
    );
  }

  const story = () => {
    const screen = render(<Emitter />);
    act(() => byRole(screen, "button")[0]!.props.onPress());
  };

  test("no iOS o aviso diz o titulo e a descricao quando aparece", () => {
    expect(heardOn("ios", story)).toEqual(["Nota emitida. Foi por e-mail."]);
  });

  test("no Android o aviso sai so pela regiao viva", () => {
    expect(heardOn("android", story)).toEqual([]);
  });
});

describe("Carousel", () => {
  const PLANS = ["Básico", "Profissional", "Empresa"];
  const carousel = (index: number, indicators = false) => (
    <Carousel
      label="Planos"
      items={PLANS}
      index={index}
      onIndexChange={() => {}}
      indicators={indicators}
      renderItem={(plan) => <Text>{plan}</Text>}
    />
  );

  const story = () => {
    const screen = render(carousel(0));
    again(screen, carousel(1));
    again(screen, carousel(2));
  };

  test("no iOS montar nao fala, e cada slide novo fala", () => {
    expect(heardOn("ios", story)).toEqual(["Slide 2 de 3", "Slide 3 de 3"]);
  });

  test("com os pontos nao ha regiao viva, e o iOS tambem fica calado", () => {
    const heard = heardOn("ios", () => {
      const screen = render(carousel(0, true));
      again(screen, carousel(1, true));
    });
    expect(heard).toEqual([]);
  });

  test("no Android o slide sai so pela regiao viva", () => {
    expect(heardOn("android", story)).toEqual([]);
  });
});

describe("Conversation", () => {
  type Item = { id: string; role: "user" | "assistant"; text: string; streaming?: boolean };
  const FIRST: Item[] = [
    { id: "1", role: "user", text: "Quanto faturei?" },
    { id: "2", role: "assistant", text: "R$ 12.400,00 em agosto." },
  ];
  const conversation = (items: Item[]) => (
    <Conversation
      items={items}
      keyExtractor={(item) => item.id}
      renderItem={(item) => (
        <Message role={item.role} streaming={item.streaming}>
          {item.text}
        </Message>
      )}
    />
  );

  const story = () => {
    const screen = render(conversation(FIRST));
    const asked = [...FIRST, { id: "3", role: "user" as const, text: "E em julho?" }];
    again(screen, conversation(asked));
    const writing = { id: "4", role: "assistant" as const, text: "R$ 9", streaming: true };
    again(screen, conversation([...asked, writing]));
    again(screen, conversation([...asked, { ...writing, text: "R$ 9.800,00", streaming: true }]));
    again(screen, conversation([...asked, { ...writing, text: "R$ 9.800,00 em julho.", streaming: false }]));
    again(screen, conversation([...asked, { ...writing, text: "R$ 9.800,00 em julho.", streaming: false }]));
  };

  test("no iOS a historia montada nao fala, e a resposta fala uma vez, ja inteira", () => {
    expect(heardOn("ios", story)).toEqual(["E em julho?", "R$ 9.800,00 em julho."]);
  });

  test("announcement troca o texto dito, e null espera", () => {
    const heard = heardOn("ios", () => {
      const said = (item: Item) => (item.streaming ? null : `Resposta: ${item.text}`);
      const screen = render(
        <Conversation
          items={FIRST}
          keyExtractor={(item) => item.id}
          renderItem={() => <Text>ignorado</Text>}
          announcement={said}
        />,
      );
      const next = (item: Item) => (
        <Conversation
          items={[...FIRST, item]}
          keyExtractor={(entry) => entry.id}
          renderItem={() => <Text>ignorado</Text>}
          announcement={said}
        />
      );
      again(screen, next({ id: "3", role: "assistant", text: "Pronto", streaming: true }));
      again(screen, next({ id: "3", role: "assistant", text: "Pronto" }));
    });
    expect(heard).toEqual(["Resposta: Pronto"]);
  });

  test("no Android a mensagem nova sai so pela regiao viva", () => {
    expect(heardOn("android", story)).toEqual([]);
  });
});

describe("pecas sem regiao viva", () => {
  test("o PromptInput continua anunciando o teto no Android, como antes", () => {
    const field = (value: string) => (
      <PromptInput value={value} onValueChange={() => {}} onSubmit={() => {}} maxLength={5} />
    );
    for (const os of SYSTEMS) {
      const heard = heardOn(os, () => {
        const screen = render(field("1234"));
        again(screen, field("12345"));
      });
      expect(heard).toEqual(["Limite de 5 caracteres atingido."]);
    }
  });
});
