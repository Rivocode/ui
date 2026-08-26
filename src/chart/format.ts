/**
 * Os formatadores continuam alcancaveis por `@rivocode/ui/chart`, que e onde
 * eles nasceram e onde a doc dos eixos os cita.
 *
 * O codigo mudou de casa para `lib/`: formatar dinheiro numa celula de tabela
 * nao e assunto de grafico, e obrigar quem escreve uma tabela a importar do
 * subcaminho do grafico invertia a dependencia. O mesmo vocabulario vale agora
 * no eixo, no Meter, no Progress, no Slider e no NumberField.
 */
export {
  compact,
  compactWords,
  currency,
  currencyShort,
  currencyShortWords,
  dayMonth,
  formatters,
  integer,
  monthShort,
  percent,
  resolveFormat,
  type Format,
  type FormatName,
} from "../lib/format";
