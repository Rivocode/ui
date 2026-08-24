import { Download, MoreHorizontal, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { createRoot } from "react-dom/client";

import {
  Button,
  Menu,
  MenuContent,
  MenuItem,
  MenuGroup,
  MenuSeparator,
  MenuTrigger,
  RivoProvider,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  useToast,
  type RivoTheme,
} from "../src/index";

const STATUS = [
  { label: "Todas as notas", value: "todas" },
  { label: "Abertas", value: "abertas" },
  { label: "Pagas", value: "pagas" },
  { label: "Vencidas", value: "vencidas" },
];

function AvisoDeEntrada() {
  const toast = useToast();
  useEffect(() => {
    toast.add({
      title: "Nota 4816 emitida",
      description: "O PDF foi enviado para o email do cliente.",
      timeout: 0,
    });
  }, [toast]);
  return null;
}

function Amostra({ theme }: { theme: RivoTheme }) {
  return (
    <RivoProvider scope="local" theme={theme} className="min-h-[560px] p-8">
      <AvisoDeEntrada />
      <p className="mb-8 font-mono text-xs tracking-widest text-fg-subtle uppercase">{theme}</p>

      <div className="flex items-start gap-16">
        <div>
          <p className="mb-2 text-sm text-fg-muted">Filtro</p>
          <Select items={STATUS} defaultValue="abertas" defaultOpen>
            <SelectTrigger aria-label="Status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <p className="mb-2 text-sm text-fg-muted">Acoes da linha</p>
          <Menu defaultOpen>
            <MenuTrigger
              render={<Button variant="secondary" size="icon" aria-label="Mais acoes" />}
            >
              <MoreHorizontal size={16} aria-hidden="true" />
            </MenuTrigger>
            <MenuContent>
              <MenuGroup label="Nota 4813">
                <MenuItem>
                  <Download size={15} aria-hidden="true" />
                  Baixar PDF
                </MenuItem>
                <MenuItem>Duplicar</MenuItem>
              </MenuGroup>
              <MenuSeparator />
              <MenuItem tone="danger">
                <Trash2 size={15} aria-hidden="true" />
                Cancelar nota
              </MenuItem>
            </MenuContent>
          </Menu>
        </div>

        <div>
          <p className="mb-2 text-sm text-fg-muted">Dica</p>
          <Tooltip defaultOpen>
            <TooltipTrigger render={<Button variant="ghost" size="icon" aria-label="Excluir" />}>
              <Trash2 size={16} aria-hidden="true" />
            </TooltipTrigger>
            <TooltipContent>Excluir nota</TooltipContent>
          </Tooltip>
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
