import { afterEach, expect, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { Conversation } from "../src/ai/conversation";
import { PromptInput } from "../src/ai/prompt-input";
import { ChartGauge } from "../src/chart/chart-gauge";
import { Alert } from "../src/components/alert";
import { AvatarGroup } from "../src/components/avatar-group";
import { Avatar } from "../src/components/avatar";
import { Carousel } from "../src/components/carousel";
import { Combobox, ComboboxInput } from "../src/components/combobox";
import { DatePicker } from "../src/components/date-picker";
import { DateRangePicker } from "../src/components/date-range-picker";
import { EventCalendar } from "../src/components/event-calendar";
import { Field, FieldLabel } from "../src/components/field";
import { Gantt } from "../src/components/gantt";
import { Kbd } from "../src/components/kbd";
import { OTPField } from "../src/components/otp-field";
import { Stat } from "../src/components/stat";
import { Steps } from "../src/components/steps";
import { Breadcrumb } from "../src/components/breadcrumb";
import { ColorPicker } from "../src/components/color-picker";
import { DataTable } from "../src/components/data-table";
import { FileUpload, FileUploadItem } from "../src/components/file-upload";
import { Link } from "../src/components/link";
import { NumberField } from "../src/components/number-field";
import { Pagination } from "../src/components/pagination";
import { Popconfirm } from "../src/components/popconfirm";
import { SidebarProvider, SidebarTrigger } from "../src/components/sidebar";
import { Tree } from "../src/components/tree";
import { RivoProvider } from "../src/provider/rivo-provider";

afterEach(cleanup);

function themed(node: ReactNode) {
  return render(<RivoProvider scope="local">{node}</RivoProvider>);
}

const name = (label: string) => screen.getByRole("button", { name: label });

test("Pagination: a regiao, as setas, os numeros e a posicao saem de labels", () => {
  themed(
    <Pagination
      page={2}
      pageCount={5}
      onPageChange={() => {}}
      labels={{
        navigation: "Pagination",
        previous: "Previous page",
        next: "Next page",
        page: (page) => `Page ${page}`,
        position: (page, count) => `${page} of ${count}`,
      }}
    />,
  );

  expect(screen.getByRole("navigation", { name: "Pagination" })).toBeDefined();
  expect(name("Previous page")).toBeDefined();
  expect(name("Next page")).toBeDefined();
  expect(name("Page 3")).toBeDefined();
  expect(screen.getByText("2 of 5")).toBeDefined();
  expect(screen.queryByRole("button", { name: "Página anterior" })).toBeNull();
});

test("Pagination: sem labels, o padrao continua em portugues", () => {
  themed(<Pagination page={1} pageCount={3} onPageChange={() => {}} />);
  expect(screen.getByRole("navigation", { name: "Paginação" })).toBeDefined();
  expect(name("Próxima página")).toBeDefined();
  expect(screen.getByText("1 de 3")).toBeDefined();
});

test("DataTable: a paginacao de dentro recebe labels.pagination, e a contagem sai de labels.range", () => {
  const rows = Array.from({ length: 12 }, (_, index) => ({ id: String(index) }));
  themed(
    <DataTable
      data={rows}
      columns={[{ key: "id", header: "Id" }]}
      rowKey={(row) => row.id}
      pageSize={5}
      selectable
      labels={{
        range: (first, last, total) => `${first}-${last} of ${total}`,
        pagination: { next: "Next page" },
        selectAll: "Select all rows",
        selectRow: "Select row",
      }}
    />,
  );

  expect(screen.getByText("1-5 of 12")).toBeDefined();
  expect(name("Next page")).toBeDefined();
  expect(name("Página anterior")).toBeDefined();
  expect(screen.getByRole("checkbox", { name: "Select all rows" })).toBeDefined();
  expect(screen.getAllByRole("checkbox", { name: "Select row" }).length).toBe(5);
});

test("Breadcrumb: labels.navigation nomeia a trilha", () => {
  themed(<Breadcrumb items={[{ label: "Notas" }]} labels={{ navigation: "Breadcrumb" }} />);
  expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeDefined();
});

test("NumberField: os dois botoes de passo saem de labels", () => {
  themed(
    <NumberField
      aria-label="Parcelas"
      defaultValue={2}
      labels={{ decrement: "Decrease", increment: "Increase" }}
    />,
  );
  expect(name("Decrease")).toBeDefined();
  expect(name("Increase")).toBeDefined();
});

test("Tree: o botao que abre e fecha o ramo sai de labels", () => {
  themed(
    <Tree
      items={[{ id: "a", label: "Serviços", children: [{ id: "b", label: "Consultoria" }] }]}
      labels={{ expand: "Expand", collapse: "Collapse" }}
    />,
  );
  const toggle = screen.getByRole("button", { name: "Expand" });
  fireEvent.click(toggle);
  expect(screen.getByRole("button", { name: "Collapse" })).toBeDefined();
});

test("SidebarTrigger: o nome de mesa sai de labels.collapse e labels.expand", () => {
  themed(
    <SidebarProvider>
      <SidebarTrigger labels={{ collapse: "Collapse sidebar", expand: "Expand sidebar" }} />
    </SidebarProvider>,
  );
  const trigger = screen.getByRole("button", { name: /sidebar/ });
  const before = trigger.getAttribute("aria-label");
  fireEvent.click(trigger);
  const after = trigger.getAttribute("aria-label");
  expect([before, after].sort()).toEqual(["Collapse sidebar", "Expand sidebar"]);
});

test("FileUploadItem: nova tentativa, remover e a barra saem de labels", () => {
  themed(
    <ul>
      <FileUploadItem
        name="nota.xml"
        size={2048}
        progress={40}
        onRemove={() => {}}
        labels={{ remove: (file) => `Remove ${file}`, uploading: (file) => `Uploading ${file}` }}
      />
      <FileUploadItem
        name="falhou.xml"
        size={2048}
        error="A rede caiu."
        onRetry={() => {}}
        onRemove={() => {}}
        labels={{ retry: "Try again" }}
      />
    </ul>,
  );
  expect(name("Remove nota.xml")).toBeDefined();
  expect(screen.getByRole("progressbar", { name: "Uploading nota.xml" })).toBeDefined();
  expect(name("Try again")).toBeDefined();
});

test("FileUpload: os motivos de recusa saem de labels", () => {
  const reasons: string[] = [];
  const { container } = themed(
    <FileUpload
      label="Arraste o XML"
      accept=".xml"
      maxSize={10}
      labels={{ invalidType: "wrong type", tooLarge: (limit) => `over ${limit}` }}
      onReject={(rejections) => reasons.push(...rejections.map((item) => item.reason))}
    />,
  );
  const input = container.querySelector<HTMLInputElement>("input[type=file]")!;
  const files = [
    new File(["x"], "nota.pdf", { type: "application/pdf" }),
    new File(["x".repeat(20)], "nota.xml", { type: "text/xml" }),
  ];
  fireEvent.change(input, { target: { files } });
  expect(reasons).toEqual(["wrong type", "over 10 B"]);
});

test("ColorPicker: a grade e o campo de texto saem de labels", () => {
  themed(<ColorPicker labels={{ swatches: "Color swatches", hex: "Hex code" }} />);
  expect(screen.getByRole("textbox", { name: "Hex code" })).toBeDefined();
  expect(screen.getByLabelText("Color swatches")).toBeDefined();
});

test("Alert e Link: o xis e o aviso de aba nova saem de labels", () => {
  themed(
    <>
      <Alert onDismiss={() => {}} labels={{ dismiss: "Dismiss" }}>
        Aviso
      </Alert>
      <Link href="https://exemplo.com" external labels={{ external: "(new tab)" }}>
        Portal
      </Link>
    </>,
  );
  expect(name("Dismiss")).toBeDefined();
  expect(screen.getByRole("link").textContent).toContain("(new tab)");
});

test("PromptInput: o botao de enviar sai de labels.submit", () => {
  themed(<PromptInput labels={{ submit: "Send message" }} />);
  expect(name("Send message")).toBeDefined();
});

test("PromptInput: o botao de parar sai de labels.stop", () => {
  themed(<PromptInput streaming labels={{ stop: "Stop answer" }} />);
  expect(name("Stop answer")).toBeDefined();
});

test("Conversation: sem mensagem, labels nao quebra a regiao", () => {
  themed(<Conversation label="Chat" labels={{ scroll: "Jump to end" }} />);
  expect(screen.getByRole("log", { name: "Chat" })).toBeDefined();
});

test("Popconfirm: cancelar e o aviso de espera saem de labels", () => {
  themed(
    <Popconfirm
      defaultOpen
      trigger={<button type="button">Excluir</button>}
      title="Excluir a nota 4813?"
      onConfirm={() => {}}
      labels={{ confirm: "Delete", cancel: "Keep", busy: "Deleting.", blocked: "Wait." }}
      loading
    />,
  );
  expect(screen.getByText("Keep")).toBeDefined();
  expect(screen.getByText("Delete")).toBeDefined();
  expect(screen.getByRole("alertdialog").textContent).toContain("Deleting.");
});

test("DatePicker: o botao, o titulo e o rodape saem de labels", () => {
  themed(
    <DatePicker
      aria-label="Due date"
      confirm
      labels={{ open: "Open calendar", title: "Pick a date", clear: "Clear", apply: "Apply" }}
    />,
  );
  expect(screen.queryByRole("button", { name: "Abrir calendário" })).toBeNull();
  fireEvent.click(name("Open calendar"));
  expect(screen.getByRole("dialog", { name: "Pick a date" })).toBeDefined();
  expect(name("Clear")).toBeDefined();
  expect(name("Apply")).toBeDefined();
  expect(screen.queryByText("Limpar")).toBeNull();
});

test("DateRangePicker: o titulo e o rodape saem de labels", () => {
  themed(<DateRangePicker labels={{ title: "Pick a period", clear: "Clear", apply: "Apply" }} />);
  fireEvent.click(screen.getByRole("button", { name: /Escolha o período/ }));
  expect(screen.getByRole("dialog", { name: "Pick a period" })).toBeDefined();
  expect(name("Clear")).toBeDefined();
  expect(name("Apply")).toBeDefined();
  expect(screen.queryByText("Aplicar")).toBeNull();
});

test("ComboboxInput: o xis e a seta saem de labels", () => {
  themed(
    <Combobox items={["Recife"]}>
      <ComboboxInput aria-label="City" labels={{ clear: "Clear choice", open: "Open list" }} />
    </Combobox>,
  );
  expect(name("Open list")).toBeDefined();
  expect(screen.queryByRole("button", { name: "Abrir lista" })).toBeNull();
});

test("Kbd: a palavra entre as teclas e o nome das setas saem de labels", () => {
  themed(<Kbd keys="shift+up" labels={{ plus: "plus", up: "up arrow" }} />);
  expect(screen.getByRole("img", { name: "Shift plus up arrow" })).toBeDefined();
});

test("ColorPicker: a amostra em texto puro se chama labels.swatch", () => {
  themed(<ColorPicker swatches={["#112233"]} labels={{ swatch: (value) => `Color ${value}` }} />);
  expect(screen.getByRole("radio", { name: "Color #112233" })).toBeDefined();
  expect(screen.queryByRole("radio", { name: "Cor #112233" })).toBeNull();
});

test("ColorPicker: dentro de um Field o label nao aparece de novo, e segue nomeando a grade", () => {
  themed(
    <Field name="brand">
      <FieldLabel>Brand color</FieldLabel>
      <ColorPicker label="Brand color" swatches={["#112233"]} />
    </Field>,
  );
  expect(screen.getByRole("radiogroup", { name: "Brand color" })).toBeDefined();
  const inner = screen
    .getAllByText("Brand color")
    .filter((node) => node.tagName === "SPAN");
  expect(inner).toHaveLength(1);
  expect(inner[0]!.className.split(" ")).toContain("sr-only");
});

test("ColorPicker: fora de Field o label continua visivel", () => {
  themed(<ColorPicker label="Brand color" swatches={["#112233"]} />);
  expect(screen.getByText("Brand color").className.split(" ")).not.toContain("sr-only");
});

test("ChartGauge: o valor e a regua das faixas saem de labels", () => {
  const { container } = themed(
    <ChartGauge
      value={72}
      bands={[{ until: 100, tone: "success", label: "ok" }]}
      labels={{
        value: (value, max) => `${value} of ${max}`,
        band: (name, from, to) => `${name} from ${from} to ${to}`,
      }}
    />,
  );
  expect(screen.getByRole("img", { name: "72 of 100, ok" })).toBeDefined();
  expect(container.textContent).toContain("ok from 0 to 100");
});

test("EventCalendar: a barra, as vistas e a contagem saem de labels, e as datas do locale", () => {
  themed(
    <EventCalendar
      events={[]}
      defaultView="week"
      defaultDate={new Date(2026, 8, 16)}
      locale="en-US"
      labels={{
        previous: "Previous period",
        next: "Next period",
        today: "Today",
        views: "Calendar view",
        agenda: "Agenda",
        day: "Day",
        week: "Week",
        month: "Month",
        events: (count) => `${count} events`,
        weekPeriod: (first, last) => `${first.getDate()}-${last.getDate()}`,
      }}
    />,
  );
  expect(name("Previous period")).toBeDefined();
  expect(name("Next period")).toBeDefined();
  expect(name("Today")).toBeDefined();
  expect(screen.getByRole("group", { name: "Calendar view" })).toBeDefined();
  expect(screen.getByText("Month")).toBeDefined();
  expect(name("14-20")).toBeDefined();
  expect(screen.getByRole("group", { name: "Wednesday, September 16, 0 events" })).toBeDefined();
  expect(screen.queryByText("Hoje")).toBeNull();
});

test("Steps, Stat, AvatarGroup, OTPField e Carousel: os textos montados saem de labels", () => {
  const { container } = themed(
    <div>
      <Steps
        steps={[
          { id: "a", title: "Data" },
          { id: "b", title: "Payment" },
        ]}
        step={1}
        labels={{ position: (step, total) => `Step ${step} of ${total}` }}
      />
      <Stat label="Revenue" value="10" hint="Gross" labels={{ about: (label) => `About ${label}` }} />
      <AvatarGroup max={1} labels={{ more: (count) => `${count} more` }}>
        <Avatar fallback="AB" />
        <Avatar fallback="CD" />
      </AvatarGroup>
      <OTPField aria-label="Code" length={2} labels={{ digit: (at, total) => `Digit ${at} of ${total}` }} />
      <Carousel label="Plans" labels={{ roleDescription: "carousel", slideRoleDescription: "item" }}>
        <div>One</div>
      </Carousel>
    </div>,
  );
  expect(container.textContent).toContain("Step 2 of 2");
  expect(name("About Revenue")).toBeDefined();
  expect(screen.getByLabelText("1 more")).toBeDefined();
  expect(screen.getByLabelText("Digit 2 of 2")).toBeDefined();
  expect(container.querySelector('[aria-roledescription="carousel"]')).not.toBeNull();
  expect(container.querySelector('[aria-roledescription="item"]')).not.toBeNull();
  expect(container.querySelector('[aria-roledescription="carrossel"]')).toBeNull();
});
