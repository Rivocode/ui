import { Download, Plus } from "lucide-react";
import { useRef, useState } from "react";
import { createRoot } from "react-dom/client";

import {
  Badge,
  Button,
  Card,
  Input,
  RivoProvider,
  Tour,
  type RivoDensity,
  type RivoTheme,
  type TourStep,
} from "../src/index";

const CUSTOMERS = [
  { name: "Padaria Aurora", document: "12.345.678/0001-90", status: "Ativo" },
  { name: "Transportes Cabo Branco", document: "98.765.432/0001-10", status: "Ativo" },
  { name: "Clinica Sao Lucas", document: "45.678.912/0001-33", status: "Em atraso" },
];

function TourSample({
  theme,
  density,
  interactive,
}: {
  theme: RivoTheme;
  density: RivoDensity;
  interactive?: boolean;
}) {
  const [open, setOpen] = useState(true);
  const [saved, setSaved] = useState(0);
  const exportRef = useRef<HTMLButtonElement>(null);

  const steps: TourStep[] = [
    {
      target: "#tour-novo",
      title: "Cadastre o primeiro cliente",
      description: "O cadastro pede só o CNPJ: razão social e endereço vêm da Receita.",
    },
    {
      target: "#tour-busca",
      title: "Ache pelo nome ou pelo CNPJ",
      description: "A busca aceita o número com ou sem pontuação.",
    },
    {
      target: exportRef,
      title: "Leve a lista para a planilha",
      description: "O arquivo sai em CSV, com as colunas que estiverem visíveis.",
      placement: "top",
    },
  ];

  return (
    <RivoProvider scope="local" theme={theme} density={density} className="min-h-screen p-8">
      <main className="mx-auto flex max-w-3xl flex-col gap-6">
        <h1 className="font-mono text-xs tracking-widest text-fg-subtle uppercase">
          {theme} / {density} / tour
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button id="tour-novo" onClick={() => setSaved((count) => count + 1)}>
            <Plus size={16} aria-hidden="true" />
            Novo cliente
          </Button>
          <Input
            id="tour-busca"
            aria-label="Buscar cliente"
            placeholder="Buscar por nome ou CNPJ"
            className="min-w-0 flex-1"
          />
        </div>
        <Card className="flex flex-col divide-y divide-border p-0">
          {CUSTOMERS.map((customer) => (
            <div key={customer.name} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-fg">{customer.name}</p>
                <p className="text-xs text-fg-muted">{customer.document}</p>
              </div>
              <Badge tone={customer.status === "Ativo" ? "success" : "warning"}>
                {customer.status}
              </Badge>
            </div>
          ))}
        </Card>
        <div className="flex items-center justify-between gap-2">
          <Button variant="secondary" onClick={() => setOpen(true)}>
            Fazer o tour
          </Button>
          <Button ref={exportRef} variant="ghost">
            <Download size={16} aria-hidden="true" />
            Exportar
          </Button>
        </div>
        <p className="text-sm text-fg-muted">Clientes criados nesta visita: {saved}</p>
      </main>
      <Tour
        steps={steps}
        open={open}
        onOpenChange={setOpen}
        defaultStep={1}
        interactive={interactive}
      />
    </RivoProvider>
  );
}

const root = createRoot(document.getElementById("root")!);
const view = window.location.hash.slice(1);

if (window.location.pathname.endsWith("tour-claro.html"))
  root.render(<TourSample theme="rivocode-light" density="compact" />);
else if (view === "interativo")
  root.render(<TourSample theme="rivocode-light" density="comfortable" interactive />);
else root.render(<TourSample theme="rivocode-dark" density="comfortable" />);
