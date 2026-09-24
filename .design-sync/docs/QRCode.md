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

**Código lido por máquina é sempre escuro sobre claro, em qualquer tema.** Os
módulos saem em `code-ink` (quase preto) e o fundo em `code-paper` (branco), e
os dois têm o mesmo valor no tema claro, no escuro e em qualquer tema de
cliente. A ISO/IEC 18004 aceita o reflexo invertido, com módulo claro sobre
fundo escuro, e a câmera do sistema até lê; uma parte dos leitores e dos apps
de banco não lê. Para um Pix, isso é pagamento que não acontece, e nada na
tela avisa.

Por isso o par não é papel de tema: ele mora na escala, fora de
`[data-rc-theme]`, e um tema não precisa declará-lo nem consegue invertê-lo
sem querer. A guarda de contraste mede a tinta sobre o papel a 15:1 no
mínimo (a casa dá 19,47:1) e confere que a tinta é a mais escura dos dois.
Não envolva a peça num `RivoProvider` claro para o código ler: ela já lê.

No tema escuro o papel vira uma **placa branca de canto arredondado** dentro
do cartão escuro. A placa inclui a **margem de silêncio de 4 módulos** que a
norma pede: é ela que separa o código do que está em volta, e sem ela a câmera
não acha as três quinas. Por isso a placa não tem respiro próprio, e não deve
ganhar `padding` de fora.

As mesmas cores servem a quem desenha outro código lido por máquina, como um
código de barras: `fill-code-ink`, `bg-code-paper` e `text-code-ink`.

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
embaixo da marca são apagados de verdade (o papel aparece por trás dela, e a
marca herda a tinta como `currentColor`), e só
o nível H recupera essa perda com folga. Com `logo` e sem `level`, a peça já
nasce em H; com `logo` e outro nível, a marca não aparece, e o console diz por
quê.

```tsx
<QRCode value={linkDaNota} label="QR Code para consultar a nota 4813" logo={<img src="/marca.svg" alt="" />} />
```

Sem `value`, o quadrado guarda o lugar com o papel e nenhum módulo, para a
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

As cores **não** saem do tema: os módulos são `tokens.code["code-ink"]` e o papel `tokens.code["code-paper"]`, escuro sobre claro nos dois esquemas, numa placa de canto arredondado. Não passam pelo CSS do app nem pelo `colors` do `RivoProvider`, então nenhum `@theme` de cliente inverte o código sem querer. `level`, `size` e `logo` têm o mesmo contrato do web: com `logo` o nível nasce H, e com outro nível a marca não aparece. Não há `classNames`: veste só pela raiz, como toda peça daqui.

```tsx
import { QRCode } from '@rivocode/ui-native/chart'

<QRCode value={link} label="QR Code para consultar a nota 4813" />
```
