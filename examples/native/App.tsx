import "./generated.css";

import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Alert,
  AlertDialog,
  Avatar,
  DataList,
  Field,
  Input,
  Progress,
  RivoProvider,
  Select,
  Separator,
  Sheet,
  Stat,
  Tabs,
  Switch,
  useToast,
  Accordion,
  AccordionItem,
  AspectRatio,
  Collapsible,
  Combobox,
  DatePicker,
  DescriptionItem,
  DescriptionList,
  Fieldset,
  MaskedInput,
  Menu,
  NumberField,
  OTPField,
  PageHeader,
  RadioGroup,
  SearchInput,
  Slider,
  Textarea,
  ToggleGroup,
} from "../../native/src";
/* O grafico entra pelo subcaminho, e nao pelo indice acima: o react-native-svg
   e peer opcional, e este app o instalou porque desenha. Quem nao desenha nao
   paga - e `scripts/check-fronteira-do-chart.ts` guarda essa fronteira. */
import { ChartDonut, ChartRadial } from "../../native/src/chart";
import type { RivoNativeTheme } from "../../native/tokens";

type Invoice = {
  id: string;
  number: string;
  customer: string;
  status: "Paga" | "Aberta" | "Vencida";
  tone: "success" | "info" | "danger";
};

const INVOICES: Invoice[] = [
  { id: "1", number: "4813", customer: "Clínica São Lucas", status: "Paga", tone: "success" },
  { id: "2", number: "4814", customer: "Transportes Cabo Branco", status: "Aberta", tone: "info" },
  { id: "3", number: "4815", customer: "Supermercado Tambaú", status: "Vencida", tone: "danger" },
];

const NATURE = [
  { kind: "servico", total: 148_200 },
  { kind: "produto", total: 71_400 },
  { kind: "locacao", total: 27_100 },
];

const NATURE_SERIES = {
  servico: { label: "Serviço" },
  produto: { label: "Produto" },
  locacao: { label: "Locação" },
} as const;

/* A mesma tela que a demo web abre: painel de notas. E o argumento inteiro
   do ui-native - os mesmos papeis, o mesmo vocabulario, outra plataforma. */
function Painel({
  lightTheme,
  onLightThemeChange,
}: {
  lightTheme: boolean;
  onLightThemeChange: (light: boolean) => void;
}) {
  const toast = useToast();
  const [open, setOpen] = useState<Invoice | null>(null);
  const [sendEmail, setSendEmail] = useState(true);
  const [monthly, setMonthly] = useState(false);
  const [period, setPeriod] = useState<string | null>("30");
  const [tab, setTab] = useState("mes");
  const [confirming, setConfirming] = useState(false);
  const [cnpj, setCnpj] = useState("12345678000190");
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [payment, setPayment] = useState<string | null>("pix");
  const [installments, setInstallments] = useState(1);
  const [query, setQuery] = useState("");
  const [customer, setCustomer] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string[]>(["paga"]);
  const [goal, setGoal] = useState(80);
  const [otp, setOtp] = useState("");
  const [rowMenu, setRowMenu] = useState(false);

  return (
    <SafeAreaView className="flex-1">
      <ScrollView contentContainerClassName="gap-4 p-4">
        <PageHeader
          title="Painel"
          description="Agosto, até agora."
          badge={<Badge tone="accent">ui-native</Badge>}
        />

        <View className="flex-row gap-3">
          <Stat label="Faturado" value="R$ 246,7K" delta={20} deltaLabel="sobre julho" />
          <Stat label="Vencidas" value="6" delta={50} deltaLabel="sobre julho" invert />
        </View>

        <Card>
          <CardHeader>
            <CardTitle>Faturamento por natureza</CardTitle>
            <CardDescription>Toque uma linha para ler a fatia.</CardDescription>
          </CardHeader>
          <CardContent>
            <View className="flex-row gap-4">
              <View className="flex-1">
                <ChartDonut
                  data={NATURE}
                  valueKey="total"
                  nameKey="kind"
                  config={NATURE_SERIES}
                  centerValue="R$ 246,7K"
                  centerLabel="faturado"
                  format={(value) => `R$ ${(value / 1000).toFixed(1).replace(".", ",")}K`}
                />
              </View>
            </View>
            <ChartRadial value={82} centerLabel="da meta do mês" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notas recentes</CardTitle>
            <CardDescription>Toque para abrir o detalhe.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataList
              data={INVOICES}
              keyExtractor={(invoice) => invoice.id}
              onRowPress={setOpen}
              empty={{
                title: "Nenhuma nota por aqui",
                description: "Quando você emitir a primeira, ela aparece nesta lista.",
              }}
              renderItem={(invoice) => (
                <View className="flex-row items-center justify-between gap-3">
                  <View className="min-w-0 flex-1">
                    <Text className="text-base text-fg" numberOfLines={1}>
                      {invoice.customer}
                    </Text>
                    <Text className="text-xs text-fg-subtle">Nota {invoice.number}</Text>
                  </View>
                  <Badge tone={invoice.tone}>{invoice.status}</Badge>
                </View>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nova nota</CardTitle>
            <CardDescription>O formulário, nas mesmas peças do web.</CardDescription>
          </CardHeader>
          <CardContent className="gap-4">
            <Field label="Razão social">
              <Input placeholder="Quem recebe a nota" defaultValue="Clínica São Lucas" />
            </Field>
            <Field label="CNPJ" description="A máscara é do campo; o valor vai limpo.">
              <MaskedInput
                mask="##.###.###/####-##"
                value={cnpj}
                onValueChange={setCnpj}
                placeholder="00.000.000/0000-00"
              />
            </Field>
            <Field label="Vencimento">
              <DatePicker
                label="Vencimento"
                value={dueDate}
                onValueChange={setDueDate}
                placeholder="Selecione a data"
              />
            </Field>
            <Fieldset legend="Cobrança" description="Como e em quantas vezes o cliente paga.">
              <RadioGroup
                items={[
                  { label: "Pix", value: "pix", description: "Cai na hora" },
                  { label: "Boleto", value: "boleto", description: "Compensa em 2 dias úteis" },
                ]}
                value={payment}
                onValueChange={setPayment}
              />
              <Field label="Parcelas">
                <NumberField
                  label="Parcelas"
                  value={installments}
                  onValueChange={setInstallments}
                  min={1}
                  max={12}
                />
              </Field>
            </Fieldset>
            <Field label="Observações">
              <Textarea placeholder="Aparece no rodapé da nota." rows={3} />
            </Field>
            <Checkbox checked={sendEmail} onCheckedChange={setSendEmail}>
              Enviar o PDF por e-mail
            </Checkbox>
            <Switch checked={monthly} onCheckedChange={setMonthly}>
              Emitir todo mês, sem perguntar
            </Switch>
            <Button
              onPress={() =>
                toast.add({ title: "Nota 4816 emitida", description: "O PDF foi para o e-mail." })
              }
            >
              Emitir nota
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Busca e filtros</CardTitle>
            <CardDescription>Quem opera acha; quem filtra combina.</CardDescription>
          </CardHeader>
          <CardContent className="gap-4">
            <SearchInput value={query} onValueChange={setQuery} placeholder="Buscar nota" />
            <Combobox
              label="Cliente"
              items={[
                { label: "Clínica São Lucas", value: "1" },
                { label: "Transportes Cabo Branco", value: "2" },
                { label: "Supermercado Tambaú", value: "3" },
                { label: "Construtora Manaíra", value: "4" },
                { label: "Hotel Ponta do Seixas", value: "5" },
              ]}
              value={customer}
              onValueChange={setCustomer}
              placeholder="Todos os clientes"
              searchPlaceholder="Buscar cliente"
            />
            <ToggleGroup
              multiple
              items={[
                { label: "Paga", value: "paga" },
                { label: "Aberta", value: "aberta" },
                { label: "Vencida", value: "vencida" },
              ]}
              value={statusFilter}
              onValueChange={setStatusFilter}
            />
            <View className="gap-1.5">
              <Text className="text-sm text-fg-muted">Meta do mês: {goal}%</Text>
              <Slider label="Meta do mês" value={goal} onValueChange={setGoal} step={5} />
            </View>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ajuda e verificação</CardTitle>
            <CardDescription>Acordeão, código de confirmação e a caixa de proporção.</CardDescription>
          </CardHeader>
          <CardContent className="gap-4">
            <Accordion>
              <AccordionItem title="Quando a nota é enviada?">
                <Text className="text-sm text-fg-muted">
                  No momento da emissão, direto para a prefeitura.
                </Text>
              </AccordionItem>
              <AccordionItem title="Dá para cancelar depois?">
                <Text className="text-sm text-fg-muted">
                  Dá, em até 24 horas — e a prefeitura é avisada.
                </Text>
              </AccordionItem>
            </Accordion>
            <Field label="Código enviado por SMS">
              <OTPField length={6} value={otp} onValueChange={setOtp} />
            </Field>
            <Collapsible label="Ver a área de cobertura">
              <AspectRatio ratio={16 / 9}>
                <View className="flex-1 items-center justify-center bg-skeleton">
                  <Text className="text-sm text-fg-subtle">O mapa entra aqui</Text>
                </View>
              </AspectRatio>
            </Collapsible>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Controles</CardTitle>
            <CardDescription>As peças pequenas, nos papéis de sempre.</CardDescription>
          </CardHeader>
          <CardContent className="gap-4">
            <Tabs
              items={[
                { label: "Mês", value: "mes" },
                { label: "Trimestre", value: "tri" },
                { label: "Ano", value: "ano" },
              ]}
              value={tab}
              onValueChange={setTab}
            />
            <Select
              label="Período do relatório"
              items={[
                { label: "Últimos 30 dias", value: "30" },
                { label: "Últimos 90 dias", value: "90" },
                { label: "Este ano", value: "ano" },
              ]}
              value={period}
              onValueChange={setPeriod}
            />
            <View className="gap-1.5">
              <Text className="text-sm text-fg-muted">82% da meta do mês</Text>
              <Progress value={82} label="82% da meta do mês" />
            </View>
            <View className="flex-row items-center gap-3">
              <Avatar fallback="EB" />
              <View className="min-w-0 flex-1">
                <Text className="text-base text-fg">Emanuel Bacalhau</Text>
                <Text className="text-xs text-fg-subtle">emissor</Text>
              </View>
              <Button size="sm" variant="destructive" onPress={() => setConfirming(true)}>
                Cancelar nota
              </Button>
            </View>
            <Separator />
            <Switch checked={lightTheme} onCheckedChange={onLightThemeChange}>
              Tema claro
            </Switch>
            <Alert tone="warning" title="A prefeitura instável">
              Emissões podem demorar mais que o normal hoje.
            </Alert>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Carregando</CardTitle>
            <CardDescription>Os quatro finais de uma consulta, aqui também.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataList<Invoice>
              data={undefined}
              isLoading
              keyExtractor={(invoice) => invoice.id}
              renderItem={() => null}
            />
          </CardContent>
        </Card>
      </ScrollView>

      <Sheet
        open={open !== null}
        onOpenChange={(next) => !next && setOpen(null)}
        title={open ? `Nota ${open.number}` : ""}
        description={open?.customer}
      >
        {open && (
          <View className="gap-4">
            <DescriptionList>
              <DescriptionItem label="Número">{open.number}</DescriptionItem>
              <DescriptionItem label="Cliente">{open.customer}</DescriptionItem>
              <DescriptionItem label="Situação">
                <Badge tone={open.tone}>{open.status}</Badge>
              </DescriptionItem>
            </DescriptionList>
            <Button
              onPress={() => {
                setOpen(null);
                toast.add({ title: `Nota ${open.number} baixada`, description: "PDF salvo." });
              }}
            >
              Baixar PDF
            </Button>
            <Button variant="ghost" onPress={() => setRowMenu(true)}>
              Mais ações
            </Button>
          </View>
        )}
      </Sheet>

      <Menu
        open={rowMenu}
        onOpenChange={setRowMenu}
        title={open ? `Nota ${open.number}` : "Nota"}
        actions={[
          { label: "Reenviar por e-mail", onSelect: () => toast.add({ title: "Nota reenviada" }) },
          { label: "Duplicar nota", onSelect: () => toast.add({ title: "Rascunho criado" }) },
          {
            label: "Cancelar nota",
            tone: "danger",
            onSelect: () => {
              setOpen(null);
              setConfirming(true);
            },
          },
        ]}
      />

      <AlertDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Cancelar a nota 4813?"
        description="Isto avisa a prefeitura e não dá para desfazer."
        actionLabel="Cancelar nota"
        onAction={() => toast.add({ title: "Nota 4813 cancelada" })}
      />
    </SafeAreaView>
  );
}

export default function App() {
  // As cores foram compiladas como light-dark(), entao trocar a prop e
  // trocar a tela inteira em runtime - o interruptor vive no card Controles.
  const [theme, setTheme] = useState<RivoNativeTheme>("rivocode-dark");

  return (
    <SafeAreaProvider>
      <RivoProvider theme={theme} density="comfortable">
        <Painel
          lightTheme={theme === "rivocode-light"}
          onLightThemeChange={(light) => setTheme(light ? "rivocode-light" : "rivocode-dark")}
        />
        <StatusBar style={theme === "rivocode-light" ? "dark" : "light"} />
      </RivoProvider>
    </SafeAreaProvider>
  );
}
