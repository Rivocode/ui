Se você programa com um agente ao lado, Claude Code, Cursor, ou qualquer um que
leia skills, dá para ensiná-lo a biblioteca inteira de uma vez.

A skill é uma pasta: um `SKILL.md` que o agente lê sempre, e sete arquivos em
`reference/` que ele abre só quando o trabalho pede. Layout, design, escolha de
peça, acessibilidade, formulário, gráfico e tema ficam separados justamente
para não ocupar contexto enquanto não são o assunto.

## Instalar

O comando do pacote é o caminho normal. Ele copia a skill **da versão
instalada**: um projeto preso no `0.2.0` recebe a skill do `0.2.0`, e não a do
site, que fala de peças que ele ainda não tem.

```bash
npx rivocode-ui skill        # npm
pnpm exec rivocode-ui skill  # pnpm
yarn rivocode-ui skill       # yarn
bunx rivocode-ui skill       # bun
```

Sem argumento, ela entra no projeto, em `.claude/skills/rivocode-ui`, e a
equipe recebe junto pelo Git. Com `--global`, entra em `~/.claude` e vale para
todos os seus projetos.

### Sem a biblioteca no projeto

```bash
bunx @rivocode/ui skill
pnpm dlx @rivocode/ui skill
npx -y @rivocode/ui skill
```

O `yarn` clássico não tem `dlx`. Nele, instale o pacote e use a forma de cima.

### Sem gerenciador de pacote nenhum

O site serve a skill crua, sempre na versão mais nova:

```bash
dir=$HOME/.claude/skills/rivocode-ui && mkdir -p "$dir/reference" && \
  curl -fsSL https://ds.rivocode.com.br/skill/SKILL.md -o "$dir/SKILL.md" && \
  for f in layout design components a11y forms charts theming; do \
    curl -fsSL "https://ds.rivocode.com.br/skill/reference/$f.md" \
      -o "$dir/reference/$f.md"; \
  done
```

Trocando `$HOME/.claude` por `.claude` ela entra só no projeto.

<details>
<summary>Se o npm reclamar de conflito de dependência</summary>

Até a versão `0.3.0`, o par `zod` era declarado como `^4`, e o
`@hookform/resolvers` arrasta pacotes que pedem zod 3. Para rodar um comando o
npm instala tudo num diretório temporário, inclusive os pares opcionais, e o
conflito aparecia ali. Nessas versões, acrescente `--legacy-peer-deps`.

A faixa foi alargada e o conflito deixou de existir.

</details>

## Atualizar

O mesmo comando de novo. A cópia substitui a pasta inteira, então não sobra
referência velha apontando para peça que mudou.

## O que ela ensina

O contrato da biblioteca, inteiro e sem depender de rede: o Provider, o
vocabulário de classes, a diferença entre preencher e escrever texto, e a
altura que vem da densidade.

Uma tabela de escolha para os erros que mais aparecem, `Alert` contra `Toast`,
`Dialog` contra `AlertDialog`, `Select` contra `Combobox`, `Meter` contra
`Progress`. Cada linha diz o porquê, que é o que evita a próxima dúvida.

O vocabulário de ícones — um conceito, um ícone, sempre do lucide — e a regra
de tamanho e de nome acessível que acompanha cada um.

Os quatro finais de uma consulta, os dois subcaminhos com exemplo que roda, e a
lista do que nunca fazer: cor literal, `z-index` numérico, altura cravada,
portal montado à mão.

E os endereços da documentação crua, para ele buscar a peça que faltar.

## Por que uma skill, e não só o prompt

Colar o contrato no prompt funciona uma vez. Na segunda conversa ele não está
lá, e o agente volta a adivinhar a API pelo nome, com confiança, que é pior do
que errar em silêncio.

A skill fica instalada, e viaja com o pacote: quem atualiza a biblioteca tem a
skill nova a um comando de distância.

## Ler sem instalar

O arquivo principal é markdown cru, em
[/skill/SKILL.md](https://ds.rivocode.com.br/skill/SKILL.md). Vale a leitura
mesmo para quem escreve à mão: é o resumo mais curto de como esta biblioteca
espera ser usada.
