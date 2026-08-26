/**
 * O `id` de um titulo, e o `#` que aponta para ele.
 *
 * O acento cai primeiro: `Instalação` vira `instalacao`, que sobrevive a ser
 * colado num chat, num terminal ou numa mensagem de commit.
 */
export const anchor = (text: string) =>
  text
    .replace(/<[^>]+>/g, '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
