import { Input, type InputProps } from "./field";
import { boletoPatternFor } from "./shared/boleto";

export type MaskedInputProps = Omit<InputProps, "value" | "onChangeText"> & {
  /**
   * O molde: `#` onde entra digito, `*` onde entra letra ou digito, e o resto e
   * pontuacao. O CNPJ alfanumerico leva `*` nas doze primeiras casas e `#` nos
   * dois verificadores. Com `*` no molde o teclado deixa de ser so numerico.
   * `boleto` e o unico nome: escolhe sozinho entre a linha de banco (47
   * digitos) e a de convenio (48, quando o primeiro digito e 8), e deixa sem
   * pontuacao os 44 do codigo de barras colado.
   */
  mask: "boleto" | (string & {});
  /** O valor LIMPO, sem pontuacao e com letra em caixa alta - a mascara e do campo, o dado nao a carrega. */
  value: string;
  onValueChange: (clean: string) => void;
};

const fits = (slot: string, character: string) =>
  slot === "#" ? /\d/.test(character) : /[A-Z0-9]/.test(character);

const cleanFor = (mask: string, text: string) => {
  const slots = [...mask].filter((slot) => slot === "#" || slot === "*");
  let out = "";
  for (const character of text.toUpperCase()) {
    const slot = slots[out.length];
    if (slot === undefined) break;
    if (fits(slot, character)) out += character;
  }
  return out;
};

const applyMask = (mask: string, clean: string) => {
  let out = "";
  let cursor = 0;
  for (const slot of mask) {
    if (cursor >= clean.length) break;
    if (slot === "#" || slot === "*") {
      out += clean[cursor];
      cursor++;
    } else {
      out += slot;
    }
  }
  return out;
};

const patternFor = (mask: string, text: string) =>
  mask === "boleto" ? boletoPatternFor(text, "#") : mask;

export function MaskedInput({ mask, value, onValueChange, ...props }: MaskedInputProps) {
  const alphanumeric = mask.includes("*");

  return (
    <Input
      {...props}
      keyboardType={alphanumeric ? "default" : "number-pad"}
      autoCapitalize={props.autoCapitalize ?? (alphanumeric ? "characters" : undefined)}
      autoCorrect={props.autoCorrect ?? (alphanumeric ? false : undefined)}
      value={applyMask(patternFor(mask, value), value)}
      onChangeText={(text) => onValueChange(cleanFor(patternFor(mask, text), text))}
    />
  );
}
