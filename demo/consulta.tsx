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

type Invoice = { id: string; numero: string; cliente: string; value: string; situacao: string };

const INVOICES: Invoice[] = [
  { id: "1", numero: "4813", cliente: "Clinica Sao Lucas", value: "R$ 2.480,00", situacao: "Paga" },
  {
    id: "2",
    numero: "4814",
    cliente: "Transportes Cabo Branco",
    value: "R$ 940,00",
    situacao: "Aberta",
  },
  {
    id: "3",
    numero: "4815",
    cliente: "Supermercado Tambau",
    value: "R$ 12.300,00",
    situacao: "Aberta",
  },
];

const COLUMNS: Column<Invoice>[] = [
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

function Block({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <p className="font-mono text-xs tracking-widest text-fg-subtle uppercase">{titulo}</p>
      {children}
    </section>
  );
}

function Wizard() {
  const wizard = useWizard(PASSOS);

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <Steps steps={PASSOS} current={wizard.step} onStepClick={wizard.goTo} />

      <div className="mt-6 flex flex-col gap-4">
        {wizard.step === 0 && (
          <Field>
            <FieldLabel>Cliente</FieldLabel>
            <Input defaultValue="Clinica Sao Lucas" />
          </Field>
        )}
        {wizard.step === 1 && (
          <Field>
            <FieldLabel>Descricao do servico</FieldLabel>
            <Input placeholder="Consultoria de agosto" />
          </Field>
        )}
        {wizard.step === 2 && (
          <p className="text-base text-fg-muted">
            Invoice para Clinica Sao Lucas, no valor de R$ 2.480,00.
          </p>
        )}
      </div>

      <WizardFooter>
        <Button variant="ghost" disabled={wizard.isFirst} onClick={wizard.back}>
          Voltar
        </Button>
        {wizard.isLast ? (
          <Button>Emitir nota</Button>
        ) : (
          <Button onClick={() => wizard.next()}>Avancar</Button>
        )}
      </WizardFooter>
    </div>
  );
}

function Sample({ theme }: { theme: RivoTheme }) {
  return (
    <RivoProvider scope="local" theme={theme} className="min-h-[900px] p-8">
      <p className="mb-8 font-mono text-xs tracking-widest text-fg-subtle uppercase">{theme}</p>

      <div className="flex flex-col gap-10">
        <Block titulo="Com dados">
          <DataTable
            data={INVOICES}
            columns={COLUMNS}
            rowKey={(nota) => nota.id}
            empty={{ title: "Nenhuma nota", description: "Emita a primeira." }}
          />
        </Block>

        <div className="flex flex-col gap-10 sm:flex-row sm:gap-x-12">
          <div className="flex-1">
            <Block titulo="Carregando">
              <DataTable
                data={undefined}
                columns={COLUMNS}
                rowKey={(nota) => nota.id}
                skeletonRows={3}
              />
            </Block>
          </div>

          <div className="flex-1">
            <Block titulo="Erro">
              <DataTable
                data={undefined}
                isError
                onRetry={() => {}}
                errorMessage="A prefeitura nao respondeu. Tente de novo em alguns minutos."
                columns={COLUMNS}
                rowKey={(nota) => nota.id}
              />
            </Block>

            <div className="mt-8">
              <Block titulo="Vazio">
                <DataTable<Invoice>
                  data={[]}
                  columns={COLUMNS}
                  rowKey={(nota) => nota.id}
                  empty={{
                    icon: <FileText size={24} aria-hidden="true" />,
                    title: "Nenhuma nota por aqui",
                    description: "Quando voce emitir a primeira, ela aparece nesta lista.",
                    action: <Button size="sm">Emitir nota</Button>,
                  }}
                />
              </Block>
            </div>
          </div>
        </div>

        <Block titulo="Formulario em etapas">
          <Wizard />
        </Block>
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
