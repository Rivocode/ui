---
category: IA
---

# ToolCall

O cartão recolhível de uma chamada de ferramenta feita por um assistente: o
nome da ferramenta, em que pé ela está, a entrada e a saída. Quando a chamada
precisa de permissão, ele traz os botões de aprovar e recusar. Vive em
`@rivocode/ui/ai`.

```tsx
import { ToolCall } from '@rivocode/ui/ai'

<ToolCall
  name="buscar_notas"
  title="Consultando as notas de agosto"
  status="done"
  input={{ mes: 8, ano: 2026 }}
  output={{ total: 3, valor: 5330 }}
/>
```

## Os cinco estados

| `status` | O que a pessoa vê |
| --- | --- |
| `pending` | relógio e "Pendente", em neutro |
| `running` | círculo girando e "Rodando", em informação; o cartão anuncia `aria-busy` |
| `done` | visto e "Concluída", em sucesso |
| `error` | xis e "Erro", em perigo; o painel abre sozinho e mostra o `error` |
| `approval` | mão e "Aguardando aprovação", em atenção; o painel abre sozinho |

**Cor nunca é o único sinal.** Cada estado sai com ícone E texto, e o texto
entra no nome do gatilho: o leitor de tela ouve "buscar_notas, Consultando as
notas de agosto, Rodando". `labels` troca os textos, para outra língua.

## Entrada e saída

`input` e `output` saem no `CodeBlock` da casa. Objeto sai como JSON indentado;
texto sai como veio. O painel começa fechado, porque quem lê a conversa quer a
resposta e não o encanamento, e abre no toque do gatilho. **Sem entrada, saída
nem erro, não há gatilho**: o cabeçalho sai como texto, e não como um botão
que não abre nada, anunciado expandido e apontando para um painel que não
existe.

Nome e título longos quebram em até duas linhas, em vez de cortar numa linha
só; o nome inteiro da ferramenta fica no `title`, para quem pousa o ponteiro.

`defaultOpen` troca o ponto de partida, e `open` com `onOpenChange` controla.

## Aprovar antes de rodar

Em `approval`, `onApprove` e `onReject` ligam os dois botões. Eles ficam **fora
do painel recolhível**, na base do cartão: decisão que espera a pessoa não se
esconde atrás de um toque. O painel abre sozinho, para que a pessoa leia os
argumentos antes de decidir.

```tsx
<ToolCall
  name="emitir_nota"
  title="Emitir a nota da Clínica São Lucas"
  status="approval"
  input={{ cliente: 'Clínica São Lucas', valor: 3400 }}
  onApprove={() => approve(call.id)}
  onReject={() => reject(call.id)}
/>
```

Texto longo em `labels.approve` ou `labels.reject` quebra a linha dentro do
botão, e não vaza do cartão.

A peça não guarda a decisão: quem aprovou muda o `status` para `running`, e
quem recusou muda para `error` com a frase do motivo.

## Partes

`classNames` alcança `trigger` (o cabeçalho, seja o botão ou o texto sem
painel), `name`, `status`, `panel`, `error` e `actions`.

## Quando não usar

- **Seções de conteúdo que se abrem** são `Accordion`. O `Accordion` organiza
  texto que já existe; o `ToolCall` é um acontecimento com estado, e o estado é
  o que a pessoa lê primeiro.
- **Um bloco só que esconde detalhe** é `Collapsible`. Se não há ferramenta,
  estado nem aprovação (é só "ver mais"), o `Collapsible` faz o mesmo sem a
  moldura.

## No React Native

Traduz, no caminho próprio `@rivocode/ui-native/ai`, com os mesmos `name`, `status`, `input`, `output`, `error`, `onApprove`, `onReject`, `labels`, `defaultOpen`, `open` e `onOpenChange`. `title` e `error` são `string`, porque texto no nativo mora dentro de um `Text`.

**Cor continua não sendo o único sinal.** O pacote não traz ícone, então cada estado sai com uma marca de texto (○, ✓, ✕, !) antes do nome, e `running` ganha o giro. O gatilho diz o nome da ferramenta e o estado ao leitor de tela.
