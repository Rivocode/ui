import { createRoot } from "react-dom/client";

import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  RivoProvider,
} from "../src/index";

createRoot(document.getElementById("root")!).render(
  <RivoProvider scope="local" theme="rivocode-dark" className="min-h-screen p-8">
    <p className="font-mono text-xs tracking-widest text-fg-subtle uppercase">
      dialogo no modo escopado
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
  </RivoProvider>,
);
