---
category: Dados
---

# PixCode

A cobrança por Pix inteira num cartão: o QR Code, o valor em destaque, o nome
de quem recebe e o copia e cola com o botão de copiar.

Ela recebe o **copia e cola pronto**, como o PSP devolve na cobrança dinâmica
ou como o `buildPixPayload` monta na estática, e confere o CRC antes de
desenhar. Código com o dígito errado não vira QR: vira aviso, porque um QR que
o banco recusa é pior do que nenhum.

```tsx
<PixCode payload={cobranca.pixCopiaECola} />
```

O valor e o nome saem do próprio código (campos 54 e 59). `amount` e `receiver`
vencem os dois: use-os quando a tela sabe mais do que o código diz. O nome
gravado no código é ASCII, sem acento (o `buildPixPayload` tira), então a
"Clínica São Lucas" aparece como "Clinica Sao Lucas"; passe o nome com acento
em `receiver` para a tela e o leitor de tela dizerem certo.

O copia e cola é aparado antes de tudo: espaço e quebra de linha que vieram
colados da resposta do PSP não entram no QR nem no que o botão copia. No QR
dinâmico o valor gravado no código **não aparece**, porque o manual do Banco
Central manda o pagador ignorá-lo e ler o da cobrança; ali o valor entra só por
`amount`.

O QR sai **escuro sobre claro em qualquer tema**, numa placa branca de canto
arredondado dentro do cartão. No tema escuro o cartão fica escuro e a placa
não: módulo claro sobre fundo escuro é um código que parte dos apps de banco
não lê, e um Pix que o banco não lê é um pagamento que não acontece. Não
envolva a peça num `RivoProvider` claro para isso; a regra é da peça, e vale
também para tema de cliente. O porquê está em `QRCode`.

O copiar é o `Clipboard` da casa, com a confirmação que troca o nome do botão.
No celular do pagador o copia e cola é o caminho principal, e não o reserva:
ninguém aponta a câmera para a própria tela.

## Montar o código

`buildPixPayload` monta o BR Code estático do Pix pelo Manual de Padrões para
Iniciação do Pix do BCB: o GUI `br.gov.bcb.pix` com a chave e o texto livre no
campo 26, moeda 986, país BR, nome e cidade, o txid no 62/05 (ou `***`, como o
manual manda quando não há) e o CRC16-CCITT no 63.

```tsx
const payload = buildPixPayload({
  key: '+5583988112233',
  name: 'Clínica São Lucas',
  city: 'João Pessoa',
  amount: 1284.5,
  txid: 'NF4813',
})
```

O acento sai do nome, da cidade e do texto livre, e a letra fica: "Jørgen
Ångström" vira "Jorgen Angstrom". O código sai inteiro em ASCII, porque o
tamanho de cada campo e o CRC são contados em caractere e o QR grava byte, e
banco nenhum garante o resto.

A chave é gravada como o DICT a guarda: CPF e CNPJ perdem a pontuação,
celular digitado com máscara ganha o `+55`, e-mail e chave aleatória descem
para minúsculas. Chave que depois disso não passa no `isValidPixKey` é recusada
com `RangeError`, porque um código com chave que o DICT não acha é cobrança que
não paga. O valor é arredondado ao centavo antes de conferir: `0.004` é
recusado, e `1.005` grava `1.01`. O que passa dos
limites do manual e do EMV (chave até 77, nome até 25, cidade até 15, txid até
25 letras e dígitos, chave mais texto livre até 99) é recusado com
`RangeError`, e não cortado: nome cortado em silêncio é cobrança que ninguém
reconhece.

`parsePixPayload` faz o caminho de volta e devolve `null` quando o CRC não
confere ou o código não é Pix. Ele lê o estático, o dinâmico (`url` no lugar da
chave, e `unique` quando o código só vale um pagamento) e o composto
(`recurrence`).

`isValidPixKey` confere a chave como o DICT a guarda: CPF e CNPJ (inclusive o
alfanumérico) sem pontuação e com o dígito verificador certo, e-mail em
minúsculas, celular com `+55` e a chave aleatória com os hifens. Tire a máscara
do campo antes de conferir. O `parsePixPayload` recusa o código cujo campo 54
não é valor em reais maior que zero, com até duas casas: `-5`, `1e3` e `0x10`
não passam.

## Estados

`loading` põe marca de lugar no QR e no texto, com `aria-busy`, e o copiar
fica desligado. `expired` troca o QR por um aviso e tira o copiar: código
vencido não se oferece para pagar. Com `onRenew`, o aviso ganha o botão de
gerar outro.

Os dois chegam ao leitor de tela por uma região viva que a peça monta sempre,
e que só troca de texto: "Gerando o código Pix…" enquanto carrega, "Código Pix
pronto." quando termina, e o aviso de expirado quando vence. Região que nasce
junto com o texto não é anunciada, e `aria-busy` sozinho não é lido por
ninguém.

## Partes

`classNames` alcança `code` (o QR, a marca de lugar ou o aviso de expirado),
`amount`, `receiver`, `payload` (o texto do copia e cola) e `copy` (o botão).
`labels` troca os textos, e o tipo sai como `PixCodeLabels`: `copy`, `copied`,
`payload`, `expired`, `renew`, `invalid`, `loading` e `ready`, mais duas
funções - `receiver(nome)`, a linha "para Fulano", e `code(valor, nome)`, o
nome do QR para o leitor de tela.

```tsx
<PixCode
  payload={payload}
  labels={{ receiver: (name) => `to ${name}`, code: (amount, name) => `Pix QR ${amount} ${name}` }}
/>
```

## Quando não usar

- **Para um QR Code que não é Pix**, como o link de consulta da nota, use
  `QRCode`: ele desenha o código sem conferir CRC nem mostrar valor.
- **Para a chave Pix solta**, que a pessoa digita no próprio banco, use `Code`
  com um `Clipboard` ao lado. A chave não é o copia e cola, e um QR dela não
  leva valor nem txid.

## No React Native

Traduz, no caminho `@rivocode/ui-native/chart`, porque o QR é o `QRCode` nativo, desenhado com o `react-native-svg`. As funções puras (`buildPixPayload`, `parsePixPayload` e `isValidPixKey`) saem da raiz: não pedem peer nenhum, e o arquivo é o mesmo do web, pelo espelho do código compartilhado. O valor sai formatado sem `Intl`, igual nos dois lados.

**O copiar entra por `renderCopy`.** O `Clipboard` nativo mora em `@rivocode/ui-native/clipboard` por causa do `expo-clipboard`, e a regra da casa é **um subcaminho por peer**: se a peça o importasse, quem desenha um QR teria de instalar o módulo de área de transferência. A função recebe o copia e cola e só é chamada quando há o que copiar (nem carregando, nem expirado, nem com o CRC errado), então o botão some junto com o código. O texto é `selectable` de todo jeito, e o toque longo copia mesmo sem o botão.

```tsx
import { PixCode } from '@rivocode/ui-native/chart'
import { Clipboard } from '@rivocode/ui-native/clipboard'

<PixCode
  payload={cobranca.pixCopiaECola}
  renderCopy={(payload) => <Clipboard value={payload}>Copiar código</Clipboard>}
/>
```

As partes vestem pelo mesmo `classNames` do web: `code`, `amount`, `receiver` e `payload`. `copy` não porta: o botão é o que o `renderCopy` devolve, e quem o escreve já o veste.
