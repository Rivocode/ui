import { createRoot } from "react-dom/client";

import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  RivoProvider,
  type RivoTheme,
} from "../src/index";

function DialogSample({ theme }: { theme: RivoTheme }) {
  return (
    <RivoProvider scope="local" theme={theme} className="min-h-screen p-8">
      <p className="font-mono text-xs tracking-widest text-fg-subtle uppercase">
        {theme} / dialogo
      </p>
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Excluir projeto</DialogTitle>
          <DialogDescription>
            Isto remove o projeto, o historico e os arquivos ligados a ele. Nao da para desfazer.
          </DialogDescription>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost">Cancelar</Button>} />
            <Button variant="destructive">Excluir projeto</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RivoProvider>
  );
}

function AlertSample({ theme }: { theme: RivoTheme }) {
  return (
    <RivoProvider scope="local" theme={theme} className="min-h-screen p-8">
      <p className="font-mono text-xs tracking-widest text-fg-subtle uppercase">
        {theme} / aviso sem volta
      </p>
      <AlertDialog defaultOpen>
        <AlertDialogContent>
          <AlertDialogTitle>Cancelar a nota 4813?</AlertDialogTitle>
          <AlertDialogDescription>
            A prefeitura recebe o cancelamento e o cliente e avisado. Nao da para desfazer.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="secondary" />}>Manter nota</AlertDialogClose>
            <AlertDialogClose render={<Button variant="destructive" />}>
              Cancelar nota
            </AlertDialogClose>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </RivoProvider>
  );
}

function Frames() {
  return (
    <div className="flex flex-col">
      <iframe
        src="./dialog.html#dialogo-escuro"
        title="Dialogo no tema escuro"
        className="h-[420px] w-full border-0"
      />
      <iframe
        src="./dialog.html#dialogo-claro"
        title="Dialogo no tema claro"
        className="h-[420px] w-full border-0"
      />
      <iframe
        src="./dialog.html#alerta-escuro"
        title="Aviso sem volta no tema escuro"
        className="h-[420px] w-full border-0"
      />
      <iframe
        src="./dialog.html#alerta-claro"
        title="Aviso sem volta no tema claro"
        className="h-[420px] w-full border-0"
      />
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
const view = window.location.hash.slice(1);

if (view === "dialogo-escuro") root.render(<DialogSample theme="rivocode-dark" />);
else if (view === "dialogo-claro") root.render(<DialogSample theme="rivocode-light" />);
else if (view === "alerta-escuro") root.render(<AlertSample theme="rivocode-dark" />);
else if (view === "alerta-claro") root.render(<AlertSample theme="rivocode-light" />);
else root.render(<Frames />);
