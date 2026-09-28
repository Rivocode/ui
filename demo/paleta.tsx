import { FileText, Plus, Settings, Users } from "lucide-react";
import { useState } from "react";
import { createRoot } from "react-dom/client";

import {
  Button,
  Command,
  Kbd,
  RivoProvider,
  type CommandGroup,
  type RivoDensity,
  type RivoTheme,
} from "../src/index";

const GROUPS: CommandGroup[] = [
  {
    label: "Ir para",
    items: [
      {
        id: "invoices",
        label: "Notas fiscais",
        keywords: "nf fatura boleto",
        icon: <FileText size={16} aria-hidden="true" />,
        onSelect: () => {},
      },
      {
        id: "customers",
        label: "Clientes",
        keywords: "cadastro",
        icon: <Users size={16} aria-hidden="true" />,
        onSelect: () => {},
      },
      {
        id: "settings",
        label: "Preferencias",
        icon: <Settings size={16} aria-hidden="true" />,
        onSelect: () => {},
      },
    ],
  },
  {
    label: "Criar",
    items: [
      {
        id: "new-invoice",
        label: "Nova nota fiscal",
        description: "Abre o formulario em branco",
        icon: <Plus size={16} aria-hidden="true" />,
        shortcut: "mod+n",
        onSelect: () => {},
      },
      {
        id: "new-customer",
        label: "Novo cliente",
        description: "Precisa do CNPJ e do endereco",
        icon: <Plus size={16} aria-hidden="true" />,
        onSelect: () => {},
        disabled: true,
      },
    ],
  },
];

function Sample({ theme, density }: { theme: RivoTheme; density: RivoDensity }) {
  const [open, setOpen] = useState(true);

  return (
    <RivoProvider scope="local" theme={theme} density={density} className="min-h-screen p-8">
      <p className="mb-8 font-mono text-xs tracking-widest text-fg-subtle uppercase">
        {theme} / {density}
      </p>

      <Button variant="secondary" onClick={() => setOpen(true)}>
        Buscar comando
        <Kbd size="sm" keys="mod+k" />
      </Button>
      <p className="mt-3 text-sm text-fg-subtle">Ou aperte o atalho, de qualquer lugar da tela.</p>

      <Command open={open} onOpenChange={setOpen} groups={GROUPS} />
    </RivoProvider>
  );
}

function Frames() {
  return (
    <div className="flex flex-col">
      <iframe
        src="./paleta.html#escuro"
        title="Paleta de comandos no tema escuro"
        className="h-[560px] w-full border-0"
      />
      <iframe
        src="./paleta.html#claro"
        title="Paleta de comandos no tema claro"
        className="h-[560px] w-full border-0"
      />
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
const view = window.location.hash.slice(1);

if (view === "escuro") root.render(<Sample theme="rivocode-dark" density="comfortable" />);
else if (view === "claro") root.render(<Sample theme="rivocode-light" density="compact" />);
else root.render(<Frames />);
