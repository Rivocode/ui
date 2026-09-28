import { Button, Input, Tour, type TourStep } from "@rivocode/ui";
import { Download, Plus } from "lucide-react";
import { useRef, useState } from "react";

const STEPS: TourStep[] = [
  {
    target: "#tour-novo-cliente",
    title: "Cadastre o primeiro cliente",
    description: "O cadastro pede só o CNPJ: razão social e endereço vêm da Receita.",
  },
  {
    target: "#tour-busca",
    title: "Ache pelo nome ou pelo CNPJ",
    description: "A busca aceita o número com ou sem pontuação.",
  },
  {
    target: "#tour-exportar",
    title: "Leve a lista para a planilha",
    description: "O arquivo sai em CSV, com as colunas que estiverem visíveis.",
    placement: "top",
  },
];

/** Primeiro acesso */
export function FirstVisit() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button id="tour-novo-cliente" size="sm">
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
      <div className="flex items-center justify-between gap-2">
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Fazer o tour
        </Button>
        <Button id="tour-exportar" variant="ghost" size="sm">
          <Download size={16} aria-hidden="true" />
          Exportar
        </Button>
      </div>
      <Tour steps={STEPS} open={open} onOpenChange={setOpen} />
    </div>
  );
}

/** Alvo clicavel */
export function ClickableTarget() {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(0);
  const saveRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="flex flex-col items-start gap-3">
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Mostrar onde salvar
      </Button>
      <Button ref={saveRef} onClick={() => setSaved((count) => count + 1)}>
        Salvar rascunho
      </Button>
      <p className="text-sm text-fg-muted">Rascunhos salvos: {saved}</p>
      <Tour
        interactive
        open={open}
        onOpenChange={setOpen}
        steps={[
          {
            target: saveRef,
            title: "Salve quando quiser",
            description: "Com o tour aberto, o botão destacado continua respondendo ao clique.",
            placement: "right",
          },
        ]}
      />
    </div>
  );
}
