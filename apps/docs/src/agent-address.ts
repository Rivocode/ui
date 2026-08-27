/* ---------------------------------------------------------------------------
 * Onde uma peca mora, para quem le o markdown cru
 *
 * Parte nao ganha pagina propria. Ela ja e publicada inteira - prosa, props e o
 * exemplo que a monta - dentro da pagina da peca que a compoe, e a versao
 * avulsa nunca teve exemplo: nao ha o que demonstrar sobre um `CardHeader` sem
 * o `Card` em volta. Setenta e seis dos cento e cinquenta e sete arquivos eram
 * isso, e cada um custava a um agente um fetch que nao somava nada.
 *
 * Estas duas funcoes moram aqui, e nao dentro do plugin, para um teste poder
 * le-las sem construir o site antes. Teste que le `dist/` passa na maquina que
 * acabou de construir e falha na CI, que e o pior tipo: parece guarda e e cara
 * ou coroa.
 * ------------------------------------------------------------------------- */

/** `/componentes/card.md#cardheader` - a parte, dentro de quem a monta. */
export function addressOf(slug: string, part?: { name: string; ownerSlug: string }) {
  if (!part) return `/componentes/${slug}.md`
  return `/componentes/${part.ownerSlug}.md#${part.name.toLowerCase()}`
}

/** Uma linha do indice. Parte fica indentada sob a peca, e diz que e parte. */
export function indexLine(name: string, slug: string, owner?: { name: string; slug: string }) {
  if (!owner) return `- [${name}](${addressOf(slug)})`

  const address = addressOf(slug, { name, ownerSlug: owner.slug })
  return `  - [${name}](${address}), parte de ${owner.name}`
}

/**
 * O bilhete deixado no endereco antigo da parte.
 *
 * Um agente que guardou o link nao pode ser recebido com o vazio, entao o
 * endereco continua respondendo - com tres linhas que dizem o que aquilo e e
 * onde mora a coisa inteira.
 */
export function partNote(name: string, owner: { name: string; slug: string }) {
  return (
    `# ${name}\n\n${name} é parte de ${owner.name}, e é documentada na página ` +
    `dele, com a prosa, a tabela de props e o exemplo que monta as duas:\n\n` +
    `[/componentes/${owner.slug}.md](${addressOf(name, { name, ownerSlug: owner.slug })})\n`
  )
}
