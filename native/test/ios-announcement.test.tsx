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

  test("on iOS the urgent tone speaks on mount, and each text change speaks once", () => {
    expect(heardOn("ios", story)).toEqual([
      "Pagamento recusado. O cartão foi recusado.",
      "Pagamento recusado. Tente outro cartão.",
    ]);
  });

  test("the polite tone does not speak on mount, only when the text changes", () => {
    const heard = heardOn("ios", () => {
      const screen = render(banner("Sincronizando.", "info"));
      again(screen, banner("Sincronizado.", "info"));
    });
    expect(heard).toEqual(["Pagamento recusado. Sincronizado."]);
  });

  test("on Android and on the web the live region is what speaks, and the announcement does not double", () => {
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

  test("on iOS opening the sheet does not speak, and each tap says the new summary", () => {
    const heard = heardOn("ios", story);
    expect(heard).toEqual(["20/08/2026 – toque no último dia.", "05/08/2026 – 20/08/2026"]);
  });

  test("on Android the summary goes out only through the live region", () => {
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

  test("on iOS opening does not speak, because focus already reads the counter; changing photo speaks", () => {
    expect(heardOn("ios", story)).toEqual(["2 de 4: Sala comercial, foto 2"]);
  });

  test("on Android the change goes out only through the live region", () => {
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

  test("on iOS mounting does not speak, and each new count speaks", () => {
    expect(heardOn("ios", story)).toEqual(["1 filtro aplicado", "Nenhum filtro aplicado"]);
  });

  test("on Android the count goes out only through the live region", () => {
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

  test("on iOS the notice says the title and the description when it appears", () => {
    expect(heardOn("ios", story)).toEqual(["Nota emitida. Foi por e-mail."]);
  });

  test("on Android the notice goes out only through the live region", () => {
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

  test("on iOS mounting does not speak, and each new slide speaks", () => {
    expect(heardOn("ios", story)).toEqual(["Slide 2 de 3", "Slide 3 de 3"]);
  });

  test("with the dots there is no live region, and iOS stays silent too", () => {
    const heard = heardOn("ios", () => {
      const screen = render(carousel(0, true));
      again(screen, carousel(1, true));
    });
    expect(heard).toEqual([]);
  });

  test("on Android the slide goes out only through the live region", () => {
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

  test("on iOS the mounted history does not speak, and the reply speaks once, already complete", () => {
    expect(heardOn("ios", story)).toEqual(["E em julho?", "R$ 9.800,00 em julho."]);
  });

  test("announcement changes the spoken text, and null waits", () => {
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

  test("on Android the new message goes out only through the live region", () => {
    expect(heardOn("android", story)).toEqual([]);
  });
});

describe("pieces without a live region", () => {
  test("PromptInput keeps announcing the ceiling on Android, as before", () => {
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
