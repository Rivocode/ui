export type RoleBreak = {
  role: string;
  silent: boolean;
  effect: string;
  version?: string;
  note?: string;
  meant?: string;
};

export type ThemeReport = {
  selector: string;
  files: string[];
  declared: number;
  required: number;
  missing: RoleBreak[];
  unknown: string[];
};

export const OPTIONAL: Record<string, string> = {
  "--rc-accent-image":
    "acabamento: o acento em gradiente. Ausente, o botão primário fica chapado, que é como os dois temas da casa nascem.",
  "--rc-accent-shadow":
    "acabamento: o brilho do acento. Ausente, o primário não acende sozinho, e nenhuma peça pede que ele acenda.",
  "--rc-overlay-filter":
    "acabamento: o vidro fosco atrás do diálogo, da folha e da paleta. Ausente, a tarja é só cor, que é o padrão.",
};

export const ARRIVED: Record<string, { version: string; note: string }> = {
  "--rc-font-sans": {
    version: "0.7.0",
    note: "as três famílias saíram de `src/tokens/scales.css`, que é camada global, e passaram para dentro do seletor de tema. Um tema escrito para a 0.6.x compila, constrói e renderiza sem família nenhuma.",
  },
  "--rc-font-display": {
    version: "0.7.0",
    note: "saiu da camada global junto com `--rc-font-sans` e `--rc-font-mono`. Tema escrito antes dela não declara nenhuma das três.",
  },
  "--rc-font-mono": {
    version: "0.7.0",
    note: "saiu da camada global junto com `--rc-font-sans` e `--rc-font-display`. Tema escrito antes dela não declara nenhuma das três.",
  },
  "--rc-border-disabled": {
    version: "0.7.0",
    note: "nasceu para o controle travado ter sinal visual onde `--rc-surface` e `--rc-surface-raised` são a mesma cor. Tema escrito antes dela não tem.",
  },
};

const EFFECTS: Array<{ role: RegExp; silent: boolean; effect: string }> = [
  {
    role: /^--rc-bg$/,
    silent: false,
    effect:
      "A página fica sem fundo próprio e aparece o branco do navegador, com o texto claro do tema por cima dele.",
  },
  {
    role: /^--rc-surface$/,
    silent: false,
    effect:
      "Cartão, painel e campo perdem o corpo: encostam no fundo da página, e a tela vira um bloco só.",
  },
  {
    role: /^--rc-surface-raised$/,
    silent: false,
    effect:
      "Menu, dica e cabeçalho de tabela param de saltar do resto: o flutuante fica da cor de quem está embaixo dele.",
  },
  {
    role: /^--rc-overlay$/,
    silent: false,
    effect:
      "Diálogo, folha e paleta abrem sem tarja: a página atrás continua nítida, e nada mostra que ela está travada.",
  },
  {
    role: /^--rc-fg$/,
    silent: false,
    effect:
      "O texto principal perde a cor do tema e herda a de quem está por cima; num tema escuro ele sai preto sobre preto.",
  },
  {
    role: /^--rc-fg-muted$/,
    silent: true,
    effect:
      "O texto de apoio sai com a cor do texto principal, e a hierarquia da página desaparece sem nada parecer quebrado.",
  },
  {
    role: /^--rc-fg-subtle$/,
    silent: true,
    effect:
      "Rótulo, legenda e cabeçalho de coluna sobem para a cor do texto principal e passam a competir com ele.",
  },
  {
    role: /^--rc-fg-disabled$/,
    silent: true,
    effect:
      "O texto do controle desativado sai igual ao do controle que ainda responde, e a pessoa clica no que não responde.",
  },
  {
    role: /^--rc-accent$/,
    silent: false,
    effect:
      "O botão primário sai sem preenchimento: a ação principal da tela vira um retângulo transparente.",
  },
  {
    role: /^--rc-accent-hover$/,
    silent: true,
    effect:
      "O primário para de reagir ao ponteiro. Um retrato da tela não mostra nada, e só ao vivo ela fica morta.",
  },
  {
    role: /^--rc-accent-active$/,
    silent: true,
    effect:
      "Some o instante do clique: o botão não muda ao ser pressionado, e a pessoa clica duas vezes por não saber se pegou.",
  },
  {
    role: /^--rc-accent-fg$/,
    silent: false,
    effect:
      "O que se lê sobre o acento herda a cor do texto da página e some dentro da cor da marca.",
  },
  {
    role: /^--rc-accent-text$/,
    silent: true,
    effect:
      "Link e item ativo saem com a cor do texto comum: o que está selecionado deixa de se ver, e a navegação parece congelada.",
  },
  {
    role: /^--rc-accent-subtle$/,
    silent: true,
    effect:
      "Item de menu sob o ponteiro e item marcado ficam sem fundo, e o menu deixa de mostrar onde a pessoa está.",
  },
  {
    role: /^--rc-selected$/,
    silent: true,
    effect:
      "A linha escolhida da tabela fica igual às outras: a seleção continua acontecendo, e só não se vê.",
  },
  {
    role: /^--rc-skeleton$/,
    silent: true,
    effect:
      "O carregamento fica sem marca de lugar e o corpo do `Avatar` some: a tela parece vazia em vez de ocupada.",
  },
  {
    role: /^--rc-border$/,
    silent: false,
    effect:
      "Toda linha comum cai em `currentColor` e sai da cor do texto: a tela ganha grades fortes que ninguém desenhou.",
  },
  {
    role: /^--rc-border-strong$/,
    silent: false,
    effect:
      "A borda que identifica campo e controle cai na cor do texto, e a fronteira de 3:1 que a WCAG 1.4.11 pede deixa de ser a que foi medida.",
  },
  {
    role: /^--rc-border-disabled$/,
    silent: false,
    effect:
      "O controle travado fica com a borda na cor do texto, mais forte que a do controle vivo: o desativado passa a parecer o único clicável.",
  },
  {
    role: /^--rc-line-hover$/,
    silent: true,
    effect: "A borda para de responder ao ponteiro, e o campo deixa de dizer que aceita foco.",
  },
  {
    role: /^--rc-ring$/,
    silent: true,
    effect:
      "O anel de foco do teclado sai na cor do texto e some contra ele. Retrato nenhum pega isso: quem navega de Tab perde o rastro, e a tela fica inacessível em silêncio.",
  },
  {
    role: /^--rc-(success|warning|danger|info)$/,
    silent: false,
    effect:
      "O preenchimento desse tom desaparece: `Badge`, `Alert` e `Progress` do tom saem sem cor, e sucesso e perigo viram o mesmo nada.",
  },
  {
    role: /^--rc-(success|warning|danger|info)-fg$/,
    silent: false,
    effect:
      "O texto que se lê sobre o preenchimento desse tom herda a cor da página e some dentro dela.",
  },
  {
    role: /^--rc-(success|warning|danger|info)-text$/,
    silent: true,
    effect:
      "A mensagem desse tom sai com a cor do texto comum: um erro de formulário deixa de parecer erro.",
  },
  {
    role: /^--rc-(success|warning|danger|info)-subtle$/,
    silent: true,
    effect:
      "O `Alert` desse tom sai sem fundo tênue, e a faixa que separa o aviso do resto da página desaparece.",
  },
  {
    role: /^--rc-font-sans$/,
    silent: true,
    effect:
      "A página inteira cai na fonte do navegador. Não há valor de `:root` por baixo para segurar a queda, e isso é de propósito: o `tsc` compila, o Vite constrói, e a única coisa errada é a tela.",
  },
  {
    role: /^--rc-font-display$/,
    silent: true,
    effect:
      "Todo título perde a família da marca e volta para a do navegador. Como o corpo do texto pode estar certo, a tela parece só um pouco esquisita, e ninguém abre chamado por isso.",
  },
  {
    role: /^--rc-font-mono$/,
    silent: true,
    effect:
      "`Kbd`, bloco de código e coluna de número saem na fonte do texto, e os dígitos deixam de alinhar na tabela.",
  },
  {
    role: /^--rc-text-(display|hero)$/,
    silent: true,
    effect:
      "O título de marca perde o tamanho em `clamp()` e herda o do parágrafo: o herói da página vira um parágrafo em negrito.",
  },
  {
    role: /^--rc-shadow-[1-3]$/,
    silent: true,
    effect:
      "O flutuante perde a sombra e o fio de 1px que vem junto dela: menu, painel e diálogo encostam na página sem nada os separar.",
  },
  {
    role: /^--rc-glow-accent$/,
    silent: true,
    effect:
      "A classe `shadow-glow` deixa de acender. Nenhuma peça a liga sozinha, então a falta aparece só onde a sua tela pediu o brilho.",
  },
  {
    role: /^--rc-chart-[1-8]$/,
    silent: false,
    effect:
      "O gráfico desenha essa série sem cor. As oito são usadas em ordem, então faltar uma de número alto só aparece no gráfico que tem muitas séries.",
  },
  {
    role: /^--rc-chart-grid$/,
    silent: true,
    effect: "A grade de fundo do gráfico some, e o valor fica sem régua para ser lido.",
  },
];

export function effectOf(role: string) {
  return EFFECTS.find((entry) => entry.role.test(role));
}

export function requiredRoles(roles: readonly string[]) {
  return roles.filter((role) => !(role in OPTIONAL));
}

type Block = {
  selector: string;
  files: Set<string>;
  roles: Set<string>;
  values: Map<string, string>;
};

const DECLARATION = /^\s*(--rc-[a-z0-9-]+)\s*:([\s\S]*)$/;

function scan(file: string, css: string, into: Map<string, Block>) {
  const stack: string[] = [];
  let buffer = "";

  const close = () => {
    const found = DECLARATION.exec(buffer);
    const selector = stack[stack.length - 1];
    buffer = "";

    if (!found || !selector || selector.startsWith("@")) return;

    const block = into.get(selector) ?? {
      selector,
      files: new Set<string>(),
      roles: new Set<string>(),
      values: new Map<string, string>(),
    };
    block.files.add(file);
    block.roles.add(found[1]!);
    block.values.set(found[1]!, found[2]!.trim());
    into.set(selector, block);
  };

  for (const char of css.replace(/\/\*[\s\S]*?\*\//g, " ")) {
    if (char === "{") {
      stack.push(buffer.replace(/\s+/g, " ").trim());
      buffer = "";
    } else if (char === "}") {
      close();
      stack.pop();
    } else if (char === ";") {
      close();
    } else {
      buffer += char;
    }
  }
}

function distance(one: string, other: string) {
  if (Math.abs(one.length - other.length) > 2) return 9;

  let row = Array.from({ length: other.length + 1 }, (_, at) => at);

  for (let here = 1; here <= one.length; here++) {
    const next = [here];
    for (let there = 1; there <= other.length; there++) {
      next[there] = Math.min(
        row[there]! + 1,
        next[there - 1]! + 1,
        row[there - 1]! + (one[here - 1] === other[there - 1] ? 0 : 1),
      );
    }
    row = next;
  }

  return row[other.length]!;
}

export type ThemeBlock = {
  selector: string;
  files: string[];
  tokens: Record<string, string>;
};

export function themeBlocks(sources: ReadonlyArray<{ file: string; css: string }>): ThemeBlock[] {
  const blocks = new Map<string, Block>();
  for (const { file, css } of sources) scan(file, css, blocks);

  return [...blocks.values()].map((block) => ({
    selector: block.selector,
    files: [...block.files],
    tokens: Object.fromEntries(block.values),
  }));
}

export function reportOf(
  selector: string,
  files: readonly string[],
  present: ReadonlySet<string>,
  roles: readonly string[],
): ThemeReport | undefined {
  const required = requiredRoles(roles);
  const known = new Set<string>(roles);

  const declared = required.filter((role) => present.has(role));
  if (declared.length === 0) return undefined;

  const unknown = [...present].filter((role) => !known.has(role) && !role.startsWith("--rc-p-"));

  const missing = required
    .filter((role) => !present.has(role))
    .map((role): RoleBreak => {
      const what = effectOf(role);
      const arrived = ARRIVED[role];
      const meant = unknown.find((wrong) => distance(wrong, role) <= 2);

      return {
        role,
        silent: what?.silent ?? true,
        effect: what?.effect ?? "Papel de tema sem consequência escrita nesta versão do comando.",
        ...(arrived ? { version: arrived.version, note: arrived.note } : {}),
        ...(meant ? { meant } : {}),
      };
    });

  return {
    selector,
    files: [...files],
    declared: declared.length,
    required: required.length,
    missing,
    unknown,
  };
}

export function checkThemes(
  sources: ReadonlyArray<{ file: string; css: string }>,
  roles: readonly string[],
): ThemeReport[] {
  const reports: ThemeReport[] = [];

  for (const block of themeBlocks(sources)) {
    const report = reportOf(block.selector, block.files, new Set(Object.keys(block.tokens)), roles);
    if (report) reports.push(report);
  }

  return reports;
}
