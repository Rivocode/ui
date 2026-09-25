---
category: Formulário
---

# SignaturePad

A área de assinatura na tela: o aceite de um contrato de locação, o recebimento
de uma entrega, o "de acordo" num laudo de vistoria. A pessoa assina com o
dedo, com a caneta ou com o mouse, e quem não consegue desenhar **digita o
nome**, que sai em letra cursiva.

```tsx
const [assinatura, setAssinatura] = useState<SignatureValue | null>(null)

<Field>
  <FieldLabel>Assinatura do locatário</FieldLabel>
  <SignaturePad value={assinatura} onValueChange={setAssinatura} />
</Field>
```

O desenho sai por Pointer Events, então o mesmo código atende dedo, caneta e
mouse. O traço é suave: os pontos são ligados por curvas, e a espessura varia
com a velocidade, fina quando a mão corre e cheia quando ela desacelera, como
tinta de verdade. Com caneta que mede pressão, a pressão entra na conta. O botão
direito do mouse não desenha, e um segundo dedo que encosta no meio do traço
(a palma da mão, quase sempre) é ignorado.

## O valor

`value` é `null` sem assinatura, ou um de dois formatos:

- `{ kind: 'drawn', strokes, width, height }`: os traços, cada um uma lista de
  pontos `{ x, y, time, pressure? }` em unidades de desenho. A área tem 600
  unidades de largura em qualquer tamanho de tela, então a assinatura feita no
  celular sai igual no monitor.
- `{ kind: 'typed', text, font, width, height }`: o nome digitado e a família
  da letra.

`onValueChange` é chamado **ao fim de cada traço**, e não a cada ponto, a cada
letra digitada, ao desfazer e ao limpar. Quando a área esvazia, chega `null`,
que é o que o schema do formulário lê como "sem assinatura". Sem `value`, a
peça guarda a assinatura sozinha a partir de `defaultValue`.

`ratio` é a largura sobre a altura da área, com padrão `3`. A altura sai daí, e
não de um número cravado: a área encolhe junto com a coluna.

## Desfazer, limpar, e o que o leitor de tela ouve

Embaixo do papel ficam **Desfazer o último traço** e **Limpar assinatura**, os
dois `IconButton` com a dica ao pousar, e o botão que troca de modo. Vazia, a
área mostra a linha de base e o "Assine aqui", e os dois botões ficam inativos.

A peça é um `group` com o nome do rótulo do `Field` (ou `aria-label`, ou
"Assinatura" sem nenhum dos dois), descrito pela instrução de como assinar. O
papel é uma imagem cujo nome diz o estado: "Nenhuma assinatura", "Assinatura
desenhada, 3 traços" ou "Assinatura digitada: Maria Souza". Desfazer e limpar
se anunciam num `status`, e limpar pelo teclado leva o foco para o botão de
modo, que continua vivo, em vez de largar o foco no corpo da página.

## Digitar em vez de desenhar

Desenhar pede mão firme e ponteiro fino, e muita gente não tem os dois: quem
usa só teclado, leitor de tela, acionador, ou tem tremor. **Digitar assinatura**
troca o papel pelo campo "Nome para a assinatura", e o nome aparece no papel em
letra cursiva. O valor vira `kind: 'typed'`, e sai exportado do mesmo jeito que
o desenho. Não há prop que desligue esse modo: a alternativa é a peça.

```tsx
<SignaturePad
  value={assinatura}
  onValueChange={setAssinatura}
  font='"Great Vibes", cursive'
/>
```

`font` é a família cursiva, em CSS. Carregue a fonte na página: sem ela, o
navegador cai na cursiva do sistema, e o PNG também. Trocar de modo guarda o
rascunho do outro: quem desenhou, foi digitar e voltou, encontra os traços.
Quando o pai zera o `value` por fora (um `reset` do formulário), os dois
rascunhos vão junto: o campo do nome esvazia e voltar a desenhar não traz traço
antigo. Limpar não troca de modo: quem limpou o nome continua no campo do nome.
`defaultMode="type"` abre no nome digitado, para a tela em que a maioria assina
pelo teclado.

## No formulário

Dentro de `Field`, o grupo pega o rótulo, a descrição e o erro; `disabled` e
`invalid` do `Field` chegam sozinhos. No React Hook Form, o `forValue` liga a
peça ao schema, e vazio é `null`:

```tsx
const schema = z.object({
  assinatura: z.custom<SignatureValue | null>().refine((valor) => valor !== null, {
    message: 'Assine para continuar',
  }),
})

<FormField name="assinatura" label="Assinatura do locatário">
  {(field) => <SignaturePad {...forValue(field)} />}
</FormField>
```

No formulário do HTML, `name` põe o **SVG** da assinatura num campo escondido,
vazio quando não há assinatura.

## Exportar

`signatureToSvg(valor)` devolve o SVG em texto, e `signatureToPng(valor)` a
imagem em `data:image/png`, desenhada num canvas com o dobro da resolução
(`scale`). Os dois devolvem `''` sem assinatura.

```tsx
const svg = signatureToSvg(assinatura)
const png = await signatureToPng(assinatura, { paper: true })
```

**A tinta é escura nos dois temas.** A assinatura feita no tema escuro não sai
clara no documento: a tinta, o papel e a guia são os `--rc-signature-*`, fixos
em `scales.css` como o par do código lido por máquina, e não papel de tema. O
`check:contrast` mede a tinta e o "Assine aqui" a 4,5:1 sobre o papel, a linha
de base a 3:1, e reprova a tinta mais clara que o papel. Sem `paper`, o fundo
sai transparente, para assentar sobre o documento; `paper: true` pinta o papel
branco, e `ink` troca a tinta de uma exportação só.

O nome digitado sai no SVG como texto com a `font-family`: quem abrir o arquivo
sem a fonte vê a cursiva do sistema. Para arquivo que precisa sair igual em
qualquer lugar, exporte o PNG.

## Estados

- **Desabilitada**: nem desenho nem botões, a borda vira `border-disabled` e a
  guia `signature-disabled`. A assinatura que já estava continua visível.
- **Só leitura** (`readOnly`): mostra a assinatura sem botões, sem desenho e
  sem o modo de digitar. É a forma de exibir a assinatura já colhida.
- **Inválida** (`invalid`, ou o `Field` inválido): borda `danger` e
  `aria-invalid`. A mensagem é do formulário.

## Partes

`classNames` alcança cada nó pelo nome: `pad` (o papel), `placeholder` (o
"Assine aqui"), `baseline` (a linha), `actions` (a fileira de botões) e `input`
(o campo do nome digitado). `className` veste a raiz.

## Textos

`labels` troca cada texto: `group`, `placeholder`, `instruction`, `undo`,
`clear`, `typeMode`, `drawMode`, `typedName`, `empty`, `undone`, `cleared`, e
as funções `drawn(traços)` e `typed(nome)`, que dizem o estado do papel ao
leitor de tela.

## Quando não usar

- **Aceite que não precisa de rubrica**, como "li e concordo com os termos", é
  `Checkbox`. A assinatura desenhada pesa mais na tela e na mão; peça só quando
  o documento pede o traço.
- **Assinatura que já existe em papel**, digitalizada, é `FileUpload`: a pessoa
  anexa a imagem, e não redesenha.
- **Só o nome, sem valor de assinatura**, como "quem recebeu", é `Input`.
- **Assinatura digital com validade jurídica**, com certificado ICP-Brasil, não
  é esta peça: o traço na tela é evidência de aceite, e não assinatura
  qualificada. O certificado é do serviço que assina o documento.

## No React Native

Traduz, no caminho `@rivocode/ui-native/chart`: o papel é desenhado com o `react-native-svg`, que já é o peer desse caminho, e a regra da casa é **um subcaminho por peer**, e não um por assunto. Quem só usa um `Button` não passa a precisar do SVG por causa da assinatura.

**O traço é o mesmo dos dois lados, linha por linha.** A suavização por curvas, a espessura que varia com a velocidade e com a pressão, o nome digitado em cursiva e o SVG exportado moram em `src/shared/` e atravessam por espelho: a assinatura feita no celular abre igual no web, com o mesmo `value`. O gesto é o `PanResponder` do core, que não cede o toque para a rolagem no meio do traço; `onDrawingChange` avisa quando o dedo começa e termina, para a `ScrollView` em volta desligar o `scrollEnabled`. A força do toque, quando o aparelho a mede, entra como pressão.

**Exporta só o SVG.** `signatureToSvg` sai daqui com a tinta do token, escura nos dois temas; o PNG não porta, porque o React Native não tem canvas. Quem precisa de imagem rasteriza o SVG no servidor, ou captura a área com uma biblioteca de captura de tela. O `value` é controlado, não há `name` (formulário escondido não existe no celular), e o modo de digitar o nome continua lá: a cursiva padrão é a Snell Roundhand no iOS e a `cursive` no Android.

```tsx
import { SignaturePad } from '@rivocode/ui-native/chart'

<SignaturePad
  value={assinatura}
  onValueChange={setAssinatura}
  onDrawingChange={(desenhando) => setRolagem(!desenhando)}
/>
```
