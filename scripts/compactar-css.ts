/**
 * Tira da CSS compilada o espaco em branco que nao significa nada, e so ele.
 *
 * Existe porque o `--minify` do Tailwind nao serve aqui, e foi medido em
 * 25/09/2026. Ele passa pelo lightningcss, que reescreve `rgb(15 17 19 / 0.1)`
 * como `#0f11131a`: o alfa vira um byte, 0,1 vira 26/255 = 0,102, e a linha da
 * tabela do `Gantt` saiu 230 em vez de 231 em cada canal - `cronograma.png`
 * mudou em 223 mil bytes de pixel. Pouco para o olho, e o bastante para o
 * contraste medido pelo `check:contrast` deixar de ser o contraste da tela. O
 * `--optimize` passa pelo mesmo caminho.
 *
 * O corte aqui e so de espaco em volta de `{`, `}` e `;`, e de espaco no comeco
 * e no fim de linha. Nenhum dos dois muda o que a CSS diz, com UMA condicao:
 * nao haver string nem comentario com `{`, `}`, `;` ou quebra de linha dentro.
 * Em vez de entender string, a funcao recusa a entrada que tiver uma - a CSS de
 * hoje nao tem, e o dia em que tiver e o dia de reescrever isto, e nao o de
 * publicar um `content` corrompido.
 *
 * Uso: bun run scripts/compactar-css.ts <caminho-da-css>
 */

const RISKY = /"[^"]*"|'[^']*'|\/\*[\s\S]*?\*\//g;

export function compactCss(css: string) {
  for (const hit of css.matchAll(RISKY)) {
    if (/[{};\n]/.test(hit[0])) {
      throw new Error(
        `compactCss: string ou comentario com { } ; ou quebra de linha, e o corte de espaco o corromperia: ${hit[0].slice(0, 80)}`,
      );
    }
  }
  return `${css
    .replace(/[ \t]*\n\s*/g, "\n")
    .replace(/\s*([{};])\s*/g, "$1")
    .trim()}\n`;
}

if (import.meta.main) {
  const path = process.argv[2];
  if (!path) {
    console.error("uso: bun run scripts/compactar-css.ts <caminho-da-css>");
    process.exit(1);
  }
  const before = await Bun.file(path).text();
  const after = compactCss(before);
  await Bun.write(path, after);
  console.log(`${path}: ${before.length} -> ${after.length} bytes sem espaco inutil.`);
}
