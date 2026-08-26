import { Platform } from "react-native";

/* ---------------------------------------------------------------------------
 * A familia de letra de largura fixa, por aparelho.
 *
 * Nao ha `font-mono` em peca nenhuma daqui, e a ausencia e proposital. O
 * react-native-css compila `.font-mono` para `{ fontFamily: "ui-monospace" }`:
 * ele guarda so a PRIMEIRA familia da lista e joga fora o fallback que o CSS
 * escreveu depois. E `ui-monospace` e familia generica de CSS - nao existe
 * instalada no iOS nem no Android. Sem nome de fonte que case, o RN cai calado
 * na letra padrao do sistema.
 *
 * O preco foi esse "calado": seis pecas - Code, Timeline, Calendar,
 * ColorPicker, ChartDonut e FileUpload - pediram letra mono por meses e sairam
 * em letra proporcional, sem erro, sem aviso e sem ninguem notar na revisao de
 * tela. Numero de coluna do Calendar e tamanho de arquivo do FileUpload sao
 * justamente onde a largura fixa e o que alinha.
 *
 * Quem devolver `font-mono` ao className recria a falha inteira, e nada acusa:
 * a classe e valida, gera estilo, e o estilo aponta para uma fonte que o
 * aparelho nao tem. A largura fixa entra por `style={{ fontFamily: mono }}`.
 * ------------------------------------------------------------------------- */
export const mono = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
});
