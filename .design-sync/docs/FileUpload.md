---
category: Formulário
---

# FileUpload

A área de anexar: clique abre o seletor, arrastar acende, soltar valida.

A peça não conhece rede, de propósito, como o `DataTable` não conhece React
Query. Subir o arquivo — fetch, progresso real, nova tentativa — é do app, que
sabe o endpoint e a autenticação. A peça valida `accept` e `maxSize` na
entrada, entrega os aceitos em `onSelect` e os recusados em `onReject`, cada
recusa com o motivo pronto para um toast: "maior que 5 MB", "tipo não aceito".

A lista é apresentação do estado que o app informar: `progress` de 0 a 100
vira barra anunciada como `progressbar`; `error` vence o progresso, mostra o
texto e oferece "Tentar de novo"; sem os dois, o arquivo está pronto. O
tamanho sai formatado pela peça — `48,2 KB`, `1,2 MB` — nunca digitado.

A área é um `<button>` de verdade, então teclado e leitor de tela funcionam
sem esforço; o `<input type="file">` escondido carrega `accept` e `multiple`,
e o diálogo do sistema já filtra os tipos.

Quem informa o formato e o limite no `hint` evita a recusa: a pessoa lê "XML
ou PDF, até 5 MB" antes de escolher errado.
