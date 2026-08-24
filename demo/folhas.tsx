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

const ITENS = [
  { icone: LayoutDashboard, rotulo: "Painel", ativo: true },
  { icone: FileText, rotulo: "Notas fiscais", contagem: 4 },
  { icone: Users, rotulo: "Clientes" },
  { icone: Settings, rotulo: "Ajustes" },
];

function MenuLateral() {
  return (
    <Sheet side="left" defaultOpen>
      <SheetTrigger render={<Button variant="secondary" />}>Abrir menu</SheetTrigger>
      <SheetContent className="p-4">
        <SheetTitle className="px-2 text-lg">RivoCode</SheetTitle>
        <nav className="mt-4 flex flex-col gap-1">
          {ITENS.map(({ icone: Icone, rotulo, ativo, contagem }) => (
            <a
              key={rotulo}
              href="#"
              aria-current={ativo ? "page" : undefined}
              className={
                "flex items-center gap-3 rounded-md px-2 py-2 text-base transition-colors " +
                "duration-[var(--rc-duration-fast)] ease-rc hover:bg-accent-subtle " +
                (ativo ? "bg-accent-subtle text-fg" : "text-fg-muted")
              }
            >
              <Icone size={16} aria-hidden="true" />
              <span className="flex-1">{rotulo}</span>
              {contagem && <Badge>{contagem}</Badge>}
            </a>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

function FolhaDeBaixo() {
  return (
    <Sheet side="bottom" defaultOpen>
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

function Amostra({ theme, lado }: { theme: RivoTheme; lado: SheetSide }) {
  return (
    <RivoProvider scope="local" theme={theme} className="min-h-[560px] p-8">
      <p className="mb-8 font-mono text-xs tracking-widest text-fg-subtle uppercase">
        {theme} / folha {lado === "left" ? "lateral" : "de baixo"}
      </p>
      {lado === "left" ? <MenuLateral /> : <FolhaDeBaixo />}
    </RivoProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <div>
    <Amostra theme="rivocode-dark" lado="left" />
    <Amostra theme="rivocode-light" lado="bottom" />
  </div>,
);
