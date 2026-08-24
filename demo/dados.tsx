import { FileText, Search } from "lucide-react";
import { useState } from "react";
import { createRoot } from "react-dom/client";

import {
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  Field,
  FieldLabel,
  InputAction,
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
  Tab,
  TabList,
  TabPanel,
  Tabs,
  type RivoTheme,
} from "../src/index";

const NOTAS = [
  { numero: "4813", cliente: "Clinica Sao Lucas", valor: "R$ 2.480,00", situacao: "Paga" },
  { numero: "4814", cliente: "Transportes Cabo Branco", valor: "R$ 940,00", situacao: "Aberta" },
  { numero: "4815", cliente: "Supermercado Tambau", valor: "R$ 12.300,00", situacao: "Aberta" },
];

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <p className="font-mono text-xs tracking-widest text-fg-subtle uppercase">{titulo}</p>
      {children}
    </section>
  );
}

function Amostra({ theme }: { theme: RivoTheme }) {
  const [pagina, setPagina] = useState(3);

  return (
    <RivoProvider scope="local" theme={theme} className="min-h-[860px] p-8">
      <p className="mb-8 font-mono text-xs tracking-widest text-fg-subtle uppercase">{theme}</p>

      <div className="flex flex-col gap-10 sm:flex-row sm:flex-wrap sm:gap-x-16">
        <div className="flex w-full max-w-96 flex-col gap-10">
          <Bloco titulo="Caminho">
            <Breadcrumb
              items={[
                { label: "Inicio", href: "#" },
                { label: "Clientes", href: "#" },
                { label: "Clinica Sao Lucas", href: "#" },
                { label: "Notas", href: "#" },
                { label: "4813" },
              ]}
            />
          </Bloco>

          <Bloco titulo="Campos com mascara">
            <Field>
              <FieldLabel>CNPJ</FieldLabel>
              <MaskedInput mask="cnpj" defaultValue="12345678000199" />
            </Field>
            <Field>
              <FieldLabel>Telefone</FieldLabel>
              <MaskedInput mask="telefone" defaultValue="83988112233" />
            </Field>
          </Bloco>

          <Bloco titulo="Campo com encosto">
            <InputGroup>
              <InputPrefix>R$</InputPrefix>
              <MaskedInput mask="moeda" defaultValue="248000" />
            </InputGroup>

            <InputGroup>
              <MaskedInput mask="" placeholder="Buscar nota ou cliente" />
              <InputAction aria-label="Buscar">
                <Search size={16} aria-hidden="true" />
              </InputAction>
            </InputGroup>

            <InputGroup>
              <MaskedInput mask="" placeholder="minha-empresa" />
              <InputSuffix>.rivocode.com</InputSuffix>
            </InputGroup>
          </Bloco>
        </div>

        <div className="flex w-full max-w-[26rem] flex-col gap-10">
          <Bloco titulo="Abas que rolam de lado">
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
                  {NOTAS.map((nota) => (
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
          </Bloco>

          <Bloco titulo="Linha com moldura">
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
          </Bloco>

          <Bloco titulo="Paginacao">
            <Pagination page={pagina} pageCount={12} onPageChange={setPagina} />
          </Bloco>
        </div>
      </div>
    </RivoProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <div>
    <Amostra theme="rivocode-dark" />
    <Amostra theme="rivocode-light" />
  </div>,
);
