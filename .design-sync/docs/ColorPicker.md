---
category: Formulário
---

# ColorPicker

Escolha de uma cor: a de marca de um cliente, num construtor de tema.

São duas entradas para a mesma decisão. A **grade de amostras** é para escolher
olhando, e responde à seta como um grupo de radio — porque é o que ela é: uma
escolha entre opções, e não um punhado de botões. O **campo de texto** é para
quem já tem o valor no manual da marca e quer colar.

```tsx
const [brand, setBrand] = useState('#d4f34a')

<ColorPicker
  label="Cor da marca"
  value={brand}
  onValueChange={setBrand}
  swatches={['#d4f34a', '#3ddc97', '#6aa9ff', '#ff6b6b', '#b78cff']}
/>
```

O valor entra e sai sempre no mesmo formato: hexadecimal de seis dígitos,
minúsculo, com cerquilha. O que a pessoa **digita ou cola** pode ser bem mais
solto — `#0f8`, `BFDD3A`, com espaço em volta —, e o `onValueChange` recebe
`#00ff88` e `#bfdd3a`. Texto que ainda não é cor não avisa ninguém: o campo
guarda o rascunho enquanto ela escreve e volta ao último valor bom quando ela
sai sem terminar.

Sem `value`, a peça guarda a própria escolha a partir de `defaultValue`.

## As amostras

`swatches` aceita o valor solto ou o valor com nome:

```tsx
<ColorPicker
  label="Cor da marca"
  value={brand}
  onValueChange={setBrand}
  columns={4}
  swatches={[
    { value: '#d4f34a', label: 'Lima' },
    { value: '#3ddc97', label: 'Teal' },
    { value: '#f2b21c', label: 'Âmbar' },
    { value: '#6aa9ff', label: 'Azul' },
  ]}
/>
```

**Dê o nome sempre que ele existir.** Uma sequência de seis caracteres lida
letra a letra não diz nada a quem ouve a tela; "Lima" diz. Sem nome, a amostra
se anuncia como `Cor #d4f34a` — o valor está lá, e é o mínimo.

Sem `swatches`, a grade traz um leque de tons gerado — dez matizes em três
claridades. Ele serve para experimentar, e **não** para representar uma marca:
um construtor de tema entrega aqui a paleta do cliente. A biblioteca não podia
trazer a dela: cor literal dentro de um componente amarra o white-label a uma
marca, e é por isso que a paleta da casa vive em `src/tokens` e o leque daqui é
calculado.

`columns` é ao mesmo tempo o desenho da grade e o passo das setas para cima e
para baixo — por isso é prop, e não uma classe de fora.

## Acessibilidade

É o que separa esta peça de um `<input type="color">` embrulhado:

- A grade é um `radiogroup`, e cada amostra um `radio`. **Uma** amostra entra na
  ordem de tabulação; a seta anda dentro da grade, `Home` e `End` vão às pontas.
  Sem isso, trinta amostras viram trinta paradas de Tab.
- O escolhido é **dito**, e não só pintado: `aria-checked`. Quem enxerga vê um
  anel por fora da amostra — por fora, e não uma marca por dentro, porque
  símbolo desenhado sobre a cor fica ilegível em metade dos valores possíveis, e
  não existe token que garanta contraste contra um valor que a pessoa inventou.
- O campo de texto tem nome próprio (`Código hexadecimal da cor`), então ele se
  anuncia sozinho mesmo fora de um `Field`.

## Partes

`classNames` veste cada parte: `label`, `swatches`, `swatch`, `field`,
`preview`, `input`.

## Quando não usar

**Para o seletor de cor completo, use o `<input type="color">` do navegador.**
Esta peça não tem roda de matiz, mapa de saturação, canal de transparência nem
conta-gotas — e nada disso está na fila. O input nativo abre o diálogo do
sistema operacional, que já traz o espectro inteiro, o conta-gotas da própria
máquina, e o teclado e o leitor de tela acertados sem uma linha nossa. O que ele
não faz — mostrar a paleta que a casa sugere, dizer qual tom está escolhido,
aceitar um valor colado do manual da marca — é exatamente o que esta peça faz.
Os dois convivem bem lado a lado: a grade para o comum, o nativo para o resto.

**Para escolher entre poucas opções fixas e nomeadas, use o `RadioGroup`.** Se a
tela oferece três temas prontos — "Lima", "Grafite", "Papel" — a decisão é sobre
o tema e não sobre a cor, e uma lista de rótulos com uma bolinha colorida ao
lado diz isso melhor que uma grade de tons anônimos.

**Para um valor numa faixa contínua**, o `Slider`. Opacidade e raio de canto são
faixa, não cor.

## No React Native

Ainda não portado, e o que falta é trabalho e não decisão: a grade de amostras é uma lista de `Pressable` com `accessibilityRole="radio"`, e o campo hexadecimal é um `Input` com `autoCapitalize="none"`. Até lá, um `Sheet` com a paleta do cliente em botões resolve o caso comum — escolher entre os tons que a marca já tem.
