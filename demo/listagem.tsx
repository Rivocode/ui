import { Download, FileText, MoreHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";
import { createRoot } from "react-dom/client";

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  Checkbox,
  EmptyState,
  Menu,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  RivoProvider,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Tab,
  TabList,
  TabPanel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  type RivoDensity,
  type RivoTheme,
} from "../src/index";

type Nota = {
  id: string;
  cliente: string;
  emissao: string;
  valor: string;
  status: "paga" | "aberta" | "vencida";
};

const NOTAS: Nota[] = [
  {
    id: "4812",
    cliente: "Prefeitura de Joao Pessoa",
    emissao: "02/08",
    valor: "R$ 12.400,00",
    status: "paga",
  },
  {
    id: "4813",
    cliente: "Clinica Sao Lucas",
    emissao: "05/08",
    valor: "R$ 3.280,00",
    status: "aberta",
  },
  {
    id: "4814",
    cliente: "Transportes Cabo Branco",
    emissao: "11/08",
    valor: "R$ 8.750,00",
    status: "vencida",
  },
  {
    id: "4815",
    cliente: "Supermercado Tambau",
    emissao: "18/08",
    valor: "R$ 1.940,00",
    status: "aberta",
  },
];

const PERIODOS = [
  { label: "Ultimos 30 dias", value: "30" },
  { label: "Ultimos 90 dias", value: "90" },
  { label: "Este ano", value: "ano" },
];

const TOM = { paga: "success", aberta: "info", vencida: "danger" } as const;
const ROTULO = { paga: "Paga", aberta: "Aberta", vencida: "Vencida" } as const;

function LinhasCarregando() {
  return (
    <div className="flex flex-col gap-3 p-5" aria-busy="true">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="size-[18px] rounded-sm" />
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-5 w-16 rounded-pill" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

function Tela({ theme, density }: { theme: RivoTheme; density: RivoDensity }) {
  const [marcadas, setMarcadas] = useState<string[]>(["4813"]);

  const todas = marcadas.length === NOTAS.length;
  const algumas = marcadas.length > 0 && !todas;

  function alternar(id: string) {
    setMarcadas((atual) => (atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]));
  }

  return (
    <RivoProvider scope="local" theme={theme} density={density} className="p-8">
      <p className="mb-6 font-mono text-xs tracking-widest text-fg-subtle uppercase">
        {theme} / {density}
      </p>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5">
          <h2 className="font-display text-2xl text-fg">Notas fiscais</h2>
          <Button size="sm">Emitir nota</Button>
        </div>

        <Tabs defaultValue="todas">
          <div className="px-5">
            <TabList>
              <Tab value="todas">Todas</Tab>
              <Tab value="abertas">Abertas</Tab>
              <Tab value="vencidas">Vencidas</Tab>
            </TabList>
          </div>

          <TabPanel value="todas" className="pt-0">
            <div className="flex items-center gap-3 px-5 py-4">
              <Select items={PERIODOS} defaultValue="30">
                <SelectTrigger aria-label="Periodo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIODOS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-fg-subtle">
                {marcadas.length} de {NOTAS.length} selecionadas
              </span>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      aria-label="Selecionar todas"
                      checked={todas}
                      indeterminate={algumas}
                    />
                  </TableHead>
                  <TableHead>Numero</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Emissao</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {NOTAS.map((nota) => (
                  <TableRow key={nota.id} selected={marcadas.includes(nota.id)}>
                    <TableCell>
                      <Checkbox
                        aria-label={`Selecionar nota ${nota.id}`}
                        checked={marcadas.includes(nota.id)}
                        onCheckedChange={() => alternar(nota.id)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm text-fg-muted">{nota.id}</TableCell>
                    <TableCell>{nota.cliente}</TableCell>
                    <TableCell className="text-fg-muted">{nota.emissao}</TableCell>
                    <TableCell>
                      <Badge tone={TOM[nota.status]} size="sm">
                        {ROTULO[nota.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{nota.valor}</TableCell>
                    <TableCell className="text-right">
                      <Menu>
                        <MenuTrigger
                          render={<Button variant="ghost" size="iconSm" aria-label="Mais acoes" />}
                        >
                          <MoreHorizontal size={16} aria-hidden="true" />
                        </MenuTrigger>
                        <MenuContent>
                          <MenuGroup label={`Nota ${nota.id}`}>
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabPanel>
        </Tabs>
      </Card>

      <p className="mt-10 mb-4 font-mono text-xs tracking-widest text-fg-subtle uppercase">
        os tres estados que sempre faltam
      </p>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <p className="px-5 pt-4 text-sm text-fg-subtle">Carregando</p>
          <LinhasCarregando />
        </Card>

        <Card>
          <p className="px-5 pt-4 text-sm text-fg-subtle">Vazio</p>
          <EmptyState
            icon={<FileText aria-hidden="true" />}
            title="Nenhuma nota por aqui"
            description="Quando voce emitir a primeira, ela aparece nesta lista."
            action={<Button size="sm">Emitir nota</Button>}
          />
        </Card>

        <Card>
          <p className="px-5 pt-4 text-sm text-fg-subtle">Erro</p>
          <div className="flex flex-col gap-3 p-5">
            <Alert tone="danger">
              <AlertTitle>Nao foi possivel carregar</AlertTitle>
              <AlertDescription>
                A prefeitura nao respondeu. Tente de novo em alguns minutos.
              </AlertDescription>
            </Alert>
            <Tooltip>
              <TooltipTrigger render={<Button variant="secondary" size="sm" />}>
                Tentar de novo
              </TooltipTrigger>
              <TooltipContent>Consulta a prefeitura outra vez</TooltipContent>
            </Tooltip>
          </div>
        </Card>
      </div>
    </RivoProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <div>
    <Tela theme="rivocode-dark" density="comfortable" />
    <Tela theme="rivocode-light" density="compact" />
  </div>,
);
