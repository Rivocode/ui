Se você programa com um agente ao lado, Claude Code, Cursor, ou qualquer um que
leia skills, dá para ensiná-lo a biblioteca inteira de uma vez.

## Instalar

O caminho que funciona em qualquer lugar, sem gerenciador de pacote e sem ter a
biblioteca instalada:

```bash
mkdir -p ~/.claude/skills/rivocode-ui && \
  curl -fsSL https://ds.rivocode.com.br/skill/SKILL.md \
  -o ~/.claude/skills/rivocode-ui/SKILL.md
```

Trocando `~/.claude` por `.claude` ela entra só no projeto, e a equipe recebe
junto pelo Git.

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
npx -y --legacy-peer-deps @rivocode/ui skill
```

O `--legacy-peer-deps` do npm não é enfeite: para rodar um comando ele instala o
pacote num diretório temporário **com as dependências de par opcionais junto**, e
a árvore do `@hookform/resolvers` entra em conflito ali. O `bunx` e o `pnpm dlx`
não fazem isso. Se preferir evitar a flag, use o `curl`.

O `yarn` clássico não tem `dlx`. Nele, instale o pacote e use a forma de cima.

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
