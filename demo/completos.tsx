import { Bold, Italic, Underline } from "lucide-react";
import { useState } from "react";
import { createRoot } from "react-dom/client";

import {
  Checkbox,
  CheckboxGroup,
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
  Field,
  Fieldset,
  FieldsetLegend,
  FieldLabel,
  Input,
  Menubar,
  Meter,
  NumberField,
  OTPField,
  PreviewCard,
  PreviewCardContent,
  PreviewCardTrigger,
  RivoProvider,
  ScrollArea,
  Slider,
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
  type RivoTheme,
} from "../src/index";

function Block({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <p className="font-mono text-xs tracking-widest text-fg-subtle uppercase">{titulo}</p>
      {children}
    </section>
  );
}

function Sample({ theme }: { theme: RivoTheme }) {
  const [parcelas, setParcelas] = useState(3);

  return (
    <RivoProvider scope="local" theme={theme} className="min-h-[900px] p-8">
      <p className="mb-8 font-mono text-xs tracking-widest text-fg-subtle uppercase">{theme}</p>

      <div className="flex flex-col gap-10 sm:flex-row sm:flex-wrap sm:gap-x-16">
        <div className="flex w-full max-w-80 flex-col gap-10">
          <Block titulo="Numero com passo">
            <Field>
              <FieldLabel>Parcelas</FieldLabel>
              <NumberField
                value={parcelas}
                onValueChange={(v) => setParcelas(v ?? 1)}
                min={1}
                max={12}
              />
            </Field>
          </Block>

          <Block titulo="Faixa">
            <Slider defaultValue={25} label="Desconto" showValue thumbLabel="Desconto" max={50} />
          </Block>

          <Block titulo="Capacidade">
            <Meter value={72} label="Notas do plano" showValue />
          </Block>

          <Block titulo="Codigo de verificacao">
            <OTPField length={6} defaultValue="4813" />
          </Block>
        </div>

        <div className="flex w-full max-w-80 flex-col gap-10">
          <Block titulo="Grupo de campos">
            <Fieldset>
              <FieldsetLegend>Endereco</FieldsetLegend>
              <Field>
                <FieldLabel>Rua</FieldLabel>
                <Input defaultValue="Av. Epitacio Pessoa" />
              </Field>
              <Field>
                <FieldLabel>Numero</FieldLabel>
                <Input defaultValue="1200" />
              </Field>
            </Fieldset>
          </Block>

          <Block titulo="Grupo de caixas">
            <CheckboxGroup defaultValue={["pix"]} aria-label="Formas aceitas">
              {[
                { value: "pix", label: "Pix" },
                { value: "boleto", label: "Boleto" },
                { value: "cartao", label: "Cartao" },
              ].map((o) => (
                <label key={o.value} className="flex items-center gap-3 text-base text-fg">
                  <Checkbox name="forma" value={o.value} />
                  {o.label}
                </label>
              ))}
            </CheckboxGroup>
          </Block>

          <Block titulo="Bloco que esconde">
            <Collapsible defaultOpen>
              <CollapsibleTrigger>Dados de quem emite</CollapsibleTrigger>
              <CollapsiblePanel>
                RivoCode Tecnologia, 12.345.678/0001-99, Joao Pessoa PB.
              </CollapsiblePanel>
            </Collapsible>
          </Block>
        </div>

        <div className="flex w-full max-w-96 flex-col gap-10">
          <Block titulo="Barra de ferramentas">
            <Toolbar aria-label="Formatacao">
              <ToolbarButton aria-label="Negrito">
                <Bold size={15} aria-hidden="true" />
              </ToolbarButton>
              <ToolbarButton aria-label="Italico">
                <Italic size={15} aria-hidden="true" />
              </ToolbarButton>
              <ToolbarButton aria-label="Sublinhado">
                <Underline size={15} aria-hidden="true" />
              </ToolbarButton>
              <ToolbarSeparator />
              <ToolbarButton>Limpar formato</ToolbarButton>
            </Toolbar>
          </Block>

          <Block titulo="Barra de menus">
            <Menubar aria-label="Principal">
              <span className="px-2 text-base text-fg-muted">Arquivo</span>
              <span className="px-2 text-base text-fg-muted">Editar</span>
              <span className="px-2 text-base text-fg-muted">Exibir</span>
            </Menubar>
          </Block>

          <Block titulo="Cartao ao pousar">
            <p className="text-base text-fg">
              A nota foi emitida para a{" "}
              <PreviewCard>
                <PreviewCardTrigger
                  href="#"
                  className="text-accent-text underline decoration-1 underline-offset-2"
                >
                  Clinica Sao Lucas
                </PreviewCardTrigger>
                <PreviewCardContent>
                  <p className="font-medium text-fg">Clinica Sao Lucas</p>
                  <p className="mt-1 text-sm text-fg-muted">
                    12.345.678/0001-99, cliente desde 2023. Quatro notas em aberto.
                  </p>
                </PreviewCardContent>
              </PreviewCard>{" "}
              nesta manha.
            </p>
          </Block>

          <Block titulo="Area de rolagem">
            <ScrollArea className="h-32 rounded-md border border-border p-3">
              <div className="flex flex-col gap-2 text-base text-fg-muted">
                {Array.from({ length: 12 }, (_, index) => (
                  <p key={index}>Nota {4800 + index}, emitida e enviada por email.</p>
                ))}
              </div>
            </ScrollArea>
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
