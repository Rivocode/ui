import { useState } from "react";
import { View } from "react-native";

import { InputGroup, type InputGroupProps } from "./input-group";

export type PasswordInputProps = Omit<
  InputGroupProps,
  "actions" | "prefix" | "suffix" | "secureTextEntry"
> & {
  /** O que o leitor de tela ouve no botão, antes e depois de revelar. */
  labels?: { show: string; hide: string };
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
  ...props
}: PasswordInputProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <InputGroup
      autoCapitalize="none"
      autoCorrect={false}
      textContentType="password"
      {...props}
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
