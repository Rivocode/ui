# @rivocode/ui-native — proposta

Data: 2026-08-25. Proposta, não spec de implementação: o pacote nativo é um
projeto próprio, com o próprio ciclo de brainstorm → spec → plano.

## A tese

O mesmo produto que emite nota no desktop consulta nota no celular. O que deve
ser compartilhado **não é componente — é decisão**: os tokens (camada 1 e 3),
o vocabulário de classes e a skill. Componente nativo é outro animal (sem DOM,
sem portal, sem hover), e fingir que é o mesmo gera a pior das bibliotecas: a
que funciona mal nos dois lugares.

## Escolha de motor: NativeWind

Três candidatos maduros em 2026: NativeWind (Tailwind em RN), Tamagui
(sistema universal com compilador próprio) e Unistyles. O Tamagui é o mais
poderoso para quem *começa* um sistema universal — mas nós já temos um sistema,
e ele fala Tailwind.

**NativeWind ganha por uma razão estratégica**: o vocabulário é o mesmo.
`bg-accent`, `text-fg-muted`, `rounded-md`, `h-[var(--rc-control-md)]` — a
skill que ensina o agente a construir tela web vale quase inteira no nativo, e
o preset do Tailwind nativo sai **gerado dos mesmos tokens**. Um agente, uma
skill, duas plataformas.

## Arquitetura em três passos

### 1. Tokens viram fonte única (`@rivocode/tokens`)

Hoje a fonte é CSS (`palette.css`, `scales.css`, temas). Um script de codegen
extrai para JSON — os arquivos são regulares, o parser é pequeno — e passa a
gerar dos dois lados:

```
tokens.json ──► palette.css + temas (web, o que já existe, agora gerado)
            └─► tailwind preset RN + objeto TS (native)
```

O `check` atual (contraste, cores literais, temas documentados) roda sobre o
JSON e vale para as duas plataformas de uma vez.

### 2. Pacote `@rivocode/ui-native` no monorepo

- Expo-first (SDK atual), new architecture, NativeWind v4+.
- `RivoProvider` nativo: tema (claro/escuro/sistema), densidade, e o
  container de toast — mesmos nomes de prop do web.
- Testes com RN Testing Library; capturas via Expo para o design-sync.

### 3. Catálogo por tradução, não por porte

| Web | Native | Por quê |
|---|---|---|
| `Button`, `Badge`, `Card`, `Stat`, `EmptyState`, `Skeleton`, `Separator`, `Avatar` | mesmos nomes | traduzem direto |
| `Field` + `Input` + `Checkbox` + `Switch` + `Radio` | mesmos nomes | formulário é o coração do produto |
| `DataTable` | `DataList` | tabela não existe no celular; a lista com os quatro estados (carregando, erro, vazio, dados) é a mesma decisão |
| `Sheet` | `Sheet` (bottom sheet nativo) | já é o comportamento estreito do web |
| `Dialog`/`AlertDialog` | `Dialog` nativo | modal é modal |
| `Toast` | `Toast` | mesma API `useToast` |
| `Sidebar`, `Menubar`, `NavigationMenu`, `Tooltip`, `PreviewCard` | **não portam** | são idiomas de desktop; navegação nativa é tab bar e drawer do router |

## Fases

1. **Fase 0 — codegen de tokens** (a única mudança no repo web): extrai o
   JSON, regenera os CSS existentes byte a byte iguais, prova que a fonte
   única não muda nada.
2. **Fase 1 — fundação**: Provider, Button, Badge, Card, Skeleton,
   EmptyState, Stat. Uma tela de painel de verdade como demo.
3. **Fase 2 — formulário**: Field, Input, Checkbox, Switch, Select nativo.
4. **Fase 3 — overlay e lista**: Sheet, Dialog, Toast, DataList.
5. **Transversal**: a skill ganha `reference/native.md` com a tabela de
   tradução acima, e o design-sync fotografa as telas do Expo.

## O que decidir antes de começar

- Monorepo atual ganha `packages/` (native + tokens), ou repositório novo?
  Recomendo monorepo: o codegen de tokens amarra os ciclos de release.
- Expo puro ou bare RN? Recomendo Expo: o produto da RivoCode não tem módulo
  nativo custom hoje.
- Bottom sheet: `@gorhom/bottom-sheet` (padrão de mercado) ou Modal nativo?
  Decidir na spec da Fase 3, com protótipo.

## Fontes

- Comparativo 2026 NativeWind × Tamagui × Unistyles (React Native Journal /
  PkgPulse) e benchmark de estilo
  (react-native-style-libraries-benchmark): NativeWind para quem já fala
  Tailwind na web; Tamagui para quem começa universal do zero.
