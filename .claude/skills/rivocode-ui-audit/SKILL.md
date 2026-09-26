---
name: rivocode-ui-audit
description: Audita telas de um app que usa o @rivocode/ui (web) ou o @rivocode/ui-native (React Native) contra as regras da casa e devolve um relatório com nota de 0 a 100, determinística. Use quando pedirem para auditar, revisar ou dar nota a uma tela, a uma pasta de páginas ou a um PR que monta interface com a biblioteca - cor literal, z-index numérico, peça reescrita à mão, campo sem rótulo, dinheiro em float, CPF sem validador, Pix caseiro, import pelo caminho errado, peer faltando.
---

# Auditar uma tela do @rivocode/ui

A auditoria tem duas metades, e a nota sai das duas pela mesma conta:

1. **A mecânica**, que o script faz: `scripts/audit.mts` lê o JSX, as classes, as
   importações e o `package.json`, e acha o que se acha sem opinião.
2. **O julgamento**, que é seu: ler a tela e decidir o que só se decide
   entendendo o que ela faz. Você escreve esses achados num JSON e roda o script
   de novo com ele. A nota final é dele, e não sua: mesma entrada, mesma nota.

Nunca dê a nota de cabeça, e nunca a ajuste depois de o script falar. Se um
achado mecânico está errado, descarte-o no JSON **com o motivo**: o descarte
aparece no relatório, e quem lê decide se concorda.

## O laço

1. **Rode o script** sobre o que pediram para auditar:

   ```bash
   bun .claude/skills/rivocode-ui-audit/scripts/audit.mts src/pages
   ```

   O caminho é o da pasta onde a skill mora: `.claude/skills/…` no projeto, ou
   `~/.claude/skills/…` quando ela foi instalada para todos.

   Sem o Bun, o Node 23.6 ou mais novo roda o mesmo arquivo
   (`node .claude/skills/rivocode-ui-audit/scripts/audit.mts src/pages`); o
   Node 22.6 roda com `--experimental-strip-types`, e `npx tsx` roda em qualquer
   Node. A extensão `.mts` é o que deixa o arquivo ser módulo ES também num
   projeto com `"type": "commonjs"`. O script não tem dependência.

   Ele varre `.tsx`, `.jsx`, `.ts` e `.js`, pula `node_modules`, `dist`, teste e
   story, e deixa de fora quem não tem JSX nem importa a biblioteca. O
   `package.json` sai de cada pasta auditada para cima, até a raiz do
   repositório, e todos somam: num monorepo, o peer hoisted na raiz conta, e
   duas pastas de apps diferentes trazem os manifestos das duas.

2. **Leia cada arquivo que o relatório lista**, inclusive os de nota 100. O
   script não vê o que a tela quer dizer.

3. **Confira cada achado mecânico.** Achado certo fica. Achado errado vai para
   `dismissals`, com o motivo em uma frase. Motivo que não convence ninguém
   ("não se aplica") não é motivo.

4. **Escreva os achados de julgamento**, pelas regras da tabela de julgamento
   abaixo, cada um com arquivo, linha e a frase que diz o que está errado.

5. **Rode de novo com o JSON** e entregue o relatório que ele imprimir:

   ```bash
   bun .claude/skills/rivocode-ui-audit/scripts/audit.mts src/pages --julgamento auditoria.json
   ```

   ```json
   {
     "findings": [
       { "rule": "escolha-de-peca", "file": "src/pages/notas.tsx", "line": 42, "message": "Toast para a falha de emissão, que precisa continuar visível: é Alert" }
     ],
     "dismissals": [
       { "rule": "cor-literal", "file": "src/pages/marca.tsx", "line": 12, "reason": "Amostras do ColorPicker: a cor do cliente é o dado da tela" }
     ]
   }
   ```

6. **Diga o que consertar primeiro**: os críticos, depois o que mais pesou.
   Não conserte sem pedirem; a auditoria entrega o diagnóstico.

O `file` de cada achado é o caminho como o relatório o imprime, e a `line` é
a linha do arquivo, em número inteiro a partir de 1 (`42`, e não `"42"`): a
regra vale igual para achado e descarte. Achado sem `message`, descarte sem
`reason`, linha que não é inteiro e descarte que não casa com achado nenhum são
recusados, e o relatório diz qual. JSON que não é um objeto com as listas
`findings` e `dismissals` para o script com código 2 e a frase do que falta.

Outras opções: `--json` imprime o relatório em JSON, `--manifesto` aponta o
`package.json` quando ele não está acima da pasta, e `--minimo 85` sai com
código 1 abaixo da nota, para a CI.

No código auditado, um comentário na linha do achado ou na de cima tira o
achado da conta, e o relatório lista com o motivo:

```tsx
{/* rivocode-audit-ignore cor-literal: amostras do ColorPicker, a cor do cliente é o dado */}
```

O achado de importação sai na linha do `import`, e o comentário no fim dela vale:

```tsx
import { useForm } from "react-hook-form"; // rivocode-audit-ignore useform-direto: formulário legado
```

## As regras mecânicas

Cada uma saiu da skill `rivocode-ui` ou das convenções, e a coluna Fonte diz de
onde. Peso: crítico 10, sério 5, moderado 3, menor 1.

| Regra | Severidade | O que o script acha | Fonte |
|---|---|---|---|
| `cor-literal` | crítico | hexadecimal, `rgb()`, `hsl()`, `oklch()`, classe da paleta do Tailwind (`bg-red-500`, `text-white`), valor arbitrário `bg-[#fff]`, `text-[red]` e `shadow-[0_0_0_#000]`, cor por nome em `color`, `fill`, `stroke`; o hexadecimal comparado (`location.hash === "#add"`) passa | SKILL.md, O que nunca fazer |
| `nome-acessivel` | crítico | `IconButton` sem `label` (nos dois pacotes o nome é o `label`), `Button` ou `<button>` só com ícone e sem nome; no nativo, `Button` e `Pressable` só com ícone e sem `accessibilityLabel`, e `Checkbox` ou `Switch` sem texto e sem `label` (lá o nome falado das peças é o `label`). Nome vazio (`aria-label=""`) não é nome | a11y.md, Nome acessível |
| `z-index-numerico` | sério | `z-10`, `z-[60]`, `zIndex: 5`, `z-index: 5` | SKILL.md, O que nunca fazer |
| `peca-reescrita` | sério | `<button>`, `<select>`, `<textarea>`, `<table>`, `<dialog>`, `<progress>`, `<meter>`, `<hr>`, `<details>`, `<input>` por tipo (`checkbox` é `Checkbox`, `range` é `Slider`, `password` é `PasswordInput`…), `role="dialog"`, `aria-modal` e o `fixed inset-0` do modal caseiro; no nativo, `Button`, `TextInput`, `Switch`, `Modal`, `ActivityIndicator` e `Touchable*` do react-native | components.md |
| `campo-sem-rotulo` | sério | `Field` sem `FieldLabel` (nativo: sem `label`), campo fora de `Field`/`FormField` e sem nome, e o `placeholder` fazendo de rótulo | a11y.md; texto.md |
| `imagem-sem-alt` | sério | `<img>` sem `alt` | a11y.md |
| `elemento-clicavel` | sério | `onClick` em `div`, `span`, `li` e parentes, e em `<a>` sem `href`, sem `role` | a11y.md, Foco e teclado |
| `foco-apagado` | sério | `outline-none` sem `focus-visible:ring` no mesmo `className` ou na mesma chamada (`cn(…)`) | SKILL.md; a11y.md |
| `formulario-sem-zod` | sério | `<form>` num arquivo sem `useZodForm` (busca com `role="search"` passa) | forms.md |
| `dinheiro-float` | sério | `parseFloat`, `Number()` ou `toFixed(2)` numa linha que fala de dinheiro, lida por palavra (`valorTotal` fala, `customWidth` não); o que diz `centavos` ou `cents` passa; `type="number"` ou `NumberField` em campo de valor | forms.md, Dinheiro é CurrencyInput |
| `documento-sem-validador` | sério | arquivo que fala de CPF ou CNPJ, valida alguma coisa ali mesmo (`z.`, `.regex`, `.test`, `.length(11)`) e não chama `isValidCpf` nem `isValidCnpj`; o esquema importado de outro arquivo se confere lá | forms.md |
| `pix-qr-caseiro` | sério | `qrcode`, `qrcode.react`, `react-qr-code` e parentes; `000201…` ou `br.gov.bcb.pix` escritos à mão; CRC16 próprio | components.md, Cobrar por Pix |
| `import-caminho-errado` | sério | `FormField` da raiz, `Button` de `/form`, caminho que não é entrada do pacote (`@rivocode/ui/dist/…`), pacote web num arquivo nativo e o contrário, `QRCode` da raiz do nativo | convencoes.md, os subcaminhos |
| `peer-faltando` | sério, de projeto | `/chart` sem `recharts`, `/form` sem `react-hook-form` (e sem `zod` e `@hookform/resolvers` quando há `useZodForm`), `/dnd` sem `@dnd-kit/*`, `/editor` sem `@tiptap/*`, qualquer entrada sem `lucide-react`, `react`, `react-dom` e `tailwindcss`; no nativo, qualquer entrada sem `react`, `react-native`, `nativewind`, `react-native-reanimated` e `react-native-keyboard-controller`, `/chart` sem `react-native-svg`, `/clipboard` sem `expo-clipboard`, `/file-upload` sem `expo-document-picker` | convencoes.md |
| `rotulo-fora-do-controle` | moderado | `Checkbox`, `Radio` ou `Switch` sem filho, com o texto num `<span>` ao lado | convencoes.md, Rótulo vem como filho |
| `tabindex-positivo` | moderado | `tabIndex` maior que zero | a11y.md |
| `useform-direto` | moderado | `useForm` importado do react-hook-form | forms.md |
| `dinheiro-escrito` | moderado | `R$ 12,4K` digitado, `R$ ${valor}`, `Intl.NumberFormat` com `BRL`; o `<InputPrefix>R$</InputPrefix>` da moldura de campo passa | SKILL.md, Dinheiro sai abreviado |
| `mascara-a-mao` | moderado | `replace` com `$1.$2` montando CPF, CNPJ, telefone | convencoes.md, Formatar o número |
| `portal-a-mao` | moderado | `TooltipProvider`, `ToastViewport`, `createPortal` | SKILL.md, O Provider |
| `altura-cravada` | moderado | `h-10` e parentes no `className` de controle | SKILL.md, Altura de controle |
| `descendente-arbitrario` | moderado | `[&_tr]`, `[&>div]` no `className` de uma peça da biblioteca | SKILL.md, classNames |
| `consulta-sem-finais` | moderado | `DataTable`, `ChartContainer` ou `DataList` de consulta (tem `isLoading`, `isError`, `onRetry`, ou o arquivo busca dado) sem um dos finais | SKILL.md, quatro finais |
| `texto-sem-acento` | moderado | texto de tela com palavra do dicionário da casa sem acento, e `-cao`/`-coes` | texto.md |
| `texto-em-ingles` | moderado | texto de tela com palavra de interface em inglês (`Save`, `Cancel`, `Loading`, `the`…) | SKILL.md; texto.md |
| `passo-sem-nome` | moderado | `"Passo 2"`, `"Etapa 3"` ou `"Step 1"` escrito como texto, o nome de passo que não diz a decisão | fluxo.md, Uma tela ou várias |
| `dado-sem-mascara` | moderado | `Input` comum num campo de CPF, CNPJ, telefone, celular, CEP ou placa, lido pelo `name`, `id`, `aria-label`, `placeholder`, `autoComplete` ou pelo `FieldLabel` do `Field` em volta; campo `readOnly` ou `disabled` passa, porque ninguém digita nele | SKILL.md, O campo sai do dado |
| `movimento-literal` | menor | `duration-300`, `ease-[cubic-bezier(…)]` | convencoes.md, Movimento |
| `recharts-direto` | menor | `recharts` importada no web | convencoes.md, `/chart` |

## As regras de julgamento

O script não as acha: elas entram pelo JSON, e pesam igual às mecânicas.

| Regra | Severidade | Quando | Leia |
|---|---|---|---|
| `provider-ausente` | crítico, de projeto | a árvore auditada monta telas e não há `RivoProvider` na raiz do app | SKILL.md, O Provider |
| `escolha-de-peca` | sério | peça do catálogo errada para a situação: `Toast` para o que precisa ficar, `Dialog` para confirmação destrutiva, `Select` para lista longa, `Checkbox` para o que liga agora | reference/components.md, a tabela inteira |
| `validacao-a-mao` | sério | formulário que valida com `useState` e `if` | reference/forms.md |
| `cor-sozinha` | sério | situação dita só pelo tom, sem palavra nem ícone | reference/a11y.md |
| `texto-generico` | moderado | "Confirmar", "OK", "Algo deu errado", "Nenhum resultado" sem porta, o par "Cancelar" e "Cancelar nota" | reference/texto.md |
| `finais-da-consulta` | moderado | consulta que só desenha o caminho feliz fora do `DataTable` e do `ChartContainer` | reference/components.md |
| `titulos-fora-de-ordem` | moderado | `h1` que pula para `h3`, dois `h1` na página | reference/a11y.md |
| `destrutivo-sem-protecao` | sério | excluir de vez, cancelar nota, emitir: ação sem volta que dispara no clique, sem `AlertDialog` e sem desfazer | reference/fluxo.md, Confirmar, desfazer, ou nada |
| `wizard-sem-dependencia` | moderado | `Steps` quebrando um cadastro que é só comprido, sem etapa que dependa da anterior | reference/fluxo.md, Wizard ou formulário único |
| `confirmacao-em-reversivel` | moderado | `AlertDialog` ou `Popconfirm` para arquivar, remover da lista ou excluir rascunho, o que dava para desfazer no aviso | reference/fluxo.md, Confirmar, desfazer, ou nada |
| `rascunho-que-some` | moderado | wizard ou formulário longo que perde o que foi digitado ao recarregar, ao errar o envio ou ao fechar | reference/fluxo.md, O wizard bem feito |
| `sucesso-silencioso` | menor | ação que termina sem nada na tela dizer que terminou | reference/fluxo.md, O que deixa o produto esperto |

Achado de julgamento aponta arquivo e linha que o script auditou; o de projeto
aponta o arquivo que você quiser. Regra que não existe e arquivo fora da
auditoria são recusados, e o relatório diz por quê.

## A conta

A mesma que o relatório imprime no fim:

- Peso por severidade: crítico 10, sério 5, moderado 3, menor 1.
- **Nota do arquivo** = max(0, 100 − Σ peso(regra) × min(ocorrências da regra no
  arquivo, 3)). A mesma regra repetida pesa no máximo três vezes por arquivo: um
  arquivo com vinte cores literais já está no chão, e a vigésima não diz nada
  que a terceira não disse.
- **Base** = média das notas dos arquivos auditados, arredondada para o inteiro
  mais próximo.
- **Nota final** = max(0, base − Σ peso(regra de projeto) × min(ocorrências, 3)).
  Peer faltando e Provider ausente valem para o app inteiro, e por isso
  descontam da nota final, e não da média.
- **Faixa**: 90 a 100 segue a casa, 75 a 89 ajustes pontuais, 50 a 74
  retrabalho, abaixo de 50 fora do contrato. Com qualquer achado crítico, a
  faixa não passa de ajustes pontuais.

Descartado e suprimido saem da conta e ficam no relatório, com o motivo.

## O que entregar

O relatório que o script imprimiu, inteiro, e embaixo dele três linhas suas: o
que consertar primeiro, o que o script não pôde conferir (os avisos) e, se
houve, cada descarte com o motivo. Nada de nota fora da que o script deu.

## Pelo MCP

Quem tem o `@rivocode/ui-mcp` conectado audita sem o script: a ferramenta
`audit_screen` recebe os arquivos (caminho e texto), os manifestos e o mesmo
par `findings` e `dismissals`, e devolve o mesmo relatório, pela mesma conta.
Num monorepo, passe em `package_jsons` os `package.json` do mais perto da tela
ao da raiz, cada um com caminho e texto: são os mesmos que o script acharia
subindo as pastas, e sem os de cima o peer hoisted na raiz vira achado que o
script não daria. `package_json`, com o texto de um só, continua valendo para o
app de um manifesto.
