"use client";

import { useSyncExternalStore } from "react";

/** O mesmo corte do `sm` do Tailwind, para o CSS e o JS concordarem. */
const CELULAR = "(max-width: 639px)";

function assinar(consulta: string) {
  return (avisar: () => void) => {
    const media = window.matchMedia(consulta);
    media.addEventListener("change", avisar);
    return () => media.removeEventListener("change", avisar);
  };
}

/**
 * Responde a uma media query em JS.
 *
 * Existe para as decisoes que o CSS nao alcanca: quantos meses o calendario
 * mostra, se o painel vira folha de baixo. Layout continua sendo trabalho de
 * classe utilitaria, e nao deste hook.
 *
 * No servidor devolve `false`, e nao um palpite: a primeira pintura sai igual
 * a do desktop e se corrige no primeiro efeito, o que e melhor do que o
 * contrario, porque erro para o lado estreito quebra o layout largo.
 */
export function useMediaQuery(consulta: string): boolean {
  return useSyncExternalStore(
    assinar(consulta),
    () => window.matchMedia(consulta).matches,
    () => false,
  );
}

/** Verdadeiro em largura de celular, abaixo do `sm` do Tailwind. */
export function useTelaEstreita(): boolean {
  return useMediaQuery(CELULAR);
}
