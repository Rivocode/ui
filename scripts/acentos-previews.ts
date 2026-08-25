/**
 * Restaura acento no texto que aparece na tela dos previews.
 *
 * Os arquivos de `.design-sync/previews` nasceram em ASCII, porque o pacote de
 * sync era gerado por outra ferramenta. Agora eles alimentam tambem o site,
 * onde "Modo de exibicao" e "Nao marcada" aparecem para quem le.
 *
 * O que este script NAO faz: adivinhar. Ele so troca palavras de uma lista
 * fechada, e so dentro do texto que vira conteudo. Identificador, nome de
 * prop, chave de objeto e valor de `mask` ou `value` ficam intocados, porque
 * uma dessas trocas quebra o codigo em silencio.
 *
 * A licao veio de uma tentativa anterior, mais esperta, que acentuou uma URL
 * dentro de um link de markdown e derrubou a pagina.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";

const DICIONARIO: Record<string, string> = {
  acao: "ação",
  acoes: "ações",
  alteracao: "alteração",
  alteracoes: "alterações",
  ambito: "âmbito",
  aplicacao: "aplicação",
  aprovacao: "aprovação",
  apos: "após",
  area: "área",
  ate: "até",
  atencao: "atenção",
  automatico: "automático",
  basico: "básico",
  botao: "botão",
  calendario: "calendário",
  cartao: "cartão",
  clinica: "clínica",
  codigo: "código",
  conciliacao: "conciliação",
  condicoes: "condições",
  confirmacao: "confirmação",
  copia: "cópia",
  credito: "crédito",
  debito: "débito",
  descricao: "descrição",
  diagnostico: "diagnóstico",
  disponivel: "disponível",
  dinamico: "dinâmico",
  elevacao: "elevação",
  elevacoes: "elevações",
  emissao: "emissão",
  endereco: "endereço",
  entao: "então",
  expedicao: "expedição",
  facil: "fácil",
  formatacao: "formatação",
  formulario: "formulário",
  grafico: "gráfico",
  historico: "histórico",
  impossivel: "impossível",
  indisponivel: "indisponível",
  inicio: "início",
  integracao: "integração",
  invalido: "inválido",
  italico: "itálico",
  ja: "já",
  joao: "João",
  logico: "lógico",
  maximo: "máximo",
  medio: "médio",
  mes: "mês",
  minimo: "mínimo",
  movel: "móvel",
  nao: "não",
  navegacao: "navegação",
  level: "nível",
  numero: "número",
  observacao: "observação",
  obrigatorio: "obrigatório",
  operacao: "operação",
  padrao: "padrão",
  pagina: "página",
  pais: "país",
  periodo: "período",
  possivel: "possível",
  next: "próximo",
  publico: "público",
  rapido: "rápido",
  razao: "razão",
  relatorio: "relatório",
  responsavel: "responsável",
  revisao: "revisão",
  sao: "São",
  output: "saída",
  sensivel: "sensível",
  serie: "série",
  servico: "serviço",
  servicos: "serviços",
  situacao: "situação",
  situacoes: "situações",
  substituicao: "substituição",
  tambem: "também",
  tecnico: "técnico",
  titulo: "título",
  tres: "três",
  isLast: "último",
  unica: "única",
  unico: "único",
  usuario: "usuário",
  util: "útil",
  valido: "válido",
  visivel: "visível",
  voce: "você",
};

/** Props cujo valor a pessoa le. `mask`, `value` e `name` ficam de fora. */
const PROPS_DE_TEXTO = new Set([
  "placeholder",
  "label",
  "title",
  "description",
  "emptyMessage",
  "aria-label",
  "alt",
  "header",
  "thumbLabel",
  "errorMessage",
]);

/** Chaves de objeto cujo valor a pessoa le. */
const CHAVES_DE_TEXTO = new Set([
  "label",
  "header",
  "title",
  "description",
  "placeholder",
  "emptyMessage",
]);

function acentuar(text: string) {
  return text.replace(/\p{L}+/gu, (palavra) => {
    const alvo = DICIONARIO[palavra.toLowerCase()];
    if (!alvo) return palavra;

    // Preserva a caixa da primeira letra. Uma palavra TODA EM CAIXA ALTA e
    // quase sempre constante de codigo, entao ela fica como esta.
    if (palavra === palavra.toUpperCase() && palavra.length > 1) return palavra;
    if (palavra[0] === palavra[0].toUpperCase()) {
      return alvo[0].toUpperCase() + alvo.slice(1);
    }
    return alvo[0].toLowerCase() + alvo.slice(1);
  });
}

/**
 * As faixas que viram conteudo: texto entre tags, valor de prop de texto,
 * valor de chave de texto e comentario de documentacao.
 */
const FAIXAS: RegExp[] = [
  // Texto de JSX. `{` e `}` de fora, porque ali dentro e expressao.
  />([^<>{}]*[A-Za-z][^<>{}]*)</g,
  // prop="texto" e prop={'texto'}
  new RegExp(`\\b(?:${[...PROPS_DE_TEXTO].join("|")})=\\{?["'\`]([^"'\`]*)["'\`]`, "g"),
  // chave: "texto"
  new RegExp(`\\b(?:${[...CHAVES_DE_TEXTO].join("|")}):\\s*["'\`]([^"'\`]*)["'\`]`, "g"),
  // Comentario de documentacao.
  /\/\*\*([\s\S]*?)\*\//g,
];

function processar(fonte: string) {
  let output = fonte;

  for (const faixa of FAIXAS) {
    output = output.replace(faixa, (whole, dentro: string) => {
      const trocado = acentuar(dentro);
      if (trocado === dentro) return whole;
      // Reconstroi trocando so a parte capturada, para nao mexer nas aspas
      // nem nos sinais em volta.
      const at = whole.indexOf(dentro);
      return whole.slice(0, at) + trocado + whole.slice(at + dentro.length);
    });
  }

  return output;
}

const PASTA = ".design-sync/previews";
let mexidos = 0;

for (const arquivo of readdirSync(PASTA)) {
  if (!arquivo.endsWith(".tsx")) continue;

  const caminho = `${PASTA}/${arquivo}`;
  const antes = readFileSync(caminho, "utf8");
  const depois = processar(antes);

  if (depois !== antes) {
    writeFileSync(caminho, depois);
    mexidos++;
    console.log(`acentuado ${arquivo}`);
  }
}

console.log(`\n${mexidos} arquivo(s) mexido(s).`);
