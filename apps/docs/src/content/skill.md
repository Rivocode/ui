Se você programa com um agente ao lado, Claude Code, Cursor, ou qualquer um que
leia skills, dá para ensiná-lo a biblioteca inteira de uma vez.

## Instalar

A skill é uma pasta: um `SKILL.md` que o agente lê sempre, e arquivos em
`reference/` que ele abre só quando o trabalho pede. Layout, decisões de design,
formulário, gráfico e tema ficam separados justamente para não ocupar contexto
enquanto não são o assunto.

O caminho que funciona em qualquer lugar, sem gerenciador de pacote e sem ter a
biblioteca instalada:

```bash
dir=$HOME/.claude/skills/rivocode-ui && mkdir -p "$dir/reference" && \
  curl -fsSL https://ds.rivocode.com.br/skill/SKILL.md -o "$dir/SKILL.md" && \
  for f in layout design components forms charts theming; do \
    curl -fsSL "https://ds.rivocode.com.br/skill/reference/$f.md" \
      -o "$dir/reference/$f.md"; \
  done
```

Trocando `~/.claude` por `.claude` ela entra só no projeto, e a equipe recebe
junto pelo Git.

São sete arquivos, então o comando do pacote abaixo costuma sair mais fácil.

### Pelo comando do pacote

Se o `@rivocode/ui` já está no projeto, o comando dele copia a skill **da versão
instalada**. Um projeto preso no `0.2.0` recebe a skill do `0.2.0`, e não a do
site, que fala de peças que ele ainda não tem.

```bash
npx rivocode-ui skill        # npm
pnpm exec rivocode-ui skill  # pnpm
yarn rivocode-ui skill       # yarn
bunx rivocode-ui skill       # bun
```

Acrescente `--global` para instalar em `~/.claude` em vez do projeto.

### Sem instalar nada

```bash
bunx @rivocode/ui skill
pnpm dlx @rivocode/ui skill
npx -y @rivocode/ui skill
```

O `yarn` clássico não tem `dlx`. Nele, instale o pacote e use a forma de cima.

<details>
<summary>Se o npm reclamar de conflito de dependência</summary>

Até a versão `0.3.0`, o par `zod` era declarado como `^4`, e o
`@hookform/resolvers` arrasta pacotes que pedem zod 3. Para rodar um comando o
npm instala tudo num diretório temporário, inclusive os pares opcionais, e o
conflito aparecia ali. Nessas versões, acrescente `--legacy-peer-deps`.

A faixa foi alargada e o conflito deixou de existir.

</details>

## O que ela ensina

O contrato da biblioteca, inteiro e sem depender de rede: o Provider, o
vocabulário de classes, a diferença entre preencher e escrever texto, e a altura
que vem da densidade.

Uma tabela de escolha para os erros que mais aparecem, `Alert` contra `Toast`,
`Dialog` contra `AlertDialog`, `Select` contra `Combobox`, `Meter` contra
`Progress`. Cada linha diz o porquê, que é o que evita a próxima dúvida.

Os quatro finais de uma consulta, os dois subcaminhos com exemplo que roda, e a
lista do que nunca fazer: cor literal, `z-index` numérico, altura cravada,
portal montado à mão.

E os endereços da documentação crua, para ele buscar a peça que faltar.

## Por que uma skill, e não só o prompt

Colar o contrato no prompt funciona uma vez. Na segunda conversa ele não está
lá, e o agente volta a adivinhar a API pelo nome, com confiança, que é pior do
que errar em silêncio.

A skill fica instalada. E como ela é um arquivo só, buscado por HTTP, atualizar
é rodar o mesmo comando de novo.

## Ler sem instalar

O arquivo é markdown cru, em
[/skill/SKILL.md](https://ds.rivocode.com.br/skill/SKILL.md). Vale a leitura
mesmo para quem escreve à mão: é o resumo mais curto de como esta biblioteca
espera ser usada.
