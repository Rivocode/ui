export type ComponentEntry = {
  /** O nome exportado pelo pacote, como `DataTable`. */
  name: string;
  /** O nome em kebab, o mesmo do endereco `/componentes/<slug>.md` do site. */
  slug: string;
  /** A familia do catalogo, lida do frontmatter da pagina. */
  family: string;
  /** A primeira frase da pagina, sem marcacao. */
  summary: string;
  /** As partes que so existem dentro desta peca, como `CardHeader` no `Card`. */
  parts: string[];
};

export type Choice = {
  /** A situacao, como a tabela de escolha a escreve. */
  situation: string;
  /** As pecas citadas na coluna da peca certa, na ordem em que aparecem. */
  pieces: string[];
  /** A coluna do porque, crua. */
  why: string;
};

export type ParityRow = {
  /** A celula do meio da tabela de paridade, como `✔ traduz` ou `✕ não porta`. */
  state: string;
  /** A nota da tabela, em uma linha. */
  note: string;
};

export type NativeProp = { name: string; type: string; required: boolean };

export type Guide = {
  /** O nome que `get_guide` aceita. */
  slug: string;
  /** O titulo publicado. */
  title: string;
  /** Uma linha sobre o guia. */
  summary: string;
  /** O caminho dentro de `files`. */
  path: string;
};

export type Content = {
  /** As versoes dos dois pacotes cuja documentacao foi empacotada. */
  generatedFrom: { web: string; native: string };
  /** Todo markdown que o site entrega a agents, por caminho. */
  files: Record<string, string>;
  /** As pecas do catalogo, sem as partes. */
  components: ComponentEntry[];
  /** Cada parte e a peca que a compoe. */
  parts: Record<string, string>;
  /** A secao "Quando nao usar" de cada peca que tem uma. */
  avoid: Record<string, string>;
  /** A tabela de escolha de `reference/components.md`, linha a linha. */
  choices: Choice[];
  /** A linha de paridade com o React Native de cada peca. */
  parity: Record<string, ParityRow>;
  /** O cabecalho da tabela de assinatura nativa. */
  signatureHeader: string;
  /** As linhas da tabela de assinatura nativa, por peca do web. */
  signature: Record<string, string[]>;
  /** As props de cada peca do pacote nativo. */
  nativeProps: Record<string, { entry: string; props: NativeProp[] }>;
  /** Os arquivos DTCG dos tokens da casa, por nome. */
  tokens: Record<string, unknown>;
  /** Os guias que `get_guide` serve. */
  guides: Guide[];
};
