"use client";

import { useEffect } from "react";

/**
 * Tira do alcance do teclado o que ja esta escondido do leitor de tela.
 *
 * Com um painel modal aberto, a Base UI marca o resto da pagina com
 * `aria-hidden="true"` e nada mais. Metade da barreira de pe e pior do que
 * nenhuma: medido no navegador, na segunda volta do Tab o foco alcancava
 * controle real da pagina de tras - o botao de busca da barra lateral, um link
 * de navegacao - e esse controle estava `aria-hidden`, entao o leitor de tela
 * se recusava a anuncia-lo. A pessoa dava Tab, o foco ia para algum lugar, e
 * nada era dito. Foco no nada. O Firefox passava, Chromium e WebKit falhavam,
 * porque cada motor trata foco em subarvore com `aria-hidden` a sua maneira.
 *
 * O `markOthers` da Base UI sabe aplicar `inert`, mas o `FloatingFocusManager`
 * so pede `ariaHidden`, e nao ha prop para pedir os dois. Entao a barreira e
 * completada aqui, espelhando exatamente quem ela escondeu: e o `aria-hidden`
 * que diz quais elementos sao o fundo, e isso mantem a regra dela valendo -
 * painel nao modal nao esconde ninguem, e aqui tambem nao inertiza ninguem.
 *
 * Por que um observador e nao uma varredura so: a Base UI esconde o fundo
 * alguns commits depois deste componente montar, quando o popup ja tem
 * elemento e o gerenciador de foco entra em cena. Varrer no efeito nao acha
 * nada - medido, `null` nas duas primeiras passadas. O observador tambem cobre
 * o caminho de volta: se o fundo deixa de estar escondido do leitor, ele volta
 * ao alcance do teclado no mesmo instante.
 */
export function InertBackground({ container }: { container: HTMLElement | null }) {
  useEffect(() => {
    // Sem container de portal nosso, o painel e a tarja dele sao filhos
    // diretos do `body` e ficam indistinguiveis do fundo. Inertizar a tarja
    // mataria o clique fora, que e como metade das pessoas fecha um painel.
    // Isto dura um commit: o container do Provider chega no primeiro efeito.
    if (!container) return;

    const body = container.ownerDocument.body;
    const marked = new Set<Element>();

    function sweep() {
      for (const child of Array.from(body.children)) {
        if (child === container) continue;

        if (child.getAttribute("aria-hidden") !== "true") {
          if (marked.has(child)) {
            child.removeAttribute("inert");
            marked.delete(child);
          }
          continue;
        }

        // O que ja estava inerte antes nao e nosso, e sair removendo na saida
        // devolveria ao teclado um pedaco da pagina que a aplicacao tinha
        // fechado de proposito. Vale tambem para dois paineis empilhados: quem
        // marcou primeiro desmarca por ultimo.
        if (marked.has(child) || child.hasAttribute("inert")) continue;

        child.setAttribute("inert", "");
        marked.add(child);
      }
    }

    sweep();

    const watcher = new MutationObserver(sweep);
    watcher.observe(body, { attributes: true, attributeFilter: ["aria-hidden"], subtree: true });

    return () => {
      watcher.disconnect();
      for (const child of marked) child.removeAttribute("inert");
    };
  }, [container]);

  return null;
}
