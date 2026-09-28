import { View } from "react-native";

import { Checkbox } from "./checkbox";
import { cn } from "./cn";

export type CheckboxGroupItem = { label: string; value: string };

export type CheckboxGroupProps = {
  items: CheckboxGroupItem[];
  /** Os valores marcados. Vazio e um estado normal, nao um erro. */
  value: string[];
  onValueChange: (value: string[]) => void;
  /**
   * O nome do conjunto para o leitor de tela. Sem ele, o conjunto nao tem nome
   * nenhum.
   *
   * O web pede a mesma coisa por `aria-label`, e pelo mesmo motivo do
   * `RadioGroup`: a lista de caixas responde uma pergunta, e sem o nome do
   * conjunto cada caixa se apresenta sem dizer qual.
   *
   * Nomear liga junto o papel de lista: no React Native nao existe papel de
   * `group`, e uma `View` sem papel nenhum nao carrega nome. Nao desenha nada
   * - o texto visivel e do `Field`, como no `Select` e no `Combobox`.
   */
  label?: string;
  disabled?: boolean;
  className?: string;
};

export function CheckboxGroup({
  items,
  value,
  onValueChange,
  label,
  disabled,
  className,
}: CheckboxGroupProps) {
  const toggle = (item: string, checked: boolean) =>
    onValueChange(checked ? [...value, item] : value.filter((other) => other !== item));

  return (
    <View
      accessibilityRole={label === undefined ? undefined : "list"}
      accessibilityLabel={label}
      className={cn("gap-3", className)}
    >
      {items.map((item) => (
        <Checkbox
          key={item.value}
          checked={value.includes(item.value)}
          onCheckedChange={(checked) => toggle(item.value, checked)}
          disabled={disabled}
        >
          {item.label}
        </Checkbox>
      ))}
    </View>
  );
}
