/**
 * A heading's `id`, and the `#` that points to it.
 *
 * Accents go first: `Instalação` becomes `instalacao`, which survives being
 * pasted into a chat, a terminal or a commit message.
 */
export const anchor = (text: string) =>
  text
    .replace(/<[^>]+>/g, '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
