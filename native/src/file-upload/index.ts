/**
 * `@rivocode/ui-native/file-upload` — anexar, num caminho próprio.
 *
 * Separado da raiz pela mesma regra do `form`, do `chart` e do `clipboard`: o
 * `expo-document-picker` é peer **opcional**, e o metro resolve import por
 * arquivo. Módulo do Expo no celular não é só bytes — é build —, e quem nunca
 * anexa arquivo não deve pagá-lo.
 *
 * **E é um caminho separado do `clipboard` de propósito.** Um índice comum aos
 * dois — `/expo`, digamos — obrigaria quem só quer copiar a chave de acesso de
 * uma NF-e a instalar o seletor de documentos, e vice-versa. A regra da casa é
 * **um subcaminho por peer**, e não um por assunto: é o peer que custa
 * instalação, então é ele que decide onde a porta fica.
 *
 * A fronteira é guardada por `scripts/check-fronteira-do-chart.ts`: nada em
 * `native/src/` alcançável pelo índice da raiz pode importar daqui.
 */
export {
  FileUpload,
  FileUploadItem,
  FileUploadList,
  type FileUploadItemProps,
  type FileUploadListProps,
  type FileUploadProps,
  type PickedFile,
  type Rejection,
} from "./file-upload";
