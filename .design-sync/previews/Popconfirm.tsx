import {
  Button,
  Popconfirm,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@rivocode/ui";
import { Trash2 } from "lucide-react";
import { useState } from "react";

type Invoice = {
  id: string;
  number: string;
  customer: string;
};

const INVOICES: Invoice[] = [
  { id: "1", number: "4813", customer: "Clinica São Lucas" },
  { id: "2", number: "4814", customer: "Transportes Cabo Branco" },
];

/** Excluir uma linha */
export function DeletingARow() {
  const [rows, setRows] = useState(INVOICES);

  return (
    <div className="min-h-72 w-full max-w-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Número</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.number}</TableCell>
              <TableCell>{row.customer}</TableCell>
              <TableCell>
                <Popconfirm
                  defaultOpen={row.id === "1"}
                  title={`Excluir a nota ${row.number}?`}
                  description="A linha sai da lista e o cliente deixa de ver o documento."
                  confirmLabel="Excluir"
                  align="end"
                  trigger={
                    <Button
                      variant="ghost"
                      size="iconSm"
                      aria-label={`Excluir a nota ${row.number}`}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </Button>
                  }
                  onConfirm={() =>
                    setRows((current) => current.filter((item) => item.id !== row.id))
                  }
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/** Com a chamada em curso */
export function WhileTheRequestRuns() {
  const [deleted, setDeleted] = useState(false);

  function remove() {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setDeleted(true);
        resolve();
      }, 1500);
    });
  }

  return (
    <div className="min-h-72">
      <Popconfirm
        title="Excluir o anexo?"
        description="O arquivo sai do servidor e o link para de responder."
        confirmLabel="Excluir"
        trigger={<Button variant="secondary">{deleted ? "Excluído" : "Excluir anexo"}</Button>}
        onConfirm={remove}
      />
    </div>
  );
}

/** Sem perigo */
export function Reversible() {
  return (
    <div className="min-h-72">
      <Popconfirm
        tone="neutral"
        title="Arquivar o orçamento?"
        description="Ele sai da lista ativa e continua na busca por arquivados."
        confirmLabel="Arquivar"
        trigger={<Button variant="secondary">Arquivar</Button>}
        onConfirm={() => {}}
      />
    </div>
  );
}
