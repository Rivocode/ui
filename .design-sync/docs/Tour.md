---
category: Sobreposição
---

# Tour

O passeio guiado pela tela: escurece a página, recorta um buraco em volta de um
elemento de cada vez e explica, num balão preso a ele, o que aquele elemento
faz. É o primeiro acesso a um painel novo, a funcionalidade que mudou de lugar,
o fluxo que a pessoa só entende vendo as peças na ordem.

```tsx
const [open, setOpen] = useState(false);

<Button onClick={() => setOpen(true)}>Fazer o tour</Button>
<Tour
  open={open}
  onOpenChange={setOpen}
  steps={[
    { target: '#novo-cliente', title: 'Cadastre o primeiro cliente', description: 'O cadastro pede só o CNPJ.' },
    { target: '#busca', title: 'Ache pelo nome ou pelo CNPJ' },
    { target: exportRef, title: 'Leve a lista para a planilha', placement: 'top' },
  ]}
  onFinish={() => markTourAsSeen()}
/>
```

Cada passo tem `target`, `title`, `description` opcional, `placement`
opcional e `action`, um conteúdo extra que entra acima dos botões (um link para
a doc, um atalho). O `target` é um seletor CSS ou um ref, e é lido na hora em
que o passo abre: o alvo pode nascer depois do tour, desde que exista quando a
vez dele chegar.

## O destaque

A máscara pinta a tela com o `overlay` do tema, o mesmo papel do fundo do
`Dialog`, e deixa um recorte de cantos arredondados em volta do alvo, com
alguns pixels de folga. O recorte acompanha o alvo quando a página rola, quando
a janela muda de tamanho e quando o próprio alvo cresce.

Por padrão a máscara engole todo clique, inclusive o do alvo: o tour explica, e
a tela espera. Com `interactive`, o recorte vira passagem e o alvo responde ao
clique enquanto o resto continua bloqueado. Serve ao passo que ensina fazendo
("clique em Salvar"), e nesse caso quem avança o tour é você, pelo
`onStepChange` ou pelo `step` controlado, no handler do próprio alvo.
Pelo teclado o caminho continua sendo o balão: o foco fica preso nele, então o
clique no alvo é atalho do ponteiro e do toque, e o "Próximo" nunca pode
faltar.

Clicar na máscara não fecha nada. Um tour que some no primeiro clique distraído
fora do balão é um tour que ninguém termina.

## O balão

O balão ancora no alvo pelo mesmo posicionamento do `Popover`: prefere o lado
de `placement` (`bottom` por padrão) e vira sozinho quando não cabe. Se o alvo
está fora da vista, a página rola até ele e o põe no centro; com
`prefers-reduced-motion`, a rolagem é um salto, sem animação.

Em cima vem o contador ("Passo 2 de 5"), depois o título e o texto. Embaixo,
"Pular tour" à esquerda e, à direita, "Voltar" (a partir do segundo passo) e
"Próximo", que no último passo vira "Concluir". As setas do teclado andam entre
os passos com o foco no balão, menos quando o foco está num campo posto em
`action`: ali a seta anda dentro do texto, e não troca de passo.

`onFinish` só é chamado no "Concluir". "Pular tour" e `Esc` chamam `onSkip`,
com o índice do passo em que a pessoa desistiu, que é o dado que diz qual passo
está longo demais. Os três fecham, e os três avisam `onOpenChange(false)`.

Os textos saem em português e se trocam por `labels`: `back`, `next`,
`finish`, `skip` e `counter`, que é uma função da posição e do total.

## Acessibilidade

O balão é um diálogo com nome e descrição: o título entra por
`aria-labelledby` e o texto por `aria-describedby`. O foco começa no
"Próximo", fica preso no balão enquanto o tour está aberto, e volta para quem
abriu o tour quando ele termina, por qualquer uma das três saídas. A troca de
passo é anunciada ("Passo 3 de 5. Leve a lista para a planilha"), porque o
foco continua no mesmo botão e, sem o anúncio, o leitor de tela não teria nada
a dizer.

## Alvo que não existe

O passo cujo alvo não está na página é pulado, na direção em que a pessoa
andava, e em desenvolvimento o console avisa qual passo e qual seletor. Avançar
sobre o último passo sem alvo conclui o tour; se nenhum alvo existe, o tour
fecha sozinho sem chamar `onFinish` nem `onSkip`. É o que acontece quando uma
permissão esconde um botão, e pular é melhor que um balão apontando para o
nada.

Vale também para o alvo que some com o passo aberto, quando a tela troca de
aba ou uma lista recarrega: o tour percebe que o elemento saiu do documento e
pula o passo do mesmo jeito, em vez de deixar o recorte num canto vazio.

## No celular ele vira folha de baixo

Abaixo de 640px o balão deixa de ser ancorado e sobe do pé da tela na largura
toda, com os botões na altura de toque, a mesma decisão que o `Popconfirm` e o
`CalendarPanel` tomam. A máscara e o recorte continuam: o alvo segue
destacado, e a rolagem o leva para a metade de cima da tela, onde a folha não
cobre.

## As partes

`className` veste o balão, seja ele o flutuante ou a folha. `classNames` veste
`mask`, `spotlight` (o recorte), `counter`, `title`, `description` e `footer`.
A máscara é irmã do balão dentro do portal, e sem esses nomes ela não se
alcança de lugar nenhum.

## Quando não usar

Para uma dica sobre um elemento só, que a pessoa pede passando o ponteiro, use
`Tooltip`. Para uma explicação de um parágrafo presa a um botão, que a pessoa
abre quando quer e fecha clicando fora, use `Popover`. O tour é a sequência
que a tela impõe, e custa atenção inteira; o `Popover` e o `Tooltip` são
consulta, e não custam nada a quem não precisa deles.

Para anunciar uma novidade sem parar a pessoa ("a exportação agora sai em
Excel"), use `Banner`: ele fica no alto da página, a pessoa lê quando quiser e
fecha, e ninguém é obrigado a atravessar cinco passos para chegar ao trabalho.

E não use o tour para compensar uma tela que não se explica sozinha. Se o
rótulo do botão precisa de um balão para ser entendido, é o rótulo que está
errado.

## No React Native

Traduz sobre o `Modal` do core, sem peer novo: o alvo vem por ref e é medido por `measureInWindow` quando o passo abre, e quatro faixas com o `overlay` do tema cercam o recorte. O balão é sempre a folha de baixo, que é o que o web já faz abaixo de 640px, com o mesmo contador, os mesmos botões e os mesmos textos, que moram num arquivo só, compartilhado pelos dois pacotes. Ref vazio pula o passo, com o mesmo aviso em desenvolvimento.

Três diferenças, e as três são do toque. O passo é controlado (`step` e `onStepChange` obrigatórios), como todo o pacote nativo. Não há `interactive`: o `Modal` é outra janela, e o toque não atravessa para a tela de trás. E não há rolagem sozinha, porque o React Native não tem `scrollIntoView`: quem rola é a tela, no `onStepChange`, com `scrollTo({ animated: false })` na `ScrollView`, e a peça mede de novo no quadro seguinte. O voltar do Android pula o tour, como o `Esc` no web.
