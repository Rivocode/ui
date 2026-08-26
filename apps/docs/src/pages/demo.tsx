import { DemoApp } from '@/demo/app'

/* ---------------------------------------------------------------------------
 * O endereco da demonstracao
 *
 * Uma pagina, e nao uma pagina sobre uma pagina. A aplicacao ocupa a janela
 * abaixo do cabecalho do site, sem introducao e sem moldura: a pergunta com que
 * alguem chega e se isto se sustenta como sistema, e um paragrafo explicando
 * isso atrapalha a unica coisa que responde.
 *
 * Tudo que interessa esta em `demo/`, escrito do jeito que alguem escreveria
 * uma tela de verdade com esta biblioteca.
 * ------------------------------------------------------------------------- */

export function DemoPage() {
  return <DemoApp />
}
