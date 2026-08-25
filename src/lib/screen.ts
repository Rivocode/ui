"use client";

import { useSyncExternalStore } from "react";

/** O mesmo corte do `sm` do Tailwind, para o CSS e o JS concordarem. */
const PHONE = "(max-width: 639px)";

function subscribe(query: string) {
  return (notify: () => void) => {
    const media = window.matchMedia(query);
    media.addEventListener("change", notify);
    return () => media.removeEventListener("change", notify);
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
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    subscribe(query),
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Verdadeiro em largura de celular, abaixo do `sm` do Tailwind. */
export function useNarrowScreen(): boolean {
  return useMediaQuery(PHONE);
}
