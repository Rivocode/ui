/**
 * Renomeia os exports dos previews para ingles.
 *
 * O nome do export e identificador de JavaScript, e o codigo desta biblioteca
 * e escrito em ingles. Ate agora ele tambem era o titulo mostrado no site, o
 * que prendia os dois na mesma palavra; com o `/** ... *\/` de titulo em cima
 * de cada exemplo, o que a pessoa le passou a vir do comentario, e o nome
 * ficou livre.
 *
 * A troca e por palavra inteira, dentro de cada arquivo. Um preview nao
 * importa outro, entao nao ha referencia cruzada para acertar.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";

const NOMES: Record<string, string> = {
  Aberto: "Open",
  AcoesDaLinha: "RowActions",
  AvisoDeSucesso: "SuccessNotice",
  Barra: "Bars",
  Basico: "Basic",
  BuscaComTextoLivre: "FreeTextSearch",
  BuscaEmLista: "SearchInList",
  BuscaSemResultado: "SearchWithNoResult",
  Caminho: "Path",
  Cancelamento: "Cancelling",
  Capacidade: "Capacity",
  Carregando: "Loading",
  Cartao: "AsCard",
  ComAbaDesabilitada: "WithDisabledTab",
  ComDados: "WithData",
  ComDuasSeries: "TwoSeries",
  ComErro: "WithError",
  ComMoldura: "WithFrame",
  ComReticencia: "WithEllipsis",
  ComRotulo: "WithLabel",
  ComValorFormatado: "WithFormattedValue",
  ComoLink: "AsLink",
  Completo: "Full",
  Confirmacao: "Confirmation",
  DataUnica: "SingleDate",
  DentroDeBotao: "InsideAButton",
  DentroDeCampo: "InsideAField",
  Desabilitado: "Disabled",
  Dobrado: "Folded",
  Elevacoes: "Elevations",
  EmBotaoDeIcone: "OnAnIconButton",
  EmLink: "OnALink",
  EmitirNota: "IssueInvoice",
  Encostos: "Edges",
  Endereco: "Address",
  Erro: "Error",
  Escolhido: "Selected",
  EstadoMisto: "MixedState",
  Estados: "States",
  Faixa: "Range",
  Fechada: "Closed",
  Fechado: "ClosedState",
  FolhaDeBaixo: "BottomSheet",
  FormaDePagamento: "PaymentMethod",
  FormasAceitas: "AcceptedMethods",
  Formatacao: "Formatting",
  Horizontal: "Horizontal",
  Intervalo: "DateRange",
  Lateral: "SideSheet",
  // `LineChart` colidiria com o import da Recharts no mesmo arquivo.
  Linha: "AsLine",
  LinhaDeLista: "ListRow",
  LinhasDeTabela: "TableRows",
  ListaCurta: "ShortList",
  ListaLonga: "LongList",
  Listagem: "Listing",
  ModoDeExibicao: "ViewMode",
  Moldes: "Masks",
  NaLinhaDaTabela: "InATableRow",
  NoMeio: "InTheMiddle",
  Painel: "Panel",
  Perguntas: "Questions",
  Periodo: "Period",
  Preenchido: "Filled",
  PrimeiroUso: "FirstRun",
  Principal: "Primary",
  SelecionarTodas: "SelectAll",
  Tamanhos: "Sizes",
  Tons: "Tones",
  TopoDeSite: "SiteHeader",
  TresSeries: "ThreeSeries",
  Variantes: "Variants",
  Vazio: "Empty",
  Vertical: "Vertical",
};

const PASTA = ".design-sync/previews";
let mexidos = 0;
let trocas = 0;

for (const arquivo of readdirSync(PASTA)) {
  if (!arquivo.endsWith(".tsx")) continue;

  const caminho = `${PASTA}/${arquivo}`;
  const antes = readFileSync(caminho, "utf8");

  // O que o arquivo importa nao pode virar nome de export dele: `LineChart`
  // como titulo de exemplo apagaria o `LineChart` da Recharts logo acima.
  const importados = new Set(
    [...antes.matchAll(/import\s*\{([^}]*)\}/g)].flatMap((achado) =>
      achado[1]
        .split(",")
        .map((parte) => parte.replace("type ", "").split(" as ").pop()!.trim())
        .filter(Boolean),
    ),
  );

  const depois = antes.replace(/export function (\w+)\(/g, (inteiro, nome: string) => {
    const novo = NOMES[nome];
    if (!novo) return inteiro;
    if (importados.has(novo)) {
      console.warn(`  ${arquivo}: ${novo} colide com um import, mantido ${nome}`);
      return inteiro;
    }
    trocas++;
    return `export function ${novo}(`;
  });

  if (depois !== antes) {
    writeFileSync(caminho, depois);
    mexidos++;
  }
}

console.log(`${trocas} export(s) renomeado(s) em ${mexidos} arquivo(s).`);
