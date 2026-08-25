# Construir tela nativa com o ui-native

O React Native fala o **mesmo vocabulário** do web — `bg-bg`, `text-fg-muted`,
`rounded-pill` — via NativeWind, sobre um `theme.css` gerado dos mesmos tokens
(`bun run gen:native` na raiz). Nenhum componente conhece a cor da marca aqui
também.

Os componentes vivem em `native/src` e o app de exemplo em `examples/native`
(`bunx expo start --ios`). O CSS do app é pré-compilado:
`node scripts/build-css.mjs` dentro do app — mudou classe nova, rode de novo.

## Catálogo por tradução, não por porte

| Web | Native | O que muda |
|---|---|---|
| `Button`, `Badge`, `Card`, `Stat`, `EmptyState`, `Skeleton`, `Avatar`, `Separator`, `Spinner`, `Progress`, `Alert` | mesmos nomes | traduzem direto |
| `Field` + `Input`, `Checkbox`, `Switch` | mesmos nomes | o Input acende a borda no foco (não há focus-visible em tela de toque); o rótulo de Checkbox/Switch já é clicável |
| `DataTable` | `DataList` | tabela não existe no celular; os quatro finais da consulta (carregando, erro, vazio, dados) e a ordem deles são os mesmos |
| `Sheet` | `Sheet` | só o comportamento de baixo, que já era o modo estreito do web |
| `Dialog` / `AlertDialog` | mesmos nomes | o AlertDialog não fecha no toque fora, como no web |
| `Select` | `Select` | poucas opções fixas; a lista abre numa folha de baixo, o idioma da plataforma |
| `TabList variant="segmented"` | `Tabs` | só a caixinha; seção de página é do router nativo |
| `useToast` | `useToast` | o RivoProvider monta a fiação, igual |
| `RadioGroup`, `CheckboxGroup`, `Textarea`, `Fieldset`, `SearchInput`, `MaskedInput`, `Toggle`, `ToggleGroup`, `Accordion`, `Collapsible`, `PageHeader`, `DescriptionList`, `AspectRatio`, `Slider` | mesmos nomes | traduzem direto; o Slider anda por gesto e responde às ações do leitor de tela |
| `NumberField` | `NumberField` | vira stepper (menos, valor, mais) — o idioma do toque |
| `OTPField` | `OTPField` | caixas visíveis, um campo escondido: teclado, autofill de SMS e leitor veem um só |
| `Combobox`, `Autocomplete` | `Combobox` | a lista longa abre numa folha com busca sem acento |
| `DatePicker`, `Calendar` | mesmos nomes | mês desenhado à mão, valor ISO `aaaa-mm-dd`, exibição `dd/mm/aaaa` |
| `Menu` | `Menu` | ações numa folha de baixo (action sheet), nunca popup ancorado |
| `Sidebar`, `Menubar`, `NavigationMenu`, `Tooltip` | **não portam** | são idiomas de desktop; navegação nativa é tab bar e drawer do router |
| `FileUpload` | **ainda não** | precisa do expo-document-picker; entra quando houver app dono da dependência |

## O que nunca fazer no native

- Classe com var arbitrária (`h-[--rc-control-md]`) ou `translate-*`: o
  compilador do react-native-css atual não tolera var viva nem a shorthand
  `translate` — altura de controle é fixa por tamanho até o fix upstream.
- Remover o `browserslist` moderno do `package.json` do app: sem ele, o passe
  web do Expo reescreve o `light-dark()` dos tokens num polyfill de vars que
  mata a compilação. É ele que sustenta a troca de tema em runtime — o
  `RivoProvider` aceita `rivocode-dark`, `rivocode-light` e `system`, e trocar
  a prop troca a tela inteira via `Appearance.setColorScheme()`.
- Densidade compacta: não porta de propósito. Alvo de toque não encolhe em
  tela de dedo; `density` existe na API por paridade, mas `comfortable` é a
  única altura.
- Glyph de texto como ícone de estado (o visto do Checkbox é borda
  rotacionada, porque fonte muda de corpo entre iOS e Android).
- Esquecer `accessibilityRole`/`accessibilityState` em controle custom.
- `text-center` como classe em `TextInput`: esse estilo vira prop no runtime
  e a aplicação quebra — use a prop `textAlign`. O mesmo vale para atalhos
  lógicos (`border-x` gera `border-inline`, que não existe lá): escreva
  `border-l border-r`.
- A utility de divisória do Tailwind (a de bordas entre filhos): o seletor de
  filho não existe no RN. O `DescriptionList` interpõe bordas via `Children`.
- Escrever nome de classe em comentário: o scanner do Tailwind lê fonte crua
  e gera a classe — foi assim que uma palavra num comentário derrubou o build.
