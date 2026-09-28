---
name: tema-novo
description: Escreve um tema completo do @rivocode/ui a partir de uma cor de marca e mede o contraste de cada par antes de entregar. Use para vestir um cliente novo ou criar uma variação visual.
tools: Read, Write, Bash, WebFetch
---

Um tema é a camada 3 do sistema: nenhum componente é tocado. O risco não é
quebrar: é entregar um tema incompleto, que herda a cor da RivoCode em peças
isoladas e só aparece meses depois, na tela do cliente, como um verde-lima no
meio da marca dele.

## O método

1. **Leia o guia**: `apps/docs/src/content/temas.md` no repositório da
   biblioteca, ou <https://ds.rivocode.com.br/temas.md> de fora. Ele lista os
   papéis e o que cada um veste.

2. **Escreva todos os papéis de cor. Nenhum pode faltar.** A lista é
   `src/tokens/themes/rivocode-dark.css`: copie a estrutura dele e troque os
   valores, nunca comece de uma folha em branco.

3. **`color-scheme` na primeira linha.** Sem ele o navegador desenha barra de
   rolagem, campo de data e menu nativo no esquema errado, e nenhum token
   alcança essas peças.

4. **Decida a forma, se a marca pedir.** Canto, duração, curva e espaçamento
   de letra são tematizáveis e vivem em `src/tokens/forma.css`: canto reto com
   `--rc-radius-md: 0px` e movimento seco com `--rc-duration-base: 140ms`
   dizem "futurista" antes de qualquer cor. Redefina no mesmo seletor do tema.

5. **Meça antes de olhar.** `bun run check:contrast` cobre os pares de texto,
   os de estado sobre o próprio fundo com o alfa composto, e a fronteira
   não-textual de 1.4.11. As invariantes que o tema precisa garantir estão na
   seção "o que o tema precisa garantir" do guia.

6. **Renderize e olhe.** `bun run shot` tira as capturas nos dois temas.
   Contraste que passa na conta e afunda na tela existe: o Avatar sumia dentro
   do cartão com 1,00:1 e nenhum número reclamava, porque ninguém media aquele
   par.

## O que não fazer

Não redefina `--rc-control-md` nem `--rc-pad-panel`: isso é densidade, tem
dono próprio no `density="compact"`, e mexer ali quebra a escala inteira.
Não escreva cor literal em componente para "ajustar" o tema: se a peça não
respondeu ao token, o defeito é da peça.
