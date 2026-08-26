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

/**
 * O olho, desenhado com `View`: uma pálpebra arredondada, a íris no meio e o
 * risco de quando está revelado. Glyph de fonte não serve para ícone de
 * estado - a fonte muda de corpo entre iOS e Android e o traço não.
 */
function EyeIcon({ crossed }: { crossed: boolean }) {
  return (
    <View className="h-5 w-6 items-center justify-center">
      <View className="h-3 w-5 rounded-pill border-[1.5px] border-fg-muted" />
      <View className="absolute size-1.5 rounded-pill bg-fg-muted" />
      {crossed && (
        <View className="absolute h-[1.5px] w-6 rotate-45 rounded-pill bg-fg-muted" />
      )}
    </View>
  );
}

/**
 * Campo de senha com o olho que revela.
 *
 * Existe como peça pelo mesmo motivo do web - todo projeto reconstrói este
 * par, e reconstrói com o mesmo defeito, que é o botão dizer o estado em vez
 * da ação. "Senha visível" não diz o que acontece ao tocar; quem navega por
 * leitor de tela decide pelo verbo, e por isso o nome do botão troca junto
 * com o estado.
 *
 * Revelar é gesto momentâneo: sair do campo esconde de novo. Deixar a senha
 * na tela depois que a pessoa foi para outro lugar é o que faz alguém ser
 * lido por cima do ombro - e no celular o ombro está sempre mais perto.
 */
export function PasswordInput({
  labels = { show: "Mostrar senha", hide: "Esconder senha" },
  onBlur,
  ...props
}: PasswordInputProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <InputGroup
      // Antes do espalhamento: quem chama pode trocar qualquer uma delas. O
      // corretor precisa ficar de fora porque o teclado guardaria a senha no
      // dicionário do aparelho.
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
