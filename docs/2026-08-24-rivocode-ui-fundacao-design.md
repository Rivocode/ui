# @rivocode/ui: design da fundação

> **Documento histórico, concluído.** Descreve o que foi decidido e planejado
> em 24/08/2026, e é mantido como registro — não como instrução. Duas coisas
> dele já não valem: o pacote **não** é privado no GitHub Packages, está
> público no npm sob MIT desde a 0.2.0 (não precisa de `.npmrc` nem de token),
> e o catálogo cresceu muito além dos cinco componentes deste ciclo. Para o
> estado de hoje leia `docs/ESTADO.md`; para o contrato de uso,
> `.design-sync/conventions.md`.

Data: 2026-08-24
Estado: implementado, e este documento é registro
Ciclo: 1 de 4 (fundação)

## Contexto

O rivocode.com é uma landing em Vite, React 19 e Tailwind v4, dark-only. Ela tem
um bloco `@theme` bem cuidado em `src/styles/global.css` e 19 componentes de
página em `src/components`. O que ela não tem é biblioteca: não existe `Button`,
`Card` ou `Input`. Os botões são strings de classe Tailwind repetidas dentro do
hero, do header e da seção de contato.

A RivoCode quer usar um design system como fundação dos sistemas que entrega
para cliente: dashboards, portais, formulários, tabelas. A landing deixa de ser
o produto e passa a ser a primeira consumidora.

## Objetivo

Construir a fundação de `@rivocode/ui`: a arquitetura de tokens, os dois temas
da marca, o Provider, e uma fatia vertical de cinco componentes que prove que o
contrato aguenta o uso real.

## Não é objetivo deste ciclo

- O catálogo completo de componentes (ciclo 2)
- Migrar a landing para a biblioteca (ciclo 3)
- O site de documentação e o sync com o claude.ai/design (ciclo 4)
- Tema de cliente concreto. A arquitetura precisa suportar, mas nenhum cliente
  específico é modelado agora

## Decisões

| Decisão               | Escolha                                           | Motivo                                                                                                                               |
| --------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Onde mora             | Repositório novo `Rivocode/ui`, privado           | O usuário quer a biblioteca com vida própria desde o início                                                                          |
| Distribuição          | GitHub Packages, privado, `@rivocode/ui`          | Grátis dentro da org. O escopo do pacote é obrigado a bater com o dono do repositório                                                |
| Desenvolvimento local | `bun link`                                        | Evita o ciclo publish a cada ajuste. Só o deploy consome a versão publicada                                                          |
| Base de comportamento | Base UI v1.6, `@base-ui/react`                    | 41 componentes acessíveis num pacote só, com tree-shaking, feita pelo time do Radix, Floating UI e Material UI. React 19 é suportado |
| Estilo                | Autoral, escrito por nós                          | O DS precisa ter cara própria, não cara de biblioteca genérica                                                                       |
| Estilização           | Tailwind v4 obrigatório no consumidor, com preset | O dev do projeto de cliente escreve layout com o mesmo vocabulário da biblioteca                                                     |
| Tema                  | White-label, RivoCode como tema padrão            | O mesmo DS precisa servir cliente A e cliente B                                                                                      |
| Modos                 | Claro e escuro, ambos no ciclo 1                  | Dashboard se usa o dia inteiro. Retrofitar claro depois é caro                                                                       |
| Ícones                | `lucide-react` como dependência de par            | Cravar um set de ícones dentro de biblioteca white-label decide pelo cliente algo que é dele                                         |

## Arquitetura do pacote

```
ui/
  src/
    tokens/
      palette.css        camada 1, a paleta crua
      contract.css       camada 2, os apelidos semânticos com valores vazios
      themes/
        rivocode-dark.css
        rivocode-light.css
    primitives/          Button, Input, Card, Badge, Dialog, ...
    provider/            RivoProvider
    lib/                 cn(), utilitários internos
    index.ts             barrel de exports
  preset/                o preset de Tailwind exportado para o consumidor
  dist/                  ESM compilado, .d.ts, CSS pronta
  package.json
```

Exports do pacote:

| Caminho                   | Conteúdo                                              |
| ------------------------- | ----------------------------------------------------- |
| `@rivocode/ui`            | componentes e Provider                                |
| `@rivocode/ui/styles.css` | a CSS da biblioteca, incluindo tokens e temas         |
| `@rivocode/ui/preset`     | o preset de Tailwind com o vocabulário de utilitários |

**Regra que não se quebra:** nada em `src/primitives` importa cor literal, e
nada na biblioteca importa do projeto consumidor. Travado por lint, não por
disciplina.

## Arquitetura de tokens

Três camadas. Componente só enxerga a do meio.

**Camada 1, paleta crua.** `--rc-lima-500: #d4f34a`, a escala de grafites, os
cinzas neutros. Nenhum componente lê daqui.

**Camada 2, o contrato semântico.** É o que todo componente consome. Prefixo
`--rc-` para não colidir com variáveis do projeto do cliente.

Superfícies e conteúdo:

| Token                 | Papel                                             |
| --------------------- | ------------------------------------------------- |
| `--rc-bg`             | fundo da página                                   |
| `--rc-surface`        | cartão, painel, o que fica sobre o fundo          |
| `--rc-surface-raised` | o que fica sobre a superfície                     |
| `--rc-overlay`        | véu atrás de diálogo                              |
| `--rc-fg`             | texto principal                                   |
| `--rc-fg-muted`       | texto secundário                                  |
| `--rc-fg-subtle`      | rótulo, legenda, texto de apoio                   |
| `--rc-fg-disabled`    | texto desabilitado, isento de contraste por norma |

Acento. São dois tokens diferentes de propósito, e essa separação é o que
resolve o modo claro:

| Token                                     | Papel                                   |
| ----------------------------------------- | --------------------------------------- |
| `--rc-accent`                             | preenchimento: fundo de botão, realce   |
| `--rc-accent-fg`                          | texto que vai por cima do preenchimento |
| `--rc-accent-text`                        | acento usado como texto, link ou ícone  |
| `--rc-accent-hover`, `--rc-accent-active` | estados                                 |
| `--rc-accent-subtle`                      | fundo tênue de acento                   |

Linhas, foco, raio, sombra, tipografia e movimento seguem o mesmo padrão:
`--rc-border`, `--rc-border-strong`, `--rc-ring`, `--rc-radius-{sm,md,lg,pill}`,
`--rc-shadow-{1,2,3}`, `--rc-font-{sans,display,mono}`,
`--rc-duration-{fast,base,slow}`.

Estados, cada um com base, `-fg` e `-subtle`: `--rc-success`, `--rc-warning`,
`--rc-danger`, `--rc-info`.

**Camada 3, o tema.** Um arquivo CSS que preenche a camada 2 com valores da
camada 1. Trocar de tema é trocar esse arquivo, sem tocar em componente.

O Tailwind entra por cima com `@theme inline`, ligando `--color-surface` a
`var(--rc-surface)`. É assim que `bg-surface` funciona igual dentro da
biblioteca e no layout que o dev do projeto de cliente escreve.

## Os dois temas da RivoCode

Todo valor abaixo foi medido, não estimado. O mínimo adotado é 4,5 para 1 para
texto e 7 para 1 para texto principal.

### rivocode-dark (padrão)

| Token              | Valor     | Contraste medido                      |
| ------------------ | --------- | ------------------------------------- |
| `--rc-bg`          | `#0f1113` | base                                  |
| `--rc-surface`     | `#14171a` | base                                  |
| `--rc-fg`          | `#f2f3f0` | 16,99:1 sobre bg                      |
| `--rc-fg-muted`    | `#b9bfc6` | 10,21:1 sobre bg                      |
| `--rc-fg-subtle`   | `#8b9199` | 5,95:1 sobre bg, 5,66:1 sobre surface |
| `--rc-fg-disabled` | `#6c737b` | 3,94:1, isento por ser desabilitado   |
| `--rc-accent`      | `#d4f34a` | preenchimento                         |
| `--rc-accent-fg`   | `#0f1113` | 15,06:1 sobre a lima                  |
| `--rc-accent-text` | `#d4f34a` | 15,06:1 sobre bg                      |
| `--rc-success`     | `#3ddc97` | 10,71:1 sobre bg                      |
| `--rc-warning`     | `#f2b21c` | 10,06:1 sobre bg                      |
| `--rc-danger`      | `#ff6b6b` | 6,82:1 sobre bg                       |
| `--rc-info`        | `#6aa9ff` | 7,87:1 sobre bg                       |

O sucesso puxa para o teal em vez do verde, para não competir com a lima. Texto
sobre qualquer preenchimento de estado é `#0f1113`, medido entre 6,82:1 e
10,71:1.

### rivocode-light

| Token              | Valor     | Contraste medido              |
| ------------------ | --------- | ----------------------------- |
| `--rc-bg`          | `#fbfbfa` | base                          |
| `--rc-surface`     | `#ffffff` | base                          |
| `--rc-fg`          | `#14171a` | 17,38:1 sobre bg              |
| `--rc-fg-muted`    | `#5b6169` | 6,04:1 sobre bg               |
| `--rc-fg-subtle`   | `#6c737b` | 4,63:1 sobre bg               |
| `--rc-accent`      | `#d4f34a` | preenchimento, mantém a marca |
| `--rc-accent-fg`   | `#0f1113` | 15,06:1 sobre a lima          |
| `--rc-accent-text` | `#4a7100` | 5,55:1 sobre bg               |
| `--rc-success`     | `#0f766e` | 5,29:1 sobre bg               |
| `--rc-warning`     | `#a15c00` | 5,01:1 sobre bg               |
| `--rc-danger`      | `#c0261f` | 5,73:1 sobre bg               |
| `--rc-info`        | `#1d4ed8` | 6,47:1 sobre bg               |

No tema claro o texto sobre preenchimento de estado é branco, medido entre
5,19:1 e 6,70:1.

**Sobre a lima no claro:** ela continua sendo preenchimento de botão, com texto
escuro por cima, o que dá 15,06:1. Como texto ela seria ilegível, cerca de
1,6:1 sobre branco, então link e ícone de acento usam `--rc-accent-text`. O
`--color-brand-deep` que existe hoje no site, `#5b8c00`, foi medido e dá 3,90:1,
abaixo do mínimo, por isso o valor adotado é `#4a7100`.

## Linguagem visual do produto

O tema de hoje foi desenhado para uma landing. Um sistema de gestão tem outras
necessidades, e as três decisões abaixo separam as duas coisas sem perder a
marca.

### Escala de tipografia

A escala da landing (título de 44 a 88 pixels, respiro de 84 entre seções) é
certa para vender e errada para trabalhar. O núcleo do DS passa a ter escala de
produto, e os passos de marketing viram tokens que só o tema da RivoCode carrega.

| Token            | Tamanho | Uso                                    |
| ---------------- | ------- | -------------------------------------- |
| `--rc-text-xs`   | 12px    | rótulo, legenda, metadado              |
| `--rc-text-sm`   | 13px    | texto de apoio, célula densa de tabela |
| `--rc-text-base` | 14px    | corpo do produto                       |
| `--rc-text-md`   | 16px    | corpo confortável, leitura longa       |
| `--rc-text-lg`   | 18px    | subtítulo                              |
| `--rc-text-xl`   | 20px    | título de cartão                       |
| `--rc-text-2xl`  | 24px    | título de seção                        |
| `--rc-text-3xl`  | 30px    | título de página                       |

Os passos de marketing (`--rc-text-display`, `--rc-text-hero`) continuam
existindo, mas como extensão do tema da RivoCode, não como parte do núcleo. Um
sistema de cliente não deveria nem enxergar um título de 88 pixels.

### Forma e densidade

O botão em pílula é assinatura da RivoCode e continua sendo, mas em formulário
denso e em tabela ele parece brinquedo. Então o padrão do produto é canto
arredondado sóbrio, e a pílula vira variante explícita.

| Token              | Valor | Uso                                      |
| ------------------ | ----- | ---------------------------------------- |
| `--rc-radius-sm`   | 6px   | selo, caixa de seleção, elemento pequeno |
| `--rc-radius-md`   | 8px   | botão, campo, o padrão do produto        |
| `--rc-radius-lg`   | 12px  | cartão, painel                           |
| `--rc-radius-xl`   | 16px  | diálogo, folha lateral                   |
| `--rc-radius-pill` | 999px | variante de marketing, chamada para ação |

Densidade é uma propriedade do Provider, `comfortable` por padrão e `compact`
para tela de operação. Ela dirige a altura dos controles.

| Controle          | Confortável | Compacto |
| ----------------- | ----------- | -------- |
| `--rc-control-sm` | 32px        | 28px     |
| `--rc-control-md` | 40px        | 32px     |
| `--rc-control-lg` | 48px        | 38px     |

### Ordem de empilhamento

Quem aparece na frente de quem. Definir isso agora é o que evita o
`z-index: 9999` que todo sistema sem essa decisão acaba escondendo em algum
canto.

| Token             | Valor | Camada                                               |
| ----------------- | ----- | ---------------------------------------------------- |
| `--rc-z-base`     | 0     | conteúdo                                             |
| `--rc-z-sticky`   | 100   | cabeçalho fixo, coluna fixa de tabela                |
| `--rc-z-dropdown` | 200   | menu, seleção aberta                                 |
| `--rc-z-overlay`  | 300   | véu de diálogo                                       |
| `--rc-z-dialog`   | 400   | diálogo, folha lateral                               |
| `--rc-z-popover`  | 500   | popover disparado de dentro de um diálogo            |
| `--rc-z-toast`    | 600   | aviso, que precisa aparecer mesmo com diálogo aberto |
| `--rc-z-tooltip`  | 700   | dica, sempre a mais alta e sempre inofensiva         |

### Foco e movimento

O anel de foco é de 2px em `--rc-ring`, com 2px de afastamento, e nunca é
removido sem substituto. É a coisa mais fácil de apagar por parecer feia e a
mais cara de perder, porque quem navega por teclado fica cego sem ela.

Movimento usa `--rc-duration-fast` 120ms, `--rc-duration-base` 200ms e
`--rc-duration-slow` 320ms, com aceleração `cubic-bezier(0.2, 0, 0, 1)`. Tudo
respeita `prefers-reduced-motion`, como o `Reveal` da landing já faz hoje.

## O Provider

`RivoProvider` resolve quatro coisas:

1. **Tema:** aplica `rivocode-dark`, `rivocode-light` ou segue o sistema
2. **Escopo:** os tokens vão no `:root` (modo global, projeto novo) ou num
   elemento que envolve só um pedaço (modo escopado, projeto herdado do cliente
   onde o DS não pode vazar)
3. **Portal:** diálogo, menu e tooltip renderizam fora da árvore. No modo
   escopado eles sairiam sem tema. O Provider expõe um container de portal que
   carrega a classe do tema, e todo componente que usa portal aponta para ele
4. **Densidade:** `comfortable` ou `compact`, que dirige a altura de todo controle
   A direção de texto (escrita da direita para a esquerda) foi cortada de
   propósito. A Base UI oferece isso, mas a RivoCode atende cliente brasileiro, e
   construir a máquina agora seria manter para sempre um caminho que ninguém
   exercita. Quando aparecer um cliente que precise, é uma propriedade a mais no
   Provider.

O item 3 é a razão de o `Dialog` estar na fatia de prova. É um problema de
fundação que só aparece quando existe um componente com portal.

## Ferramentas de build

| Peça                  | Escolha                         | Motivo                                                                                |
| --------------------- | ------------------------------- | ------------------------------------------------------------------------------------- |
| Runtime e gerenciador | bun                             | É o que o rivocode.com já usa                                                         |
| Build do JS           | `tsdown`                        | Gera ESM e `.d.ts` numa passada, com entradas múltiplas para o tree-shaking funcionar |
| Build da CSS          | Tailwind CLI v4                 | Compila `src/tokens` e os estilos dos componentes em `dist/styles.css`                |
| Versionamento         | semver manual no `package.json` | Uma pessoa mantendo, e automação de release é custo antes da hora                     |
| CI                    | GitHub Actions                  | Roda lint, verificador de contraste e testes em cada push                             |

A publicação é manual e explícita, disparada por tag, nunca automática em push
para a branch principal. Biblioteca que publica sozinha publica engano.

## Fatia de prova

Cinco componentes, cada um escolhido por forçar uma parte diferente do contrato.

| Componente        | O que prova                                                   |
| ----------------- | ------------------------------------------------------------- |
| `Button`          | variantes, acento, foco, desabilitado, o sistema de variantes |
| `Field` + `Input` | erro, ajuda, rótulo, anel de foco, ligação de acessibilidade  |
| `Card`            | superfícies e elevação nos dois temas                         |
| `Badge`           | as cores de estado novas nos dois temas                       |
| `Dialog`          | portal, sobreposição, movimento, o modo escopado              |

Variantes de `Button` neste ciclo: `primary`, `secondary`, `ghost`,
`destructive`. Tamanhos `sm`, `md`, `lg`. Estados `disabled` e `loading`.

## Qualidade e verificação

**Lint que proíbe cor literal.** Nenhum `#hex`, `rgb(`, `hsl(` ou `oklch(` em
`src/primitives`. Cor só existe em `src/tokens`. É a regra que faz o white-label
sobreviver ao terceiro mês.

**Verificador de contraste.** Um script que lê os arquivos de tema, calcula os
pares que importam (texto sobre superfície, acento sobre fundo, texto sobre
preenchimento de estado) e falha se algum cair abaixo do mínimo. Roda no CI. Foi
ele que produziu todos os números deste documento.

**Testes de comportamento com `bun test`.** Testamos a nossa camada: variante
aplica a classe certa, `ref` é encaminhada, controlado e não controlado
funcionam, o Provider aplica o tema no escopo certo. Não testamos a
acessibilidade da Base UI, que é responsabilidade dela.

## Achado no site atual

`--color-muted-4` (`#6c737b`) dá 3,94:1 sobre o fundo do site, abaixo do mínimo
de 4,5:1. Ele é usado como cor de texto em 13 lugares, quase todos rótulos
pequenos em maiúsculas, tamanho 12px, o que agrava e não atenua, já que a
tolerância de 3:1 só vale para texto grande.

Os outros 13 usos são preenchimento e traço de ilustração SVG, que são
decorativos e passam no critério de 3:1 para elemento não textual.

Isso não bloqueia este ciclo. Fica registrado para o ciclo 3, a migração da
landing, onde os 13 usos textuais passam para `--rc-fg-subtle` (`#8b9199`,
5,95:1). O nome `muted-4` sobrevive como token de texto desabilitado.

## Riscos

| Risco                                                               | Mitigação                                                                                    |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Repositório separado gera atrito de publish durante a construção    | `bun link` no desenvolvimento. Só o deploy consome versão publicada                          |
| Base UI é nova. A v1 saiu recentemente                              | O contrato do pacote é nosso. Trocar o motor de um componente depois não afeta quem consome  |
| Estilo autoral é lento por componente                               | A fatia de prova de cinco peças calibra o custo real antes de comprometer o catálogo inteiro |
| GitHub Packages exige `.npmrc` com token em cada projeto consumidor | Documentar no README da biblioteca, e no ciclo 4 no site de documentação                     |
| Cor literal escapar para dentro de um componente                    | Regra de lint, que falha o build                                                             |

## Critérios de aceitação

1. `Rivocode/ui` existe, privado, com `@rivocode/ui` publicável no GitHub Packages
2. Os três arquivos de camada de token existem, e nenhum componente lê da camada 1
3. Os dois temas existem e o verificador de contraste passa em ambos
4. `RivoProvider` funciona em modo global e em modo escopado, e o `Dialog`
   renderiza com tema nos dois modos
5. Os cinco componentes da fatia de prova existem, com teste de comportamento
6. O lint falha se alguém escrever `#hex` dentro de `src/primitives`
7. A landing consegue consumir o pacote por `bun link` e renderizar um `Button`
8. A escala de produto existe separada dos passos de marketing, e nenhum
   componente do núcleo usa um passo de marketing
9. Nenhum componente declara `z-index` literal. Todos usam a escala de camadas
10. `Button` tem a variante de forma em pílula, e o padrão do produto é o canto
    de 8px
11. Os dois modos de densidade mudam a altura dos controles sem que nenhum
    componente saiba qual modo está ativo
