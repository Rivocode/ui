import { FileText, LayoutDashboard, Settings, Users } from "lucide-react";
import { createRoot } from "react-dom/client";

import {
  Badge,
  Button,
  RivoProvider,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHandle,
  SheetTitle,
  SheetTrigger,
  type RivoTheme,
  type SheetSide,
} from "../src/index";

const ITEMS = [
  { icon: LayoutDashboard, label: "Painel", ativo: true },
  { icon: FileText, label: "Notas fiscais", contagem: 4 },
  { icon: Users, label: "Clientes" },
  { icon: Settings, label: "Ajustes" },
];

function MenuLateral({ defaultOpen }: { defaultOpen: boolean }) {
  return (
    <Sheet side="left" defaultOpen={defaultOpen}>
      <SheetTrigger render={<Button variant="secondary" />}>Abrir menu</SheetTrigger>
      <SheetContent className="p-4">
        <SheetTitle className="px-2 text-lg">RivoCode</SheetTitle>
        <nav className="mt-4 flex flex-col gap-1">
          {ITEMS.map(({ icon: Icon, label, ativo, contagem }) => (
            <a
              key={label}
              href="#"
              aria-current={ativo ? "page" : undefined}
              className={
                "flex items-center gap-3 rounded-md px-2 py-2 text-base transition-colors " +
                "duration-[var(--rc-duration-fast)] ease-rc hover:bg-accent-subtle " +
                (ativo ? "bg-accent-subtle text-fg" : "text-fg-muted")
              }
            >
              <Icon size={16} aria-hidden="true" />
              <span className="flex-1">{label}</span>
              {contagem && <Badge>{contagem}</Badge>}
            </a>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

function BottomSheet({ defaultOpen }: { defaultOpen: boolean }) {
  return (
    <Sheet side="bottom" defaultOpen={defaultOpen}>
      <SheetTrigger render={<Button variant="secondary" />}>Acoes da nota</SheetTrigger>
      <SheetContent>
        <SheetHandle />
        <SheetTitle>Nota 4813</SheetTitle>
        <SheetDescription>Clinica Sao Lucas, vencimento em 05/08.</SheetDescription>
        <div className="mt-6 flex flex-col gap-2">
          <Button variant="secondary">Baixar PDF</Button>
          <Button variant="secondary">Duplicar</Button>
          <SheetClose render={<Button variant="ghost" />}>Cancelar</SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}

const LEGEND: Record<string, string> = {
  left: "folha lateral aberta",
  bottom: "folha de baixo aberta",
  "": "as duas folhas fechadas",
};

const LABEL = "mb-8 font-mono text-xs tracking-widest text-fg-subtle uppercase";

function Sample({ theme, open }: { theme: RivoTheme; open: SheetSide | "" }) {
  return (
    <RivoProvider scope="local" theme={theme} className="min-h-screen p-8">
      <p className={open === "left" ? `${LABEL} text-right` : LABEL}>
        {theme} / {LEGEND[open]}
      </p>
      <div className="flex flex-wrap gap-3">
        <MenuLateral defaultOpen={open === "left"} />
        <BottomSheet defaultOpen={open === "bottom"} />
      </div>
    </RivoProvider>
  );
}

function Frames() {
  return (
    <div className="flex flex-col">
      <iframe
        src="./folhas.html#escuro"
        title="Folhas fechadas no tema escuro"
        className="h-[200px] w-full border-0"
      />
      <iframe
        src="./folhas.html#escuro-lateral"
        title="Folha lateral aberta no tema escuro"
        className="h-[520px] w-full border-0"
      />
      <iframe
        src="./folhas.html#claro"
        title="Folhas fechadas no tema claro"
        className="h-[200px] w-full border-0"
      />
      <iframe
        src="./folhas.html#claro-de-baixo"
        title="Folha de baixo aberta no tema claro"
        className="h-[520px] w-full border-0"
      />
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
const view = window.location.hash.slice(1);

if (view === "escuro") root.render(<Sample theme="rivocode-dark" open="" />);
else if (view === "escuro-lateral") root.render(<Sample theme="rivocode-dark" open="left" />);
else if (view === "claro") root.render(<Sample theme="rivocode-light" open="" />);
else if (view === "claro-de-baixo") root.render(<Sample theme="rivocode-light" open="bottom" />);
else root.render(<Frames />);
