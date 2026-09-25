import { Input, type InputProps } from "./field";
import { boletoPatternFor } from "./shared/boleto";
import { applyPattern, isNumericMask, maskText, unmask, type Mask } from "./shared/mask";

export type MaskedInputProps = Omit<InputProps, "value" | "onChangeText" | "onValueChange"> & {
  /**
   * O molde, na mesma sintaxe do web: um nome pronto (`cpf`, `cnpj`, `cep`,
   * `data`, `hora`, `placa`, `cartao`, `telefone`, `boleto`, `moeda`) ou um
   * molde escrito na mao, com `9` para digito, `A` para letra e `*` para os
   * dois. Molde com `#` segue a sintaxe antiga do nativo (`#` digito, `*`
   * letra ou digito, o resto literal) e esta obsoleto: troque `#` por `9`.
   */
  mask: Mask;
  /** O valor LIMPO, sem pontuacao e com letra em caixa alta - a mascara e do campo, o dado nao a carrega. Em `moeda`, os centavos sem zero a esquerda. */
  value: string;
  /** Chamado a cada tecla com o valor limpo e, no segundo argumento, o texto com mascara que o web entrega primeiro. */
  onValueChange: (clean: string, masked: string) => void;
};

const legacyFits = (slot: string, character: string) =>
  slot === "#" ? /\d/.test(character) : /[A-Z0-9]/.test(character);

const legacyClean = (mask: string, text: string) => {
  const slots = [...mask].filter((slot) => slot === "#" || slot === "*");
  let out = "";
  for (const character of text.toUpperCase()) {
    const slot = slots[out.length];
    if (slot === undefined) break;
    if (legacyFits(slot, character)) out += character;
  }
  return out;
};

const legacyApply = (mask: string, clean: string) => {
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

const isLegacy = (mask: string) => mask.includes("#");

const cleanOf = (mask: Mask, masked: string) =>
  mask === "moeda" ? masked.replace(/\D/g, "").replace(/^0+/, "") : unmask(masked).toUpperCase();

const format = (mask: Mask, text: string) =>
  mask === "boleto" ? applyPattern(text, boletoPatternFor(text)) : maskText(text, mask);

const display = (mask: Mask, clean: string) =>
  isLegacy(mask) ? legacyApply(mask, clean) : format(mask, clean);

const readTyped = (mask: Mask, text: string) => {
  if (isLegacy(mask)) {
    const clean = legacyClean(mask, text);
    return { clean, masked: legacyApply(mask, clean) };
  }
  const masked = format(mask, text.toUpperCase());
  return { clean: cleanOf(mask, masked), masked };
};

const numericKeyboard = (mask: Mask) =>
  isLegacy(mask) ? !mask.includes("*") : isNumericMask(mask);

export function MaskedInput({ mask, value, onValueChange, ...props }: MaskedInputProps) {
  const alphanumeric = !numericKeyboard(mask);

  return (
    <Input
      {...props}
      keyboardType={alphanumeric ? "default" : "number-pad"}
      autoCapitalize={props.autoCapitalize ?? (alphanumeric ? "characters" : undefined)}
      autoCorrect={props.autoCorrect ?? (alphanumeric ? false : undefined)}
      value={display(mask, value)}
      onChangeText={(text) => {
        const { clean, masked } = readTyped(mask, text);
        onValueChange(clean, masked);
      }}
    />
  );
}
