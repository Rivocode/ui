import { Input, type InputProps } from "./field";

export type MaskedInputProps = Omit<InputProps, "value" | "onChangeText"> & {
  /** O molde, com `#` onde entra digito: `##.###.###/####-##`. */
  mask: string;
  /** O valor LIMPO, so digitos - a mascara e do campo, o dado nao a carrega. */
  value: string;
  onValueChange: (clean: string) => void;
};

const digitsOf = (text: string) => text.replace(/\D/g, "");

const applyMask = (mask: string, digits: string) => {
  let out = "";
  let cursor = 0;
  for (const slot of mask) {
    if (cursor >= digits.length) break;
    if (slot === "#") {
      out += digits[cursor];
      cursor++;
    } else {
      out += slot;
    }
  }
  return out;
};

/**
 * O campo com molde: CNPJ, CPF, telefone. Quem digita ve a pontuacao
 * aparecer; quem le o valor recebe so os digitos, prontos para a API.
 */
export function MaskedInput({ mask, value, onValueChange, ...props }: MaskedInputProps) {
  const capacity = mask.split("#").length - 1;

  return (
    <Input
      {...props}
      keyboardType="number-pad"
      value={applyMask(mask, value)}
      onChangeText={(text) => onValueChange(digitsOf(text).slice(0, capacity))}
    />
  );
}
