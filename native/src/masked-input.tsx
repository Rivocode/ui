import { Input, type InputProps } from "./field";
import { boletoPatternFor } from "./shared/boleto";
import { applyPattern, isNumericMask, maskText, unmask, type Mask } from "./shared/mask";
import { useSilentMisuse } from "./silent-misuse";

export type MaskedInputProps = Omit<InputProps, "value" | "onChangeText" | "onValueChange"> & {
  /**
   * The pattern, in the same syntax as the web: a ready-made name (`cpf`,
   * `cnpj`, `cep`, `data`, `hora`, `placa`, `cartao`, `telefone`, `boleto`,
   * `moeda`) or a hand-written pattern, with `9` for a digit, `A` for a letter
   * and `*` for either.
   */
  mask: Mask;
  /**
   * The CLEAN value, without punctuation and with letters in uppercase - the
   * mask belongs to the field, the data does not carry it. In `moeda`, the
   * digits of the on-screen text, like the web raw value: `0,05` yields `005`,
   * and `12,00` yields `1200`.
   */
  value: string;
  /**
   * Called on every keystroke with the clean value and, in the second argument,
   * the masked text that the web passes first.
   */
  onValueChange: (clean: string, masked: string) => void;
};

const cleanOf = (masked: string) => unmask(masked).toUpperCase();

const format = (mask: Mask, text: string) =>
  mask === "boleto" ? applyPattern(text, boletoPatternFor(text)) : maskText(text, mask);

const readTyped = (mask: Mask, text: string) => {
  const masked = format(mask, text.toUpperCase());
  return { clean: cleanOf(masked), masked };
};

export function MaskedInput({ mask, value, onValueChange, ...props }: MaskedInputProps) {
  useSilentMisuse(
    mask.includes("#"),
    `[rivocode/ui-native] MaskedInput with "#" in the pattern ("${mask}"): since 1.0 the pattern follows the web syntax, and "#" became fixed punctuation. Replace each "#" with "9" (digit).`,
  );
  const alphanumeric = !isNumericMask(mask);

  return (
    <Input
      {...props}
      keyboardType={alphanumeric ? "default" : "number-pad"}
      autoCapitalize={props.autoCapitalize ?? (alphanumeric ? "characters" : undefined)}
      autoCorrect={props.autoCorrect ?? (alphanumeric ? false : undefined)}
      value={format(mask, value)}
      onChangeText={(text) => {
        const { clean, masked } = readTyped(mask, text);
        onValueChange(clean, masked);
      }}
    />
  );
}
