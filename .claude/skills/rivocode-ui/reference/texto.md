# O texto da interface

A peça certa com o texto errado é uma tela errada. Este arquivo diz **o que
escrever dentro** dos componentes, e é a parte do trabalho que nenhuma guarda
mede: `tsc`, contraste, `check:classes` e os testes passam inteiros sobre uma
mensagem que não ajuda ninguém.

## Conteúdo

- As três frases que toda tela escreve
- O botão diz o que vai acontecer
- O par de botões nunca repete a mesma palavra com dois sentidos
- A mensagem de erro nomeia quem falhou e o que fazer
- O vazio é uma porta, não um aviso
- Rótulo, dica e marca de lugar
- Forma: pessoa, tempo e tamanho

## As três frases que toda tela escreve

Toda listagem, todo gráfico e todo formulário escrevem estas três, e são elas
que a pessoa lê nos piores dias:

| Momento | Quem escreve | O que a frase precisa ter |
|---|---|---|
| Deu erro | `errorTitle` + `errorMessage` | o que falhou, quem falhou, e o que fazer agora |
| Não há nada | `empty` (título + descrição) | por que está vazio, e o caminho para deixar de estar |
| Vai sem volta | título + descrição do `AlertDialog` | o efeito, quem é avisado, e que não se desfaz |

## O botão diz o que vai acontecer

O rótulo é um **verbo com o objeto**, não uma categoria. A pessoa decide olhando
o botão, e "Confirmar" não diz o que ela está confirmando.

| Em vez de | Escreva |
|---|---|
| Confirmar | Emitir nota |
| Salvar | Salvar rascunho |
| OK | Entendi |
| Enviar | Enviar para a prefeitura |
| Sim | Cancelar nota |

Quando a ação não tem volta, o verbo carrega isso: "Cancelar nota" e não
"Continuar".

## O par de botões nunca repete a mesma palavra com dois sentidos

É o defeito de texto mais caro que existe, e ele aparece exatamente onde dói:
na caixa que confirma uma ação sem volta.

```tsx
<AlertDialogTitle>Cancelar a nota 4813?</AlertDialogTitle>
<AlertDialogDescription>
  A prefeitura recebe o cancelamento e o cliente é avisado. Não dá para desfazer.
</AlertDialogDescription>
<AlertDialogFooter>
  <AlertDialogClose render={<Button variant="secondary" />}>Manter nota</AlertDialogClose>
  <AlertDialogClose render={<Button variant="danger" />}>Cancelar nota</AlertDialogClose>
</AlertDialogFooter>
```

O botão de escape diz **"Manter nota"**. Se dissesse "Cancelar", a palavra
significaria duas coisas opostas dentro da mesma caixa — abortar a operação e
cancelar a nota — e a pessoa teria que adivinhar qual, numa ação que avisa a
prefeitura e não tem volta.

A regra sai daí: **o escape nomeia o estado que fica**, não a desistência.
"Manter nota", "Continuar editando", "Ficar aqui". Nunca "Cancelar" ao lado de
uma ação que também se chama cancelar.

O título é uma **pergunta que nomeia o objeto**: "Cancelar a nota 4813?", e não
"Tem certeza?". Um número no título é o que permite descobrir que se clicou na
linha errada.

## A mensagem de erro nomeia quem falhou e o que fazer

Duas frases, e cada uma tem um trabalho. É o padrão que o catálogo inteiro já
usa, e ele não se negocia por pressa:

```tsx
<DataTable
  isError={query.isError}
  errorTitle="Não foi possível carregar as notas"
  errorMessage="A prefeitura não respondeu. Tente de novo em alguns minutos."
  onRetry={query.refetch}
  retryLabel="Tentar de novo"
/>
```

- **`errorTitle`** diz o que falhou, nomeando o objeto: "as notas", "o
  faturamento", "a agenda". Nunca "Erro" nem "Algo deu errado".
- **`errorMessage`** diz **quem** falhou e **o que fazer**: "A prefeitura não
  respondeu", "A consulta expirou", seguido de "Tente de novo em alguns
  minutos". Quem falhou é o que decide se a pessoa espera, corrige ou liga para
  alguém.
- **`onRetry`** existe quando repetir resolve. Erro que não tem saída não ganha
  botão, ganha o caminho: quem procurar, ou onde olhar.

Nunca escreva código de erro, `stack` ou nome de endpoint na tela. Isso é para o
log.

**Erro de campo é diferente de erro de tela**: o do campo diz o formato aceito
("Use o formato 00.000.000/0000-00"), e não "Valor inválido". Inválido a pessoa
já sabia; o que ela não sabe é o que serve.

## O vazio é uma porta, não um aviso

O mesmo componente tem dois textos diferentes, e trocá-los é o erro comum:

| Situação | Título | Descrição |
|---|---|---|
| Nunca houve nada | "Nenhuma nota" | "Emita a primeira para ela aparecer." |
| O filtro não achou | "Nenhuma nota no período" | mude o filtro, e diga qual |
| A busca não achou | "Nenhum cliente com esse nome" | — |

O primeiro caso é a primeira vez da pessoa no produto, e ele merece a **ação**
junto:

```tsx
<EmptyState
  title="Nenhuma nota"
  description="Emita a primeira para ela aparecer."
  action={<Button>Emitir nota</Button>}
/>
```

O segundo e o terceiro **não** levam ação de criar: quem filtrou quer o filtro
de volta, não um cadastro. E o texto nomeia o recorte que não achou — "no
período", "com esse nome" —, porque é ele que a pessoa vai mexer.

O desenho segue a mesma divisão: o primeiro caso aceita `illustration`, e o
segundo e o terceiro levam `icon`. Quando usar cada um, e como pintar sem cor
literal, está em [design.md](design.md#ícone-ou-ilustração-no-estado-vazio).

## Rótulo, dica e marca de lugar

- **Rótulo** nomeia o campo e fica sempre visível. Não é frase, não tem dois
  pontos: "CNPJ do cliente", não "Digite o CNPJ do cliente:".
- **Marca de lugar** (`placeholder`) é **exemplo**, nunca rótulo. Ela some ao
  digitar e vários leitores de tela não a anunciam: usada como rótulo, o campo
  fica sem nome. Sirva para mostrar o formato: `00.000.000/0000-00`.
- **Dica** explica a consequência, não repete o rótulo. "Ela aparece no corpo da
  nota" vale; "Informe a descrição" não vale nada.
- **Texto acessível de ícone** diz a ação, não o desenho: `aria-label="Excluir
  nota"`, nunca `aria-label="Lixeira"`.

## Forma: pessoa, tempo e tamanho

- **Fale com a pessoa, na segunda pessoa**: "Você ainda não emitiu nenhuma
  nota". O sistema não fala de si: nada de "Estamos processando".
- **Presente, e voz ativa.** "A prefeitura não respondeu", não "Não foi possível
  que a resposta fosse obtida".
- **Sem culpa e sem susto.** Não diga que a pessoa errou; diga o que serve.
  Ponto de exclamação não pertence a nenhuma mensagem de sistema.
- **Frase curta e sem jargão nosso.** "A consulta expirou", não "timeout no
  gateway".
- **PT-BR na tela, código em inglês.** Termo do ecossistema não se traduz: é
  "agents", não "agentes".
- **Sem travessão na prosa da tela.** Duas frases curtas cabem melhor num alerta
  do que uma longa com aposto.
