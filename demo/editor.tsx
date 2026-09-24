import { useEffect, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { z } from "zod";

import {
  Field,
  FieldDescription,
  FieldLabel,
  RivoProvider,
  Text,
  type RivoDensity,
  type RivoTheme,
} from "../src/index";
import { RichTextEditor, RichTextView } from "../src/editor/index";
import { Form, FormField, forValue, useZodForm } from "../src/form";

const SERVICE =
  "<h2>Consultoria de agosto</h2>" +
  "<p>Revisão do fechamento com <strong>ISS retido</strong>, conferência das notas de entrada " +
  "e ajuste da alíquota em <code>aliquota_iss</code>.</p>" +
  "<h3>Entregas</h3>" +
  "<ul><li><p>Relatório de apuração</p></li><li><p>Planilha de <em>conciliação</em></p></li></ul>" +
  "<ol><li><p>Envio ao cliente</p></li><li><p>Aceite por e-mail</p></li></ol>" +
  "<blockquote><p>Pagamento por Pix em até 5 dias úteis.</p></blockquote>" +
  '<p>Detalhes em <a href="https://rivocode.com.br">rivocode.com.br</a>, sem <s>custo extra</s>.</p>' +
  "<pre><code>chave: 3524 0812 3456 7800 0199</code></pre>";

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section data-rc-shot={title} className="flex min-w-0 flex-col gap-3">
      <p className="font-mono text-xs tracking-widest text-fg-subtle uppercase">{title}</p>
      {children}
    </section>
  );
}

function Filled() {
  const [html, setHtml] = useState(SERVICE);

  return (
    <Field>
      <FieldLabel>Descrição do serviço</FieldLabel>
      <RichTextEditor value={html} onValueChange={setHtml} maxLength={600} />
      <FieldDescription>Sai no corpo da nota, abaixo dos itens.</FieldDescription>
    </Field>
  );
}

const schema = z.object({ descricao: z.string().min(1, "Descreva o serviço.") });

function WithError() {
  const form = useZodForm(schema, { defaultValues: { descricao: "" } });

  useEffect(() => {
    form.trigger();
  }, [form]);

  return (
    <Form form={form} onSubmit={() => {}}>
      <FormField name="descricao" label="Descrição do serviço">
        {(field) => (
          <RichTextEditor
            {...forValue(field)}
            onBlur={field.onBlur}
            placeholder="O que foi feito, e para quem"
          />
        )}
      </FormField>
    </Form>
  );
}

function AtLimit() {
  return (
    <RichTextEditor
      aria-label="Resumo"
      defaultValue="<p>Nota emitida e enviada.</p>"
      maxLength={23}
    />
  );
}

function States() {
  return (
    <div className="flex flex-col gap-4">
      <RichTextEditor
        aria-label="Descrição aprovada"
        readOnly
        defaultValue="<p>Aprovada pelo cliente em <strong>12/08</strong>.</p>"
      />
      <RichTextEditor
        aria-label="Descrição travada"
        disabled
        defaultValue="<p>A nota já foi emitida, e a <strong>descrição</strong> não muda mais.</p>"
      />
    </div>
  );
}

function Views() {
  return (
    <div className="flex flex-col gap-6">
      <RichTextView value={SERVICE} className="max-w-prose" />
      <RichTextView value="<p></p>" empty={<Text tone="muted">Sem descrição.</Text>} />
    </div>
  );
}

function Sample({ theme, density }: { theme: RivoTheme; density: RivoDensity }) {
  return (
    <RivoProvider scope="local" theme={theme} density={density} className="p-8">
      <p className="mb-8 font-mono text-xs tracking-widest text-fg-subtle uppercase">
        {theme} / {density}
      </p>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        <Block title="RichTextEditor">
          <Filled />
        </Block>

        <Block title="RichTextView">
          <Views />
        </Block>

        <Block title="Com erro e vazio">
          <WithError />
        </Block>

        <Block title="No limite">
          <AtLimit />
        </Block>

        <Block title="Só leitura e desabilitado">
          <States />
        </Block>
      </div>
    </RivoProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <div>
    <Sample theme="rivocode-dark" density="comfortable" />
    <Sample theme="rivocode-light" density="compact" />
    <Sample theme="rivocode-dark" density="compact" />
    <Sample theme="rivocode-light" density="comfortable" />
  </div>,
);
