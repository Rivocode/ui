import { useState } from "react";
import { useForm } from "react-hook-form";
import QRCodeView from "react-qr-code";
import { Line, LineChart } from "recharts";
import { createPortal } from "react-dom";
import { Button, Checkbox, DataTable, Field, FormField, IconButton, Input } from "@rivocode/ui";
import { Button as SubmitButton } from "@rivocode/ui/form";
import { Card } from "@rivocode/ui/dist/card";
import { Trash } from "lucide-react";

const PAYLOAD = "00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D";

type Row = { id: string };

export function IssueScreen({ rows }: { rows: Row[] }) {
  const [price, setPrice] = useState("");
  const [cpf, setCpf] = useState("");
  const [open, setOpen] = useState(true);
  const form = useForm();
  const total = parseFloat(price) * 1.1;
  const cpfOk = /^\d{11}$/.test(cpf);
  const masked = cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/50">
      <div className="rounded-lg bg-white text-gray-900" style={{ color: "#333333", zIndex: 10 }}>
        <h1>Emissao de nota</h1>
        <form onSubmit={form.handleSubmit(() => setOpen(false))}>
          <input type="checkbox" />
          <Input placeholder="Enter the price" type="number" name="price" onChange={(event) => setPrice(event.target.value)} />
          <Input placeholder="CPF" value={masked} onChange={(event) => setCpf(event.target.value)} />
          <Field>
            <Input aria-label="Observacao" />
          </Field>
          <div className="flex gap-2">
            <Checkbox />
            <span>Enviar o XML junto</span>
          </div>
          <IconButton>
            <Trash />
          </IconButton>
          <Button>
            <Trash />
          </Button>
          <Button className="h-10">Emitir nota</Button>
          <button className="px-4 outline-none duration-300">Save</button>
          <select>
            <option>Pix</option>
          </select>
          <SubmitButton>{cpfOk ? "ok" : "erro"}</SubmitButton>
        </form>
        <div onClick={() => setOpen(false)}>Fechar</div>
        <img src="/logo.png" />
        <span tabIndex={3}>Atalho</span>
        <p>Total: R$ {total.toFixed(2)}</p>
        <DataTable<Row> data={rows} isLoading={false} rowKey={(row) => row.id} columns={[]} />
        <Card className="[&_h3]:text-lg" />
        <FormField name="notes" label="Notas">
          {(field) => <Input {...field} />}
        </FormField>
        <TooltipProvider>
          <QRCodeView value={PAYLOAD} />
        </TooltipProvider>
        <LineChart data={[]}>
          <Line dataKey="paid" stroke="#22c55e" />
        </LineChart>
      </div>
    </div>,
    document.body,
  );
}

function TooltipProvider({ children }: { children: React.ReactNode }) {
  return children;
}
