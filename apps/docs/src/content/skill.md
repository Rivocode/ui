Se você programa com um agente ao lado — Claude Code, Cursor, ou qualquer um que
leia skills — dá para ensiná-lo a biblioteca inteira de uma vez.

## Instalar

Um comando. Vale para todos os seus projetos:

```bash
mkdir -p ~/.claude/skills/rivocode-ui && \
  curl -fsSL https://ds.rivocode.com.br/skill/SKILL.md \
  -o ~/.claude/skills/rivocode-ui/SKILL.md
```

Só neste projeto, para a equipe toda receber junto pelo Git:

```bash
mkdir -p .claude/skills/rivocode-ui && \
  curl -fsSL https://ds.rivocode.com.br/skill/SKILL.md \
  -o .claude/skills/rivocode-ui/SKILL.md
```

Depois disso o agente carrega a skill sozinho quando você pedir uma tela, um
formulário ou um gráfico. Não é preciso citá-la no prompt.

## O que ela ensina

O contrato da biblioteca, inteiro e sem depender de rede: o Provider, o
vocabulário de classes, a diferença entre preencher e escrever texto, e a altura
que vem da densidade.

Uma tabela de escolha para os erros que mais aparecem — `Alert` contra `Toast`,
`Dialog` contra `AlertDialog`, `Select` contra `Combobox`, `Meter` contra
`Progress`. Cada linha diz o porquê, que é o que evita a próxima dúvida.

Os quatro finais de uma consulta, os dois subcaminhos com exemplo que roda, e a
lista do que nunca fazer: cor literal, `z-index` numérico, altura cravada,
portal montado à mão.

E os endereços da documentação crua, para ele buscar a peça que faltar.

## Por que uma skill, e não só o prompt

Colar o contrato no prompt funciona uma vez. Na segunda conversa ele não está
lá, e o agente volta a adivinhar a API pelo nome — com confiança, que é pior do
que errar em silêncio.

A skill fica instalada. E como ela é um arquivo só, buscado por HTTP, atualizar
é rodar o mesmo comando de novo.

## Ler sem instalar

O arquivo é markdown cru, em
[/skill/SKILL.md](https://ds.rivocode.com.br/skill/SKILL.md). Vale a leitura
mesmo para quem escreve à mão: é o resumo mais curto de como esta biblioteca
espera ser usada.
