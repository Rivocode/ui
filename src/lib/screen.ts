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

/**
 * Verdadeiro em largura de celular, abaixo do `sm` do Tailwind.
 *
 * E o mesmo corte que a barra lateral usa para virar folha e que o calendario
 * usa para mostrar um mes so. Existe exportado para a aplicacao decidir junto,
 * em vez de escrever o proprio `640` num canto: quando cada tela guarda o seu
 * numero, uma delas muda e as duas metades passam a discordar sobre o que e
 * celular.
 *
 * ```tsx
 * const isMobile = useMobile();
 * return isMobile ? <Sheet>{filtros}</Sheet> : <aside>{filtros}</aside>;
 * ```
 *
 * Dentro de um `SidebarProvider`, prefira `useSidebar().isMobile`: e o mesmo
 * valor, e evita um segundo assinante da mesma media query.
 */
export function useMobile(): boolean {
  return useMediaQuery(PHONE);
}
