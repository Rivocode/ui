import { useState } from "react";
import { View } from "react-native";

import { cn, type Slots } from "./cn";
import { InputGroup, type InputGroupProps } from "./input-group";

export type PasswordInputProps = Omit<
  InputGroupProps,
  "actions" | "prefix" | "suffix" | "secureTextEntry" | "classNames"
> & {
  /** O que o leitor de tela ouve no botão, antes e depois de revelar. */
  labels?: { show: string; hide: string };
  /**
   * Classe por parte: `wrapper` (a moldura, o mesmo no de `className`), `input`
   * (o campo) e `action` (o botao do olho).
   */
  classNames?: Slots<"wrapper" | "input" | "action">;
};

function EyeIcon({ crossed }: { crossed: boolean }) {
  return (
    <View className="h-5 w-6 items-center justify-center">
      <View className="h-3 w-5 rounded-pill border-[1.5px] border-fg-muted" />
      <View className="absolute size-1.5 rounded-pill bg-fg-muted" />
      {crossed && <View className="absolute h-[1.5px] w-6 rotate-45 rounded-pill bg-fg-muted" />}
    </View>
  );
}

export function PasswordInput({
  labels = { show: "Mostrar senha", hide: "Esconder senha" },
  onBlur,
  className,
  classNames,
  ...props
}: PasswordInputProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <InputGroup
      autoCapitalize="none"
      autoCorrect={false}
      textContentType="password"
      {...props}
      className={cn(className, classNames?.wrapper)}
      classNames={{ input: classNames?.input, action: classNames?.action }}
      secureTextEntry={!revealed}
      onBlur={(event) => {
        setRevealed(false);
        onBlur?.(event);
      }}
      actions={[
        {
          label: revealed ? labels.hide : labels.show,
          onPress: () => setRevealed((current) => !current),
          children: <EyeIcon crossed={revealed} />,
        },
      ]}
    />
  );
}
