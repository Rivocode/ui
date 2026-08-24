import { FileText } from "lucide-react";
import { createRoot } from "react-dom/client";

import {
  Badge,
  Button,
  DataTable,
  Field,
  FieldLabel,
  Input,
  RivoProvider,
  Steps,
  useWizard,
  WizardFooter,
  type Column,
  type Step,
  type RivoTheme,
} from "../src/index";

type Nota = { id: string; numero: string; cliente: string; valor: string; situacao: string };

const NOTAS: Nota[] = [
  { id: "1", numero: "4813", cliente: "Clinica Sao Lucas", valor: "R$ 2.480,00", situacao: "Paga" },
  {
    id: "2",
    numero: "4814",
    cliente: "Transportes Cabo Branco",
    valor: "R$ 940,00",
    situacao: "Aberta",
  },
  {
    id: "3",
    numero: "4815",
    cliente: "Supermercado Tambau",
    valor: "R$ 12.300,00",
    situacao: "Aberta",
  },
];

const COLUNAS: Column<Nota>[] = [
  { key: "numero", header: "Numero" },
  { key: "cliente", header: "Cliente" },
  { key: "valor", header: "Valor", align: "right", hideOnMobile: true },
  {
    key: "situacao",
    header: "Situacao",
    align: "right",
    cell: (nota) => (
      <Badge tone={nota.situacao === "Paga" ? "success" : "neutral"}>{nota.situacao}</Badge>
    ),
  },
];

const PASSOS: Step[] = [
  { id: "cliente", title: "Cliente", description: "Quem recebe" },
  { id: "servico", title: "Servico", description: "O que foi feito" },
  { id: "revisao", title: "Revisao", description: "Conferir e emitir" },
];

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <p className="font-mono text-xs tracking-widest text-fg-subtle uppercase">{titulo}</p>
      {children}
    </section>
  );
}

function Assistente() {
  const assistente = useWizard(PASSOS);

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <Steps steps={PASSOS} current={assistente.passo} onStepClick={assistente.irPara} />

      <div className="mt-6 flex flex-col gap-4">
        {assistente.passo === 0 && (
          <Field>
            <FieldLabel>Cliente</FieldLabel>
            <Input defaultValue="Clinica Sao Lucas" />
          </Field>
        )}
        {assistente.passo === 1 && (
          <Field>
            <FieldLabel>Descricao do servico</FieldLabel>
            <Input placeholder="Consultoria de agosto" />
          </Field>
        )}
        {assistente.passo === 2 && (
          <p className="text-base text-fg-muted">
            Nota para Clinica Sao Lucas, no valor de R$ 2.480,00.
          </p>
        )}
      </div>

      <WizardFooter>
        <Button variant="ghost" disabled={assistente.primeiro} onClick={assistente.voltar}>
          Voltar
        </Button>
        {assistente.ultimo ? (
          <Button>Emitir nota</Button>
        ) : (
          <Button onClick={() => assistente.avancar()}>Avancar</Button>
        )}
      </WizardFooter>
    </div>
  );
}

function Amostra({ theme }: { theme: RivoTheme }) {
  return (
    <RivoProvider scope="local" theme={theme} className="min-h-[900px] p-8">
      <p className="mb-8 font-mono text-xs tracking-widest text-fg-subtle uppercase">{theme}</p>

      <div className="flex flex-col gap-10">
        <Bloco titulo="Com dados">
          <DataTable
            data={NOTAS}
            columns={COLUNAS}
            rowKey={(nota) => nota.id}
            empty={{ title: "Nenhuma nota", description: "Emita a primeira." }}
          />
        </Bloco>

        <div className="flex flex-col gap-10 sm:flex-row sm:gap-x-12">
          <div className="flex-1">
            <Bloco titulo="Carregando">
              <DataTable
                data={undefined}
                columns={COLUNAS}
                rowKey={(nota) => nota.id}
                skeletonRows={3}
              />
            </Bloco>
          </div>

          <div className="flex-1">
            <Bloco titulo="Erro">
              <DataTable
                data={undefined}
                isError
                onRetry={() => {}}
                errorMessage="A prefeitura nao respondeu. Tente de novo em alguns minutos."
                columns={COLUNAS}
                rowKey={(nota) => nota.id}
              />
            </Bloco>

            <div className="mt-8">
              <Bloco titulo="Vazio">
                <DataTable<Nota>
                  data={[]}
                  columns={COLUNAS}
                  rowKey={(nota) => nota.id}
                  empty={{
                    icon: <FileText size={24} aria-hidden="true" />,
                    title: "Nenhuma nota por aqui",
                    description: "Quando voce emitir a primeira, ela aparece nesta lista.",
                    action: <Button size="sm">Emitir nota</Button>,
                  }}
                />
              </Bloco>
            </div>
          </div>
        </div>

        <Bloco titulo="Formulario em etapas">
          <Assistente />
        </Bloco>
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
