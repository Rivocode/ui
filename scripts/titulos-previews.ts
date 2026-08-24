/**
 * Da um titulo escrito a cada exemplo dos previews.
 *
 * Sem isto o titulo vem do nome do export, e o nome do export e um
 * identificador de JavaScript: `ModoDeExibicao` vira "Modo de exibicao", sem
 * acento, porque acento nao entra em identificador.
 *
 * Com um `/** ... *\/` em cima da funcao, o site le o comentario e o
 * identificador volta a ser so codigo. E o que permite renomear os exports
 * para ingles depois sem mexer no que a pessoa le.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";

const ACENTOS: Record<string, string> = {
  acao: "ação", acoes: "ações", alteracao: "alteração", alteracoes: "alterações",
  aplicacao: "aplicação", aprovacao: "aprovação", area: "área", ate: "até",
  atencao: "atenção", automatico: "automático", basico: "básico", botao: "botão",
  calendario: "calendário", cartao: "cartão", clinica: "clínica", codigo: "código",
  conciliacao: "conciliação", condicoes: "condições", confirmacao: "confirmação",
  copia: "cópia", credito: "crédito", debito: "débito", descricao: "descrição",
  diagnostico: "diagnóstico", disponivel: "disponível", elevacao: "elevação",
  elevacoes: "elevações", emissao: "emissão", endereco: "endereço", entao: "então",
  exibicao: "exibição", expedicao: "expedição", facil: "fácil",
  formatacao: "formatação", formulario: "formulário", grafico: "gráfico",
  graficos: "gráficos", historico: "histórico", indisponivel: "indisponível",
  inicio: "início", integracao: "integração", invalido: "inválido",
  italico: "itálico", ja: "já", joao: "João", maximo: "máximo", medio: "médio",
  mes: "mês", meses: "meses", minimo: "mínimo", movel: "móvel", nao: "não",
  navegacao: "navegação", nivel: "nível", numero: "número", numerico: "numérico",
  observacao: "observação", obrigatorio: "obrigatório", operacao: "operação",
  padrao: "padrão", pagina: "página", pais: "país", periodo: "período",
  possivel: "possível", proximo: "próximo", publico: "público", rapido: "rápido",
  razao: "razão", relatorio: "relatório", responsavel: "responsável",
  reticencia: "reticência", rotulo: "rótulo", icone: "ícone", series: "séries", revisao: "revisão", sao: "São", saida: "saída",
  selecao: "seleção", sensivel: "sensível", serie: "série", servico: "serviço",
  servicos: "serviços", situacao: "situação", situacoes: "situações",
  substituicao: "substituição", tambem: "também", tecnico: "técnico",
  titulo: "título", tres: "três", ultimo: "último", unica: "única", unico: "único",
  usuario: "usuário", util: "útil", valido: "válido", visivel: "visível",
  voce: "você",
};

/** Palavras de ligacao ficam minusculas no meio do titulo. */
const LIGACOES = new Set([
  "de", "da", "do", "das", "dos", "e", "em", "no", "na", "com", "sem", "por",
  "para", "a", "o", "as", "os", "ao", "aos",
]);

function titulo(nomeDoExport: string) {
  const partes = nomeDoExport
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .split(" ")
    .filter(Boolean);

  const palavras = partes.map((parte, indice) => {
    const baixa = parte.toLowerCase();
    const acentuada = ACENTOS[baixa] ?? baixa;

    // Sigla escrita toda em caixa alta continua como esta: OTP, PDF, CNPJ.
    if (parte.length > 1 && parte === parte.toUpperCase()) return parte;

    if (indice > 0 && LIGACOES.has(baixa)) return acentuada;
    if (indice === 0) return acentuada[0].toUpperCase() + acentuada.slice(1);
    return acentuada;
  });

  return palavras.join(" ");
}

const PASTA = ".design-sync/previews";
let mexidos = 0;
let titulos = 0;

for (const arquivo of readdirSync(PASTA)) {
  if (!arquivo.endsWith(".tsx")) continue;

  const caminho = `${PASTA}/${arquivo}`;
  const antes = readFileSync(caminho, "utf8");

  const depois = antes.replace(
    /(^|\n)(export function (\w+)\()/g,
    (inteiro, quebra: string, declaracao: string, nome: string, at: number) => {
      // Ja tem comentario de documentacao logo acima? Entao ele manda.
      const anterior = antes.slice(0, at + quebra.length).trimEnd();
      if (anterior.endsWith("*/")) return inteiro;

      titulos++;
      return `${quebra}/** ${titulo(nome)} */\n${declaracao}`;
    },
  );

  if (depois !== antes) {
    writeFileSync(caminho, depois);
    mexidos++;
  }
}

console.log(`${titulos} titulo(s) escrito(s) em ${mexidos} arquivo(s).`);
