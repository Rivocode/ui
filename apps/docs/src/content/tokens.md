Os tokens da biblioteca moram em CSS, e é assim que as peças os leem. Quem
desenha não lê CSS: lê variável do Figma, ou um conjunto do Tokens Studio. Esta
página é a ponte. As três camadas saem no formato do
[W3C Design Tokens Community Group](https://www.designtokens.org/tr/2025.10/),
na especificação estável 2025.10, que as duas ferramentas leem sem plugin de
conversão no meio.

## O que sai

Um arquivo por camada, um por densidade e um por tema, mais o resolver que diz
como juntá-los:

| Arquivo | O que carrega |
|---|---|
| `palette.tokens.json` | A camada 1: a paleta crua, `palette.lima.500`, `palette.graphite.950` |
| `scales.tokens.json` | Tipografia, altura de linha, empilhamento, foco, raio, espaçamento de letra e movimento |
| `density-comfortable.tokens.json` | Altura de controle e respiro na densidade confortável |
| `density-compact.tokens.json` | Os mesmos tokens, na compacta |
| `rivocode-dark.tokens.json` | A camada 3 do tema escuro: os papéis que as peças pintam |
| `rivocode-light.tokens.json` | O mesmo, no claro |
| `rivocode.resolver.json` | O resolver do DTCG: base, densidade e tema, nessa ordem |

**O papel continua apontando para a paleta.** No CSS, `--rc-accent` é
`var(--rc-p-lima-500)`; no JSON, `color.accent` é `{palette.lima.500}`. Trocar a
lima na paleta muda o acento no tema, no Figma como no código. O papel que tem
alfa próprio, como `color.accent-subtle`, sai com a cor inteira, porque o
formato não tem alias com transparência.

Todo token carrega de onde veio, em `$extensions`:

```json
"accent": {
  "$type": "color",
  "$value": "{palette.lima.500}",
  "$extensions": { "br.com.rivocode": { "css": "--rc-accent" } }
}
```

É o que liga a variável que o designer escolheu à classe que o código escreve:
`color.accent` é `--rc-accent`, que é `bg-accent`.

## Onde pegar

Do site, sem instalar nada:

```bash
for arquivo in palette scales density-comfortable density-compact rivocode-dark rivocode-light; do
  curl -sO "https://ds.rivocode.com.br/tokens/$arquivo.tokens.json"
done
curl -sO https://ds.rivocode.com.br/tokens/rivocode.resolver.json
```

Do pacote, na versão que o projeto instalou:

```bash
ls node_modules/@rivocode/ui/dist/tokens
```

Ou pelo comando, que escreve os mesmos arquivos numa pasta sua:

```bash
npx rivocode-ui tokens --out tokens
```

## O tema do seu cliente

O comando lê o CSS do tema do mesmo jeito que o `check-theme`, e exporta o seu
tema no lugar dos da casa:

```bash
npx rivocode-ui tokens tema-acme.css --out tokens
```

Saem `acme-light.tokens.json` e `acme-dark.tokens.json`, um por seletor
`[data-rc-theme="..."]` do arquivo, com a paleta, a escala e as densidades da
casa ao lado. O papel que o seu tema aponta para a paleta da casa vira alias; o
que você escreveu com cor própria, em hexadecimal, `rgb()` ou `oklch()`, sai
convertido para sRGB, com o `hex` junto. Um arquivo sem nenhum seletor de tema é
recusado: exportar a casa no lugar do seu tema seria verde sobre nada.

## Tokens Studio

1. Em **Settings**, escolha o formato **W3C DTCG**.
2. Carregue a pasta inteira. Cada arquivo vira um conjunto.
3. Ligue sempre `palette` e `scales`, uma densidade e um tema. Sem a paleta
   ligada, todo alias do tema fica sem destino.
4. Em **Themes**, crie um tema por combinação: escuro confortável, claro
   compacto. O `rivocode.resolver.json` já descreve essas combinações, para a
   ferramenta que lê o resolver.

## Figma

A importação de variáveis do Figma lê o mesmo JSON:

1. Crie a coleção **Paleta** e importe `palette.tokens.json`. Ela vem primeiro,
   porque é para ela que o tema aponta.
2. Crie a coleção **Tema** e importe `rivocode-dark.tokens.json` e
   `rivocode-light.tokens.json`, um em cada modo.
3. Crie a coleção **Densidade** do mesmo jeito, com os dois arquivos de
   densidade como modos.
4. Importe `scales.tokens.json` numa coleção de um modo só.

O Figma só tem variável de cor, número, texto e booleano. Cor, medida e número
viram variável; sombra, curva e duração não têm tipo de variável lá, e são o
que o Tokens Studio transforma em estilo.

## O que não cabe no formato

O comando lista, ao terminar, o que ficou de fora e por quê. Nos temas da casa
são três ganchos que existem vazios de propósito, `--rc-accent-image`,
`--rc-accent-shadow` e `--rc-overlay-filter`: valem `none` até um tema de cliente
usá-los, e `none` não tem tipo no DTCG. Quando o seu tema der uma sombra ao
`--rc-accent-shadow`, ela sai como sombra.

Dois tokens saem aproximados, com o valor do CSS guardado em `$extensions`:

- **O espaçamento de letra** (`tracking.display`, `tracking.tight`) é `em` no
  CSS, e o formato só aceita `px` e `rem` em medida. Sai como número, que
  multiplica o tamanho da fonte.
- **O título fluido** (`text.display`, `text.hero`) é um `clamp()` que cresce
  com a tela. Sai com o tamanho máximo, que é o da tela larga que se desenha.

## Quando não usar

O JSON é para a ferramenta de design. **O código continua lendo o CSS**: o
`preset.css` é a fonte, e o JSON é gerado dele a cada versão. Não monte tema a
partir do JSON para o navegador; escreva o CSS do tema, como ensina
[Temas e personalização](/temas), e exporte daqui para o Figma.
