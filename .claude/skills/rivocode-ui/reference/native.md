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
| `Sidebar`, `Menubar`, `NavigationMenu`, `Tooltip` | **não portam** | são idiomas de desktop; navegação nativa é tab bar e drawer do router |

## O que nunca fazer no native

- Classe com var arbitrária (`h-[--rc-control-md]`) ou `translate-*`: o
  compilador do react-native-css atual não tolera var viva nem a shorthand
  `translate` — altura de controle é fixa por tamanho até o fix upstream.
- Trocar tema/densidade em runtime: ainda não funciona pela mesma razão; o
  tema entra no `RivoProvider` uma vez, por build. A API já é a final.
- Glyph de texto como ícone de estado (o visto do Checkbox é borda
  rotacionada, porque fonte muda de corpo entre iOS e Android).
- Esquecer `accessibilityRole`/`accessibilityState` em controle custom.
