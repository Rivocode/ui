"use client";

import { useState, type ComponentProps } from "react";

import { aplicarMascara, moldeDeTelefone, semMascara, type Mascara } from "../lib/mascara";
import { Input } from "./field";

export type MaskedInputProps = Omit<ComponentProps<typeof Input>, "onValueChange" | "value"> & {
  /** Nome de molde pronto, molde escrito na mao, ou `moeda`. */
  mask: Mascara;
  /** O texto ja com mascara, quando quem usa controla o estado. */
  value?: string;
  /** O texto inicial, quando o componente controla o proprio estado. */
  defaultValue?: string;
  /**
   * Chamado a cada tecla, com o texto mascarado e o cru. Guarde o cru: e ele
   * que o servidor entende, e a pontuacao e assunto de tela.
   */
  onValueChange?: (mascarado: string, cru: string) => void;
};

/**
 * Campo com mascara: CPF, CNPJ, telefone, CEP, cartao, placa, dinheiro, ou
 * qualquer molde escrito na mao.
 *
 * A mascara e do campo e nao do valor: quem recebe a mudanca leva as duas
 * versoes, e decide qual guardar. Guardar o texto pontuado no banco e o erro
 * classico, porque a pontuacao muda com o tempo e o dado deixa de bater.
 *
 * O telefone e o unico que troca de molde no meio da digitacao, porque o fixo
 * tem oito casas e o celular nove. Sem isso, o fixo fica com a pontuacao do
 * celular ate o ultimo digito.
 */
export function MaskedInput({
  mask,
  value,
  defaultValue = "",
  onValueChange,
  onChange,
  inputMode,
  ...props
}: MaskedInputProps) {
  const controlado = value !== undefined;
  const [interno, setInterno] = useState(() => aplicarMascara(defaultValue, mask));
  const texto = controlado ? value : interno;

  const soNumero = mask === "moeda" || /^[9\W]+$/.test(String(mask)) || mask in MOLDES_NUMERICOS;

  return (
    <Input
      {...props}
      value={texto}
      inputMode={inputMode ?? (soNumero ? "numeric" : undefined)}
      onChange={(evento) => {
        const cru = evento.target.value;
        const molde = mask === "telefone" ? moldeDeTelefone(cru) : mask;
        const mascarado = aplicarMascara(cru, molde);

        if (!controlado) setInterno(mascarado);
        onValueChange?.(mascarado, semMascara(mascarado));
        onChange?.(evento);
      }}
    />
  );
}

/** Moldes que so aceitam digito, para o teclado do celular abrir em numeros. */
const MOLDES_NUMERICOS = {
  cpf: true,
  cnpj: true,
  cep: true,
  data: true,
  hora: true,
  cartao: true,
  telefone: true,
} as const;
