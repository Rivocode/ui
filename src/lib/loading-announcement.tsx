/* ---------------------------------------------------------------------------
 * O carregando das quatro irmas da consulta, dito em voz alta.
 *
 * `aria-busy="true"` num `<div>` sem papel nao e anunciado por leitor de tela
 * nenhum: ele descreve o estado de uma regiao, e so e lido por quem ja esta
 * dentro dela. Quem esperava ouvia silencio, e a chegada do dado - a tela
 * inteira trocando de conteudo - tambem nao dizia nada.
 *
 * A regiao tem que existir ANTES de o texto mudar. Montar o `role="status"` no
 * mesmo quadro em que o texto aparece nao dispara anuncio: o leitor observa a
 * mudanca de uma regiao que ja estava la, e nao a chegada da regiao. Por isso
 * ela nao mora dentro do galho do carregando - mora num no que atravessa os
 * finais da peca, e e por isso que as quatro a montam sempre.
 *
 * `data-rc-status` existe porque o `ChartContainer` tem duas regioes vivas: a
 * do ponto ativo, que ja existia, e esta. Sem a marca, teste e auditoria
 * pegariam a primeira `[role="status"]` que achassem.
 * ------------------------------------------------------------------------ */

/** O que se ouve enquanto a consulta nao volta. */
export const LOADING_ANNOUNCEMENT = "Carregando…";

/** O que se ouve quando ela volta, e a tela troca sem avisar ninguem. */
export const LOADED_ANNOUNCEMENT = "Conteúdo carregado";

export function LoadingAnnouncement({ loading }: { loading: boolean }) {
  return (
    <div role="status" aria-live="polite" data-rc-status="" className="sr-only">
      {loading ? LOADING_ANNOUNCEMENT : LOADED_ANNOUNCEMENT}
    </div>
  );
}
