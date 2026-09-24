---
category: Dados
---

# QRCode

Um texto que a câmera do outro lê: o link de consulta da nota, o Pix de uma
cobrança, o endereço de um cardápio.

O desenho é um SVG gerado aqui, sem biblioteca: o codificador segue a ISO/IEC
18004 inteira, com as versões 1 a 40, os modos numérico, alfanumérico e byte
(em UTF-8), a correção Reed-Solomon e a escolha entre as oito máscaras pela
penalidade da norma. A versão é a menor em que o texto cabe, então o quadrado
tem tantos módulos quanto o texto pede, e nenhum a mais.

```tsx
<QRCode value={linkDaNota} label="QR Code para consultar a nota 4813" />
```

`label` é obrigatório. A peça é uma imagem (`role="img"`), e o conteúdo cru
não serve de nome: um leitor de tela que soletra
`00020126580014br.gov.bcb.pix…` não diz nada. O nome diz para que o código
serve.

## Cores e margem

Os módulos são pintados com `fg` e o fundo com `surface` (o padrão, para dentro
de um `Card`) ou `bg` (solto na página), sem cor escrita à mão. O fundo inclui
a **margem de silêncio de 4 módulos** que a norma pede: é ela que separa o
código do que está em volta, e sem ela a câmera não acha as três quinas.

No tema escuro o código sai invertido, com módulos claros sobre fundo escuro.
A câmera do iOS e a do Android leem assim; leitor antigo pode não ler. Quando
o código vai ser lido por qualquer aplicativo, envolva a peça num
`RivoProvider scope="local" theme="rivocode-light"`.

## Correção de erro

`level` escolhe quanto do símbolo pode se perder sem que o texto se perca:
`L` recupera 7%, `M` 15% (o padrão), `Q` 25% e `H` 30%. Nível mais alto pede
mais módulos para o mesmo texto, e por isso quadrados maiores.

Use `Q` ou `H` para o que vai ser impresso, amassado ou lido de longe, e `M`
para a tela.

## Tamanho

`size` é o lado em px, com a margem incluída. Cada módulo precisa de ao menos
2px de tela para a câmera separar um do outro: o Pix de uma cobrança (versão 8
no nível M, 57 módulos com a margem) pede 160px ou mais. Um
texto longo com `size` pequeno desenha certo e não lê.

## Com logo

`logo` põe uma marca no centro, e **só vale com `level="H"`**. Os módulos
embaixo da marca são apagados de verdade (o fundo aparece por trás dela), e só
o nível H recupera essa perda com folga. Com `logo` e sem `level`, a peça já
nasce em H; com `logo` e outro nível, a marca não aparece, e o console diz por
quê.

```tsx
<QRCode value={linkDaNota} label="QR Code para consultar a nota 4813" logo={<img src="/marca.svg" alt="" />} />
```

Sem `value`, o quadrado guarda o lugar com o fundo e nenhum módulo, para a
tela não pular quando o texto chegar.

## Partes

`classNames` alcança `code` (o `svg`) e `logo` (a caixa do centro).

## Quando não usar

- **Para o Pix de uma cobrança**, use `PixCode`: ele junta este código, o copia
  e cola com o botão de copiar, o valor e o recebedor, e confere o CRC.
- **Para um texto que a pessoa precisa ler ou digitar**, como a chave de
  acesso que vai para o campo de outro sistema, use `Code` com um `Clipboard`
  ao lado. O QR só serve a quem tem uma câmera apontada para a tela.
- **Na tela de quem vai usar o texto.** Ninguém aponta a câmera para o próprio
  celular: se a pessoa já está no aparelho, o link é um `Link` e o código é um
  `Clipboard`.

## No React Native

Traduz, no caminho `@rivocode/ui-native/chart`: o código é desenhado com o `react-native-svg`, e a regra da casa é **um subcaminho por peer**, e não um por assunto. Desenhar com `View` custaria centenas de caixas por código, uma por trecho de módulos escuros, e o Pix de uma cobrança passa de dois mil módulos.

**O codificador é o mesmo dos dois lados, linha por linha**: ele mora em `src/shared/` e atravessa por espelho, então versão, máscara e correção de erro não divergem. O teste do nativo rasteriza o caminho que a peça desenha e o decodifica de volta, como o do web.

As cores saem do tema do `RivoProvider` (`fg` nos módulos, `surface` ou `bg` no fundo), e `level`, `size` e `logo` têm o mesmo contrato: com `logo` o nível nasce H, e com outro nível a marca não aparece. Não há `classNames`: veste só pela raiz, como toda peça daqui.

```tsx
import { QRCode } from '@rivocode/ui-native/chart'

<QRCode value={link} label="QR Code para consultar a nota 4813" />
```
