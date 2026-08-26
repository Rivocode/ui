import { Columns3, Download, MoreHorizontal, SlidersHorizontal, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { createRoot } from "react-dom/client";

import {
  Button,
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuItem,
  MenuGroup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuSubmenu,
  MenuSubmenuTrigger,
  MenuTrigger,
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
  RivoProvider,
  Select,
  SelectContent,
  SelectGroup,
  SelectGroupLabel,
  SelectItem,
  SelectSeparator,
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

const NATURES = [
  { label: "Venda de mercadoria", value: "5102", flow: "Saida" },
  { label: "Remessa para conserto", value: "5915", flow: "Saida" },
  { label: "Devolucao de venda", value: "1202", flow: "Entrada" },
  { label: "Compra para revenda", value: "1102", flow: "Entrada" },
];

const COLUMNS = ["Numero", "Cliente", "Emissao", "Valor"];

function EntryToast() {
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

function Sample({ theme }: { theme: RivoTheme }) {
  return (
    <RivoProvider scope="local" theme={theme} className="min-h-[560px] p-8">
      <EntryToast />
      <p className="mb-8 font-mono text-xs tracking-widest text-fg-subtle uppercase">{theme}</p>

      <div className="flex flex-col items-start gap-10 sm:flex-row sm:flex-wrap sm:gap-x-16">
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
          <p className="mb-2 text-sm text-fg-muted">Colunas</p>
          <Menu defaultOpen>
            <MenuTrigger render={<Button variant="secondary" size="sm" />}>
              <Columns3 size={15} aria-hidden="true" />
              Colunas
            </MenuTrigger>
            <MenuContent>
              <MenuGroup label="Mostrar na listagem">
                {COLUMNS.map((column) => (
                  <MenuCheckboxItem
                    key={column}
                    defaultChecked={column !== "Valor"}
                    disabled={column === "Numero"}
                  >
                    {column}
                  </MenuCheckboxItem>
                ))}
              </MenuGroup>
            </MenuContent>
          </Menu>
        </div>

        <div>
          <p className="mb-2 text-sm text-fg-muted">Ordenar por</p>
          <Menu defaultOpen>
            <MenuTrigger render={<Button variant="secondary" size="sm" />}>
              <SlidersHorizontal size={15} aria-hidden="true" />
              Ordenar
            </MenuTrigger>
            <MenuContent>
              <MenuRadioGroup defaultValue="emissao" label="Ordenar por">
                <MenuRadioItem value="emissao">Data de emissao</MenuRadioItem>
                <MenuRadioItem value="valor">Valor</MenuRadioItem>
                <MenuRadioItem value="cliente" disabled>
                  Cliente
                </MenuRadioItem>
              </MenuRadioGroup>
              <MenuSeparator />
              <MenuSubmenu defaultOpen>
                <MenuSubmenuTrigger>Exportar</MenuSubmenuTrigger>
                <MenuContent>
                  <MenuItem>XML da NF-e</MenuItem>
                  <MenuItem>PDF do DANFE</MenuItem>
                </MenuContent>
              </MenuSubmenu>
            </MenuContent>
          </Menu>
        </div>

        <div>
          <p className="mb-2 text-sm text-fg-muted">Natureza da operacao</p>
          <Select items={NATURES} defaultValue="5102" defaultOpen>
            <SelectTrigger aria-label="Natureza da operacao" className="min-w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectGroupLabel>Saida</SelectGroupLabel>
                {NATURES.filter((n) => n.flow === "Saida").map((n) => (
                  <SelectItem key={n.value} value={n.value}>
                    {n.label}
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectSeparator />
              <SelectGroup>
                <SelectGroupLabel>Entrada</SelectGroupLabel>
                {NATURES.filter((n) => n.flow === "Entrada").map((n) => (
                  <SelectItem key={n.value} value={n.value}>
                    {n.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
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

        <div>
          <p className="mb-2 text-sm text-fg-muted">Painel</p>
          <Popover defaultOpen>
            <PopoverTrigger render={<Button variant="outline" />}>Periodo</PopoverTrigger>
            <PopoverContent>
              <PopoverTitle>Periodo do relatorio</PopoverTitle>
              <PopoverDescription>
                O intervalo vale para o total e para a lista de notas.
              </PopoverDescription>
              <div className="mt-4 flex justify-end">
                <PopoverClose render={<Button variant="secondary" size="sm" />}>
                  Aplicar
                </PopoverClose>
              </div>
            </PopoverContent>
          </Popover>
        </div>
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
