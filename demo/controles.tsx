import { AlignCenter, AlignLeft, AlignRight } from "lucide-react";
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

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <p className="font-mono text-xs tracking-widest text-fg-subtle uppercase">{titulo}</p>
      {children}
    </section>
  );
}

function Amostra({ theme }: { theme: RivoTheme }) {
  const [avisos, setAvisos] = useState(true);

  return (
    <RivoProvider scope="local" theme={theme} className="min-h-[900px] p-8">
      <p className="mb-8 font-mono text-xs tracking-widest text-fg-subtle uppercase">{theme}</p>

      <div className="flex flex-col gap-10 sm:flex-row sm:flex-wrap sm:gap-x-16">
        <div className="flex w-full max-w-80 flex-col gap-10">
          <Bloco titulo="Chave">
            <label className="flex items-center gap-3 text-base text-fg">
              <Switch checked={avisos} onCheckedChange={setAvisos} />
              Avisar por email quando a nota for paga
            </label>
          </Bloco>

          <Bloco titulo="Escolha unica">
            <RadioGroup defaultValue="pix">
              {[
                { valor: "pix", rotulo: "Pix" },
                { valor: "boleto", rotulo: "Boleto" },
                { valor: "cartao", rotulo: "Cartao" },
              ].map((o) => (
                <label key={o.valor} className="flex items-center gap-3 text-base text-fg">
                  <Radio value={o.valor} />
                  {o.rotulo}
                </label>
              ))}
            </RadioGroup>
          </Bloco>

          <Bloco titulo="Varias linhas">
            <Field>
              <FieldLabel>Observacao</FieldLabel>
              <Textarea placeholder="O que o cliente pediu" />
            </Field>
          </Bloco>
        </div>

        <div className="flex w-full max-w-80 flex-col gap-10">
          <Bloco titulo="Pessoas">
            <div className="flex items-center gap-3">
              <Avatar size="sm" fallback="EB" />
              <Avatar fallback="CS" />
              <Avatar size="lg" fallback="RC" />
              <Separator orientation="vertical" className="h-8" />
              <Spinner />
            </div>
          </Bloco>

          <Bloco titulo="Progresso">
            <Progress value={62} label="Enviando notas" showValue />
          </Bloco>

          <Bloco titulo="Modo de exibicao">
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
          </Bloco>

          <Bloco titulo="Acao sem volta">
            <AlertDialog defaultOpen={theme === "rivocode-light"}>
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
          </Bloco>
        </div>

        <div className="w-full max-w-96">
          <Bloco titulo="Sanfona">
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
          </Bloco>
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
