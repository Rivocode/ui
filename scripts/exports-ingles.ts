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

const NAMES: Record<string, string> = {
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

const FOLDER = ".design-sync/previews";
let mexidos = 0;
let swaps = 0;

for (const file of readdirSync(FOLDER)) {
  if (!file.endsWith(".tsx")) continue;

  const path = `${FOLDER}/${file}`;
  const before = readFileSync(path, "utf8");

  // O que o arquivo importa nao pode virar nome de export dele: `LineChart`
  // como titulo de exemplo apagaria o `LineChart` da Recharts logo acima.
  const imported = new Set(
    [...before.matchAll(/import\s*\{([^}]*)\}/g)].flatMap((found) =>
      found[1]
        .split(",")
        .map((part) => part.replace("type ", "").split(" as ").pop()!.trim())
        .filter(Boolean),
    ),
  );

  const after = before.replace(/export function (\w+)\(/g, (whole, name: string) => {
    const next = NAMES[name];
    if (!next) return whole;
    if (imported.has(next)) {
      console.warn(`  ${file}: ${next} colide com um import, mantido ${name}`);
      return whole;
    }
    swaps++;
    return `export function ${next}(`;
  });

  if (after !== before) {
    writeFileSync(path, after);
    mexidos++;
  }
}

console.log(`${swaps} export(s) renomeado(s) em ${mexidos} arquivo(s).`);
