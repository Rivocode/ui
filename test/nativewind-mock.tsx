/**
 * O nativewind que os testes das pecas nativas enxergam.
 *
 * O pacote real so existe no app de exemplo, e o que os testes medem nao e
 * ele: e se o provider entrega os papeis certos do tema. O dubl e passa os
 * filhos adiante e guarda as variaveis num host element, para o teste poder
 * ler o que o tema de cliente aplicou.
 */
import { createElement, type ReactNode } from "react";

export function VariableContextProvider({
  value,
  children,
}: {
  value: Record<string, string>;
  children: ReactNode;
}) {
  return createElement("VariableContextProvider", { value }, children);
}

export function vars(value: Record<string, string>) {
  return value;
}
