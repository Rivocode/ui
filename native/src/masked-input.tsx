import { Input, type InputProps } from "./field";
import { boletoPatternFor } from "./shared/boleto";
import { applyPattern, isNumericMask, maskText, unmask, type Mask } from "./shared/mask";

export type MaskedInputProps = Omit<InputProps, "value" | "onChangeText" | "onValueChange"> & {
  /**
   * O molde, na mesma sintaxe do web: um nome pronto (`cpf`, `cnpj`, `cep`,
   * `data`, `hora`, `placa`, `cartao`, `telefone`, `boleto`, `moeda`) ou um
   * molde escrito na mao, com `9` para digito, `A` para letra e `*` para os
   * dois.
   */
  mask: Mask;
  /** O valor LIMPO, sem pontuacao e com letra em caixa alta - a mascara e do campo, o dado nao a carrega. Em `moeda`, os digitos do texto na tela, como o cru do web: `0,05` entrega `005`, e `12,00` entrega `1200`. */
  value: string;
  /** Chamado a cada tecla com o valor limpo e, no segundo argumento, o texto com mascara que o web entrega primeiro. */
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
