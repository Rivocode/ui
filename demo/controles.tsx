import { AlignCenter, AlignLeft, AlignRight, Grid2x2, List, Rows3 } from "lucide-react";
import { useState } from "react";
import { createRoot } from "react-dom/client";

import {
  Accordion,
  AccordionItem,
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
  Avatar,
  Button,
  ButtonGroup,
  Clipboard,
  ColorPicker,
  Field,
  FieldLabel,
  Progress,
  Radio,
  RadioGroup,
  RivoProvider,
  Separator,
  Spinner,
  Switch,
  Textarea,
  Toggle,
  ToggleGroup,
  type RivoTheme,
} from "../src/index";

const BRAND = [
  { value: "#d4f34a", label: "Lima" },
  { value: "#3ddc97", label: "Verde" },
  { value: "#f2b21c", label: "Ambar" },
  { value: "#6aa9ff", label: "Azul" },
  { value: "#b78cff", label: "Violeta" },
  { value: "#ff8ac4", label: "Rosa" },
  { value: "#ff6b6b", label: "Vermelho" },
  { value: "#8b9199", label: "Cinza" },
];

const PIX = "00020126580014br.gov.bcb.pix0136d2b0f6a1-4c3e-4c1a-9a0c-2f1e5f8b7c3d";

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section data-rc-shot={title} className="flex flex-col gap-3">
      <p className="font-mono text-xs tracking-widest text-fg-subtle uppercase">{title}</p>
      {children}
    </section>
  );
}

function Sample({ theme }: { theme: RivoTheme }) {
  const [avisos, setAvisos] = useState(true);
  const [brand, setBrand] = useState("#3ddc97");

  return (
    <RivoProvider scope="local" theme={theme} className="min-h-[900px] p-8">
      <p className="mb-8 font-mono text-xs tracking-widest text-fg-subtle uppercase">{theme}</p>

      <div className="flex flex-col gap-10 sm:flex-row sm:flex-wrap sm:gap-x-16">
        <div className="flex w-full max-w-80 flex-col gap-10">
          <Block title="Chave">
            <label className="flex items-center gap-3 text-base text-fg">
              <Switch checked={avisos} onCheckedChange={setAvisos} />
              Avisar por email quando a nota for paga
            </label>
          </Block>

          <Block title="Escolha unica">
            <RadioGroup defaultValue="pix">
              {[
                { value: "pix", label: "Pix" },
                { value: "boleto", label: "Boleto" },
                { value: "cartao", label: "Cartao" },
              ].map((o) => (
                <label key={o.value} className="flex items-center gap-3 text-base text-fg">
                  <Radio value={o.value} />
                  {o.label}
                </label>
              ))}
            </RadioGroup>
          </Block>

          <Block title="Grupo de botoes">
            <ButtonGroup>
              <Button variant="secondary" size="icon" aria-label="Ver em lista">
                <List size={16} aria-hidden="true" />
              </Button>
              <Button variant="secondary" size="icon" aria-label="Ver em linhas">
                <Rows3 size={16} aria-hidden="true" />
              </Button>
              <Button variant="secondary" size="icon" aria-label="Ver em grade">
                <Grid2x2 size={16} aria-hidden="true" />
              </Button>
            </ButtonGroup>

            <ButtonGroup>
              <Button variant="secondary">Dia</Button>
              <Button variant="secondary">Semana</Button>
              <Button variant="secondary">Mes</Button>
            </ButtonGroup>

            <ButtonGroup orientation="vertical" className="w-40">
              <Button variant="secondary">Baixar PDF</Button>
              <Button variant="secondary">Baixar XML</Button>
            </ButtonGroup>
          </Block>

          <Block title="Varias linhas">
            <Field>
              <FieldLabel>Observacao</FieldLabel>
              <Textarea placeholder="O que o cliente pediu" />
            </Field>
          </Block>
        </div>

        <div className="flex w-full max-w-80 flex-col gap-10">
          <Block title="Pessoas">
            <div className="flex items-center gap-3">
              <Avatar size="sm" fallback="EB" />
              <Avatar fallback="CS" />
              <Avatar size="lg" fallback="RC" />
              <Separator orientation="vertical" className="h-8" />
              <Spinner />
            </div>
          </Block>

          <Block title="Progresso">
            <Progress value={62} label="Enviando notas" showValue />
          </Block>

          <Block title="Modo de exibicao">
            <ToggleGroup defaultValue={["esquerda"]}>
              <Toggle value="esquerda" aria-label="Alinhar a esquerda">
                <AlignLeft size={15} aria-hidden="true" />
              </Toggle>
              <Toggle value="centro" aria-label="Centralizar">
                <AlignCenter size={15} aria-hidden="true" />
              </Toggle>
              <Toggle value="direita" aria-label="Alinhar a direita">
                <AlignRight size={15} aria-hidden="true" />
              </Toggle>
            </ToggleGroup>
          </Block>

          <Block title="Cor da marca">
            <ColorPicker
              label="Cor da marca"
              value={brand}
              onValueChange={setBrand}
              swatches={BRAND}
              columns={4}
            />
          </Block>

          <Block title="Copiar">
            <div className="flex items-center gap-3">
              <span className="min-w-0 flex-1 truncate font-mono text-sm text-fg-muted">
                {PIX}
              </span>
              <Clipboard value={PIX} />
            </div>
            <Clipboard value={PIX} className="self-start">
              Copiar codigo Pix
            </Clipboard>
          </Block>

          <Block title="Acao sem volta">
            <AlertDialog>
              <AlertDialogTrigger render={<Button variant="destructive" />}>
                Cancelar nota
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogTitle>Cancelar a nota 4813?</AlertDialogTitle>
                <AlertDialogDescription>
                  A prefeitura recebe o cancelamento e o cliente e avisado. Nao da para desfazer.
                </AlertDialogDescription>
                <AlertDialogFooter>
                  <AlertDialogClose render={<Button variant="secondary" />}>
                    Manter nota
                  </AlertDialogClose>
                  <AlertDialogClose render={<Button variant="destructive" />}>
                    Cancelar nota
                  </AlertDialogClose>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </Block>
        </div>

        <div className="w-full max-w-96">
          <Block title="Sanfona">
            <Accordion>
              <AccordionItem title="Como emito uma nota?">
                Pelo botao Emitir nota, no topo da listagem. O rascunho fica salvo se voce sair no
                meio.
              </AccordionItem>
              <AccordionItem title="Da para cancelar depois?">
                Da, enquanto a prefeitura nao fechar o mes. Depois disso, so com nota de
                substituicao.
              </AccordionItem>
              <AccordionItem title="Quem recebe o email?">
                O endereco do cliente cadastrado, com copia para o financeiro.
              </AccordionItem>
            </Accordion>
          </Block>
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
