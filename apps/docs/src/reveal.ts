/**
 * Traz um item para dentro da parte visível do container dele, sem mexer na
 * rolagem da página.
 *
 * `scrollIntoView` faria isto, mas ele acerta todos os ancestrais roláveis de
 * uma vez: a janela vai junto e o texto que a pessoa está lendo pula, mesmo
 * quando o container inteiro já estava na tela. As duas listas que usam isto
 * — a lateral e o índice — são exatamente esse caso: ficam paradas na tela e
 * rolam por dentro.
 *
 * A margem é a folga que fica sobrando antes e depois do item, para ele não
 * parar colado na borda, onde não dá para ver que a lista continua.
 */
export function revealWithin(container: HTMLElement, item: HTMLElement, margin = 24) {
  const view = container.getBoundingClientRect()
  const target = item.getBoundingClientRect()

  if (target.top < view.top + margin) {
    container.scrollTop -= view.top + margin - target.top
  } else if (target.bottom > view.bottom - margin) {
    container.scrollTop += target.bottom - (view.bottom - margin)
  }
}
