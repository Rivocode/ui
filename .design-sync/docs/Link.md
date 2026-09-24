---
category: Tipografia
---

# Link

A âncora da casa: sublinhada, com anel de foco visível, nos tons de texto do
tema.

```tsx
<Link href="/notas">Ver notas</Link>
```

O sublinhado vem ligado. No meio de uma frase a cor sozinha não basta para
separar o link do texto em volta, e quem não distingue a cor fica sem saber
onde clicar. `underline="hover"` só sublinha ao passar, e só vale fora do
texto corrido: numa lista de links do rodapé ou da navegação, onde a posição
já diz que aquilo é link.

`tone` escolhe a cor: `accent` é o link solto na página, `neutral` e `muted`
servem à lista de links, e `inherit` pega a cor da frase. Use `inherit`
dentro de um `Alert` ou de qualquer fundo de estado, onde a cor do tom já foi
medida contra aquele fundo e o acento não foi.

## Para fora do site

`external` abre em outra aba com `rel="noopener noreferrer"`, desenha a seta
de saída e diz "(abre em nova aba)" ao leitor de tela, depois do texto do
link. Quem enxerga vê a seta; quem ouve, a frase. O `externalLabel` troca a
frase, e o `rel` que você passar é mantido, somado aos dois de segurança.

```tsx
<Link href="https://www.gov.br/nfse" external>
  Portal da NFS-e
</Link>
```

## Com o link do router

O `render` troca a âncora pelo link do seu router, e o desenho continua o
daqui. O `href`, a navegação e o pré-carregamento passam a ser do router.

```tsx
import { Link } from '@rivocode/ui'
import { NavLink } from 'react-router'

<Link render={<NavLink to="/clientes" />}>Ver todos os clientes</Link>
```

Quase todo router também exporta um `Link`, e os dois nomes não cabem no
mesmo arquivo. Renomeie um deles na importação
(`import { Link as RouterLink } from 'react-router'`), ou use o `NavLink`,
como acima.

## Quando não usar

- **Ação que muda alguma coisa:** `Button`. Link navega, botão age: salvar,
  excluir, abrir um diálogo e enviar um formulário são ações, e um link que
  faz isso não responde à barra de espaço, não abre em outra aba e mente para
  quem ouve a tela.
- **Navegação que precisa parecer botão**, como o "Nova nota" do topo da
  página: `Button` com `render={<a href="…" />}`. A tag continua sendo de
  link, e o desenho é o do botão.
- **Item de menu que leva a outra página:** `MenuLinkItem`, que anda pelas
  setas junto com os outros itens do menu.

## No React Native

Traduz, como um `Text` com `accessibilityRole="link"`, e por isso vai dentro da frase como no web: `<Text>Veja o <Link href="…">espelho</Link>.</Text>` quebra linha junto com o texto em volta. `tone` tem os mesmos quatro valores, e o sublinhado é fixo.

**Quem navega é o `onPress`, e não um `render`.** Não há âncora no React Native para trocar pela do router, então a composição do web vira callback: `onPress={() => router.push("/notas")}`. Sem `onPress`, o toque abre o `href` pelo `Linking`, que é o caminho para `https:`, `mailto:` e `tel:`.

**`external` desenha a seta e avisa pela dica**, a `accessibilityHint`, que o leitor de tela lê depois do nome; o texto é o `externalLabel`, e o padrão é “Abre fora do app.”. Quando o filho é texto puro, o nome acessível é ele, sem a seta. Não há `underline`: no toque não existe passar por cima, e o sublinhado é sempre o do texto corrido.
