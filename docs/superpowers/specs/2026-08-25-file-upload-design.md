# FileUpload: design

Data: 2026-08-25. A maior lacuna restante do catálogo: sistema de gestão vive
de anexo (XML da NFe, comprovante, contrato) e não havia peça.

## A divisão de trabalho

A mesma filosofia do DataTable: **a peça não conhece rede**. Subir o arquivo
(fetch, progresso real, retry) é domínio do app, que sabe qual endpoint e qual
autenticação. A peça faz o que é de interface:

- **`FileUpload`**: a área de soltar. Clique abre o seletor nativo; arrastar
  por cima acende a borda; soltar valida `accept` e `maxSize` e entrega
  aceitos em `onSelect` e recusados em `onReject`, cada recusa com o motivo
  legível ("maior que 5 MB", "tipo não aceito").
- **`FileUploadList`** + **`FileUploadItem`**: a apresentação de cada
  arquivo (nome, tamanho formatado em pt-BR, e o estado que o app informar):
  `progress` (0-100) vira barra, `error` vira texto com "Tentar de novo",
  nenhum dos dois é o estado pronto. Botão de remover sempre.

## API

```tsx
<FileUpload
  multiple
  accept=".xml,.pdf"
  maxSize={5 * 1024 * 1024}
  label="Arraste o XML da nota, ou clique para escolher"
  hint="XML ou PDF, até 5 MB"
  onSelect={(files) => enviar(files)}
  onReject={(recusas) => toast.add({ title: recusas[0].reason })}
  disabled={enviando}
/>

<FileUploadList>
  <FileUploadItem
    name="nota-4813.xml"
    size={48_213}
    progress={62}          // barra; omitido = pronto
    error="A conexão caiu" // vence progress; mostra Tentar de novo
    onRetry={() => enviar(file)}
    onRemove={() => remover(id)}
  />
</FileUploadList>
```

## Comportamentos

- A área é um `<button type="button">` de verdade: teclado e leitor de tela
  ganham de graça; o `<input type="file">` fica escondido e recebe o clique.
- Drag-over usa contador de `dragenter`/`dragleave` (entrar num filho dispara
  leave do pai; sem o contador a borda pisca).
- `accept` valida por extensão e por MIME, igual ao seletor nativo.
- Rejeição não é erro da peça: é resultado, entregue em `onReject` com motivo
  pronto para toast. A peça não guarda lista interna: o app é o dono dos
  arquivos, como é o dono dos dados da tabela.
- `progress` vira `role="progressbar"` com `aria-valuenow`; erro é texto, não
  só cor; remover tem `aria-label` com o nome do arquivo.
- Tamanho formatado por helper interno (`48,2 KB`, `1,2 MB`), nunca digitado.

## Arquivos

`src/components/file-upload.tsx`, `test/file-upload.test.tsx`,
`.design-sync/docs/FileUpload.md` (categoria Formulário),
`.design-sync/previews/FileUpload.tsx`, linha na skill, `.d.ts` no bundle e
JSON do site regenerado.
