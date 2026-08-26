import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import {
  Sidebar,
  SidebarBrand,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarInput,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuRow,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarProvider,
  SidebarTrigger,
} from "../src/components/sidebar";

function withTheme(node: React.ReactNode) {
  return render(<RivoProvider scope="local">{node}</RivoProvider>);
}

function sidebar(defaultOpen: boolean) {
  return render(
    <RivoProvider scope="local">
      <SidebarProvider defaultOpen={defaultOpen}>
        <Sidebar>
          <SidebarInput placeholder="Buscar" />
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem href="#painel" active>
                Painel
              </SidebarMenuItem>
              <SidebarMenuSub label="Cadastros" defaultOpen>
                <SidebarMenuItem href="#clientes">Clientes</SidebarMenuItem>
              </SidebarMenuSub>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <SidebarTrigger />
      </SidebarProvider>
    </RivoProvider>,
  );
}

test("aberta, a barra mostra o nome de cada destino", () => {
  sidebar(true);

  expect(screen.getByText("Painel")).toBeDefined();
  expect(screen.getByText("Cadastros")).toBeDefined();
  // O submenu aberto ja deixa o filho alcancavel, sem mais um clique.
  expect(screen.getByText("Clientes")).toBeDefined();
});

test("encolhida, o campo de busca vira botao, porque 3,5rem nao aceitam texto", () => {
  const { container } = sidebar(false);

  expect(container.querySelector("input[type=search]")).toBeNull();
  expect(screen.getByRole("button", { name: "Buscar" })).toBeDefined();
});

test("encolhida, o submenu vira menu ao lado em vez de sumir", () => {
  sidebar(false);

  // A lista some da barra, senao ela indentaria dentro de 3,5rem.
  expect(screen.queryByText("Clientes")).toBeNull();

  // E o pai continua alcancavel, agora como gatilho de menu.
  const trigger = screen.getByRole("button", { name: "Cadastros" });
  fireEvent.click(trigger);

  expect(screen.getByRole("menuitem", { name: "Clientes" })).toBeDefined();
});

test("o gatilho abre e fecha, e diz qual dos dois no aria", () => {
  sidebar(true);

  const trigger = screen.getByRole("button", { name: "Fechar menu" });
  expect(trigger.getAttribute("aria-expanded")).toBe("true");

  fireEvent.click(trigger);
  expect(screen.getByRole("button", { name: "Abrir menu" }).getAttribute("aria-expanded")).toBe(
    "false",
  );
});

test("a marca de lugar avisa que esta carregando, e nao finge uma lista", () => {
  const { container } = render(
    <RivoProvider scope="local">
      <SidebarProvider defaultOpen>
        <Sidebar>
          <SidebarMenuSkeleton count={4} />
        </Sidebar>
      </SidebarProvider>
    </RivoProvider>,
  );

  const list = container.querySelector("[aria-busy=true]");
  expect(list).not.toBeNull();
  expect(list!.querySelectorAll("li").length).toBe(4);
});

/* ---------------------------------------------------------------------------
 * Celular
 *
 * O ambiente de teste responde `false` para toda media query, entao o caminho
 * do celular nunca era exercitado: os dois bugs que ele teve, abrir sozinha ao
 * carregar e continuar cobrindo a pagina depois de escolher um item, passaram
 * inteiros pela suite.
 * ------------------------------------------------------------------------- */

/** Faz o corte de celular responder verdadeiro enquanto o teste roda. */
function comCelular<T>(run: () => T): T {
  const real = window.matchMedia;
  window.matchMedia = ((query: string) =>
    ({
      matches: query.includes("max-width: 639px"),
      media: query,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false,
      onchange: null,
    }) as unknown as MediaQueryList) as typeof window.matchMedia;

  try {
    return run();
  } finally {
    window.matchMedia = real;
  }
}

test("no celular a barra comeca fechada, mesmo com defaultOpen", () => {
  comCelular(() => {
    sidebar(true);
    // `defaultOpen` fala da coluna da mesa. No celular a barra cobre a tela, e
    // abrir sozinha tapa justamente o que a pessoa veio ver.
    expect(screen.queryByText("Painel")).toBeNull();
  });
});

test("no celular o gatilho abre a folha", () => {
  comCelular(() => {
    sidebar(true);
    fireEvent.click(screen.getByRole("button", { name: "Abrir menu" }));
    expect(screen.getByText("Painel")).toBeDefined();
  });
});

test("no celular, escolher um destino fecha a folha", () => {
  comCelular(() => {
    sidebar(true);
    fireEvent.click(screen.getByRole("button", { name: "Abrir menu" }));
    fireEvent.click(screen.getByText("Painel"));
    // Na mesa ela continuaria aberta: ali a barra nao cobre nada.
    expect(screen.queryByText("Painel")).toBeNull();
  });
});

function sidebarWithGroup(defaultOpen: boolean) {
  return render(
    <RivoProvider scope="local">
      <SidebarProvider defaultOpen={defaultOpen}>
        <Sidebar>
          <SidebarContent>
            <SidebarGroup label="Catalogo">
              <SidebarMenu>
                <SidebarMenuItem href="#pecas">Pecas</SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    </RivoProvider>,
  );
}

test("encolhida, o rotulo do grupo some em vez de sair cortado", () => {
  // Em 3,5rem "CATALOGO" viraria "CATA". Sumir diz menos; mentir sobre o nome
  // do grupo diz errado.
  const { container } = sidebarWithGroup(false);

  expect(screen.queryByText("Catalogo")).toBeNull();
  // O destino continua la: encolhida, ele e so o icone, com o nome no tooltip.
  expect(container.querySelector('a[href="#pecas"]')).not.toBeNull();
});

test("aberta, o rotulo do grupo aparece", () => {
  sidebarWithGroup(true);

  expect(screen.getByText("Catalogo")).toBeDefined();
});

/* ---------------------------------------------------------------------------
 * Nome de cada destino com a barra encolhida
 *
 * Encolhida a barra, o rotulo sai da tela e o `<a>` fica so com o icone. Uma
 * suite de interacao mediu a arvore de acessibilidade do navegador e achou
 * doze links sem nome nenhum - no estado que e o padrao de toda tela de
 * operacao. O leitor de tela anuncia "link" doze vezes seguidas.
 *
 * O que estes testes nao alcancam: o happy-dom nao computa a arvore de
 * acessibilidade do navegador. O `getByRole(..., { name })` aqui usa o calculo
 * do dom-accessibility-api, que le `aria-label` e o texto dos filhos - e o
 * bastante para provar que o nome existe no DOM, e nao para provar como cada
 * motor o anuncia.
 * ------------------------------------------------------------------------- */

test("encolhida, o destino continua tendo nome, e nao vira um link mudo", () => {
  sidebar(false);

  expect(screen.getByRole("link", { name: "Painel" })).toBeDefined();
});

test("encolhida, o destino de filho estruturado tambem tem nome", () => {
  // Nem todo item chega como texto puro: quem monta a barra costuma passar um
  // `<span>` com marcacao dentro, e ai nao ha string para virar `aria-label`.
  render(
    <RivoProvider scope="local">
      <SidebarProvider defaultOpen={false}>
        <Sidebar>
          <SidebarMenu>
            <SidebarMenuItem href="#feedback">
              <span>Feedback</span>
            </SidebarMenuItem>
          </SidebarMenu>
        </Sidebar>
      </SidebarProvider>
    </RivoProvider>,
  );

  expect(screen.getByRole("link", { name: "Feedback" })).toBeDefined();
});

test("aberta, o nome vem do texto na linha, sem rotulo repetido", () => {
  // Larga, o texto esta visivel e um `aria-label` por cima so criaria uma
  // segunda fonte de verdade para o mesmo nome.
  sidebar(true);

  const link = screen.getByRole("link", { name: "Painel" });
  expect(link.getAttribute("aria-label")).toBeNull();
});

test("o botao de acao da linha tem nome, mesmo quem esquecer de dar um", () => {
  // Um botao de icone sem nome e um "botao" anunciado pelo leitor de tela, e
  // nada mais. O padrao nao substitui o nome certo - "Opcoes de Clientes" diz
  // mais que "Mais opcoes" - mas e melhor que o silencio, e quem passa o seu
  // continua mandando.
  withTheme(
    <SidebarProvider defaultOpen>
      <Sidebar>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuRow>
              <SidebarMenuItem href="#clientes">Clientes</SidebarMenuItem>
              <SidebarMenuAction />
            </SidebarMenuRow>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>,
  );

  expect(screen.getByRole("button", { name: "Mais opções" })).toBeDefined();
});

test("o nome escrito por quem monta vence o padrao", () => {
  withTheme(
    <SidebarProvider defaultOpen>
      <Sidebar>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuRow>
              <SidebarMenuItem href="#clientes">Clientes</SidebarMenuItem>
              <SidebarMenuAction aria-label="Opções de Clientes" />
            </SidebarMenuRow>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>,
  );

  expect(screen.getByRole("button", { name: "Opções de Clientes" })).toBeDefined();
});

function sidebarWithFooter(defaultOpen: boolean) {
  return render(
    <RivoProvider scope="local">
      <SidebarProvider defaultOpen={defaultOpen}>
        <Sidebar>
          <SidebarBrand mark={<span>R</span>}>RivoCode</SidebarBrand>
          <SidebarFooter data-testid="rodape">
            <span>EB</span>
          </SidebarFooter>
        </Sidebar>
      </SidebarProvider>
    </RivoProvider>,
  );
}

test("encolhida, o rodape centraliza como a marca ja centraliza", () => {
  // Com a marca centrada no topo e o rodape encostado a esquerda, a coluna
  // encolhida fica torta - o mesmo sintoma que o comentario do SidebarBrand
  // descreve, so que na outra ponta da barra.
  sidebarWithFooter(false);

  expect(screen.getByTestId("rodape").className).toContain("items-center");
});

test("aberta, o rodape volta a alinhar pela esquerda", () => {
  // Centralizar sempre trocaria um defeito por outro: com a barra larga, o
  // bloco do usuario ficaria boiando no meio da coluna.
  sidebarWithFooter(true);

  expect(screen.getByTestId("rodape").className).not.toContain("items-center");
});

test("a linha com acao nao aninha um <li> dentro do outro", () => {
  // O SidebarMenuRow ja e o <li> da linha. Se o item abrir outro por dentro,
  // o HTML sai invalido - e a conta so chega no SSR: o navegador recebe o
  // texto, conserta separando os dois em irmaos, e a arvore consertada nao
  // bate com a que o React espera na hidratacao.
  const { container } = withTheme(
    <SidebarProvider defaultOpen>
      <Sidebar>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuRow>
              <SidebarMenuItem href="#clientes">Clientes</SidebarMenuItem>
              <SidebarMenuAction aria-label="Opcoes de Clientes" />
            </SidebarMenuRow>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>,
  );

  expect(container.querySelector("li li")).toBeNull();
  expect(container.querySelectorAll("li")).toHaveLength(1);
});

test("sem a linha em volta, o item continua sendo o proprio <li>", () => {
  // O item sozinho dentro do <ul> precisa continuar entregando o <li>, senao
  // a lista perde a semantica que o leitor de tela conta em voz alta.
  const { container } = withTheme(
    <SidebarProvider defaultOpen>
      <Sidebar>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem href="#painel">Painel</SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>,
  );

  expect(container.querySelectorAll("li")).toHaveLength(1);
  expect(container.querySelector("li > a")).not.toBeNull();
});
