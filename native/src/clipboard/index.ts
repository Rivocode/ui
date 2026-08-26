/**
 * `@rivocode/ui-native/clipboard` — copiar, num caminho próprio.
 *
 * Separado da raiz pela mesma regra do `@rivocode/ui-native/form` e do
 * `@rivocode/ui-native/chart`: o `expo-clipboard` é peer **opcional**, e o
 * metro resolve import por arquivo. Dentro do índice principal, um aplicativo
 * que só quer um `Button` teria de instalar — e ligar ao projeto nativo, que
 * em módulo do Expo custa build e não só bytes — uma dependência que ele nunca
 * chama.
 *
 * **É um caminho só para o `Clipboard`, e o `FileUpload` tem o dele.** Os dois
 * poderiam dividir uma porta chamada `/expo`, e a conta de quem instala diz
 * que não: quem põe um botão de copiar ao lado da chave de acesso de uma NF-e
 * não anexa arquivo nenhum, e um índice comum arrastaria o
 * `expo-document-picker` para o projeto dele — que é exatamente o custo que
 * este arranjo existe para não cobrar. A regra que sai daqui é **um
 * subcaminho por peer**, e não um por assunto.
 *
 * A fronteira é a mesma dos outros dois, e
 * `scripts/check-fronteira-do-chart.ts` a guarda: nada em `native/src/`
 * alcançável pelo índice da raiz pode importar daqui.
 */
export { Clipboard, type ClipboardProps } from "./clipboard";
