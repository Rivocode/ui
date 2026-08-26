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

## As partes

`FileUploadList` é a lista do que já entrou, e `FileUploadItem` é cada arquivo
nela, com nome, tamanho, `progress` e `error`. Subir é do app: a peça valida na
entrada e mostra o que o app disser depois — quem controla o envio é quem sabe
quando ele terminou.

## No React Native

Traduz, no caminho próprio `@rivocode/ui-native/file-upload` — o `expo-document-picker` é peer **opcional** e módulo nativo (`npx expo install expo-document-picker`), e tem caminho separado do `Clipboard` pela mesma conta: a regra da casa é **um subcaminho por peer**, e não um por assunto. O que não muda é o principal: **a peça continua não conhecendo rede**. Ela valida `accept` e `maxSize` na entrada, entrega os aceitos em `onSelect` e os recusados em `onReject`, cada recusa com o motivo pronto para um aviso.

**A área de soltar vira um botão, e isso é a peça inteira mudando de forma.** No celular não há arrastar: nada pode ser solto em lugar nenhum, e o retângulo tracejado de 96px do web é, letra por letra, o idioma de "solte aqui" — desenhá-lo numa tela de toque promete um gesto que o aparelho não tem. Tirado o soltar, o que sobra daquela caixa é um botão com muito espaço vazio em volta: **o espaço era o alvo de soltar, e não a affordance**. Então sobra o botão, numa altura de controle — e a altura que ele devolve é da **lista**, que é onde o arquivo aparece, sobe, falha e é removido. O `hint` continua existindo, e entra no nome falado do botão pelo mesmo motivo que no web ele mora dentro do `<button>`: quem ouve a tela precisa saber "XML ou PDF, até 5 MB" antes de abrir o seletor, e não depois de ser recusado.

**O `accept` fala MIME.** O seletor do Expo filtra por tipo (`text/xml`, `image/*`), e não por extensão: um `.xml` mandado para lá não casaria nada e abriria o diálogo vazio. Então a extensão com ponto continua valendo — na validação de volta, contra o nome do arquivo —, mas não vai para o sistema. E o que volta não é um `File`: é um `PickedFile` (`uri`, `name`, `size?`, `mimeType?`), com o `uri` local que o app usa para subir. **O `size` pode faltar**, porque nem todo provedor de arquivo do Android o informa, e por isso `maxSize` só recusa o que conseguiu medir. Fechar o seletor devolve `canceled` e nenhum callback dispara, como fechar a janela do seletor do web.

`FileUploadList` e `FileUploadItem` atravessam com o mesmo contrato — `progress` de 0 a 100 vira barra anunciada, `error` vence o progresso e oferece "Tentar de novo" —, com duas diferenças de plataforma: o corte do nome é `numberOfLines`, que lá é prop e não classe, e o tamanho sai formatado **sem `Intl`** ("47,1 KB", com a vírgula escrita à mão), pela mesma razão que o `Meter` nativo não tem `format`.
