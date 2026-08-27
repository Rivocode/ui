import { FileText } from "lucide-react";
import { createRoot } from "react-dom/client";

import { useState } from "react";

import {
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  Field,
  FieldLabel,
  InputGroup,
  InputPrefix,
  InputSuffix,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  MaskedInput,
  Pagination,
  RivoProvider,
  SearchInput,
  TagsInput,
  Tree,
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  TreeSelect,
  type TreeNode,
  type RivoTheme,
} from "../src/index";

const CUSTOMERS = [
  { value: "clinica", label: "Clinica Sao Lucas" },
  { value: "transportes", label: "Transportes Cabo Branco" },
  { value: "supermercado", label: "Supermercado Tambau" },
  { value: "construtora", label: "Construtora Litoral" },
  { value: "escola", label: "Escola Monteiro" },
];

const SECTORS: TreeNode[] = [
  {
    id: "financeiro",
    label: "Financeiro",
    children: [
      { id: "contas-pagar", label: "Contas a pagar" },
      { id: "contas-receber", label: "Contas a receber" },
    ],
  },
  {
    id: "operacao",
    label: "Operacao",
    children: [
      { id: "expedicao", label: "Expedicao" },
      { id: "estoque", label: "Estoque" },
    ],
  },
];

const INVOICES = [
  { numero: "4813", cliente: "Clinica Sao Lucas", value: "R$ 2.480,00", situacao: "Paga" },
  { numero: "4814", cliente: "Transportes Cabo Branco", value: "R$ 940,00", situacao: "Aberta" },
  { numero: "4815", cliente: "Supermercado Tambau", value: "R$ 12.300,00", situacao: "Aberta" },
];

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section data-rc-shot={title} className="flex flex-col gap-3">
      <p className="font-mono text-xs tracking-widest text-fg-subtle uppercase">{title}</p>
      {children}
    </section>
  );
}

function Sample({ theme }: { theme: RivoTheme }) {
  const [page, setPage] = useState(3);
  const [sectors, setSectors] = useState<string[]>(["contas-pagar", "contas-receber"]);
  const [search, setSearch] = useState("Clinica");
  const [tags, setTags] = useState(["nf-e", "urgente", "prefeitura"]);

  return (
    <RivoProvider scope="local" theme={theme} className="min-h-[860px] p-8">
      <p className="mb-8 font-mono text-xs tracking-widest text-fg-subtle uppercase">{theme}</p>

      <div className="flex flex-col gap-10 sm:flex-row sm:flex-wrap sm:gap-x-16">
        <div className="flex w-full max-w-96 flex-col gap-10">
          <Block title="Caminho">
            <Breadcrumb
              items={[
                { label: "Inicio", href: "#" },
                { label: "Clientes", href: "#" },
                { label: "Clinica Sao Lucas", href: "#" },
                { label: "Notas", href: "#" },
                { label: "4813" },
              ]}
            />
          </Block>

          <Block title="Busca">
            <SearchInput placeholder="Buscar nota ou cliente" aria-label="Buscar nota ou cliente" />
            <SearchInput placeholder="Buscar em tudo" aria-label="Buscar em tudo" shortcut="mod+k" />
            <SearchInput
              size="sm"
              placeholder="Buscar cliente"
              aria-label="Buscar cliente"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onClear={() => setSearch("")}
            />
          </Block>

          <Block title="Campos com mascara">
            <Field>
              <FieldLabel>CNPJ</FieldLabel>
              <MaskedInput mask="cnpj" defaultValue="12345678000199" />
            </Field>
            <Field>
              <FieldLabel>Telefone</FieldLabel>
              <MaskedInput mask="telefone" defaultValue="83988112233" />
            </Field>
          </Block>

          <Block title="Campo com encosto">
            <InputGroup>
              <InputPrefix>R$</InputPrefix>
              <MaskedInput mask="moeda" defaultValue="248000" />
            </InputGroup>

            <InputGroup>
              <MaskedInput mask="" placeholder="minha-empresa" />
              <InputSuffix>.rivocode.com</InputSuffix>
            </InputGroup>
          </Block>
        </div>

        <div className="flex w-full max-w-[26rem] flex-col gap-10">
          <Block title="Abas que rolam de lado">
            <Tabs defaultValue="todas">
              <TabList>
                <Tab value="todas">Todas</Tab>
                <Tab value="abertas">Abertas</Tab>
                <Tab value="pagas">Pagas</Tab>
                <Tab value="vencidas">Vencidas</Tab>
                <Tab value="canceladas">Canceladas</Tab>
                <Tab value="rascunhos">Rascunhos</Tab>
              </TabList>

              <TabPanel value="todas">
                <div className="flex flex-col">
                  {INVOICES.map((nota) => (
                    <Item key={nota.numero}>
                      <ItemMedia>
                        <FileText size={18} aria-hidden="true" />
                      </ItemMedia>
                      <ItemContent>
                        <ItemTitle>Nota {nota.numero}</ItemTitle>
                        <ItemDescription>{nota.cliente}</ItemDescription>
                      </ItemContent>
                      <ItemActions>
                        <Badge tone={nota.situacao === "Paga" ? "success" : "neutral"}>
                          {nota.situacao}
                        </Badge>
                      </ItemActions>
                    </Item>
                  ))}
                </div>
              </TabPanel>
            </Tabs>
          </Block>

          <Block title="Linha com moldura">
            <Item variant="outline" interactive>
              <ItemMedia>
                <Avatar fallback="CS" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Clinica Sao Lucas</ItemTitle>
                <ItemDescription>12.345.678/0001-99</ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button variant="ghost" size="sm">
                  Abrir
                </Button>
              </ItemActions>
            </Item>
          </Block>

          <Block title="Busca em lista longa">
            <Combobox items={CUSTOMERS}>
              <ComboboxInput placeholder="Buscar cliente" />
              <ComboboxContent emptyMessage="Nenhum cliente com esse nome.">
                <ComboboxList>
                  {(item: (typeof CUSTOMERS)[number]) => (
                    <ComboboxItem key={item.value} value={item}>
                      {item.label}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </Block>

          <Block title="Escolha em arvore">
            <TreeSelect
              items={SECTORS}
              value={sectors}
              onValueChange={setSectors}
              placeholder="Escolha os setores"
            />
          </Block>

          <Block title="Arvore solta">
            <Tree
              items={SECTORS}
              value={sectors}
              onValueChange={setSectors}
              expanded={["financeiro", "operacao"]}
              multiple
            />
          </Block>

          <Block title="Marcadores">
            <TagsInput value={tags} onValueChange={setTags} placeholder="Escreva e tecle Enter" />
          </Block>

          <Block title="Paginacao">
            <Pagination page={page} pageCount={12} onPageChange={setPage} />
          </Block>
        </div>
      </div>
    </RivoProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <div>
    <Sample theme="rivocode-dark" />
    <Sample theme="rivocode-light" />
  </div>,
);
