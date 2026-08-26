/**
 * O gancho de estilo por parte.
 *
 * `className` veste a raiz, e ate aqui era so isso: abaixo dela cada peca era
 * no selado. A trilha do `Progress`, o pino do `Slider`, a marca do
 * `Checkbox`, a linha do `DataTable` - nenhum tinha nome de fora. O contorno
 * que sobrava era a variante arbitraria de descendente, `[&_tbody_tr]`, e ela
 * e ruim de proposito: acopla o codigo de quem usa a arvore interna da peca,
 * entao uma `div` que vira `span` dentro da biblioteca quebra a tela de alguem
 * sem aviso e sem erro.
 *
 * O nome de cada parte e o mesmo que a secao "Partes" da pagina ja usa, entao
 * nao ha vocabulario novo para aprender:
 *
 * ```tsx
 * <Slider classNames={{ track: "bg-accent-subtle", thumb: "shadow-glow" }} />
 * <Dialog classNames={{ backdrop: "backdrop-blur-md" }} />
 * ```
 *
 * A regra que mantem o gesto saudavel e a mesma do `className`: token, nunca
 * cor literal.
 */
export type Slots<Parte extends string> = Partial<Record<Parte, string>>;
