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
} from "../../native/src";
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

/* A mesma tela que a demo web abre: painel de notas. E o argumento inteiro
   do ui-native - os mesmos papeis, o mesmo vocabulario, outra plataforma. */
function Painel() {
  const toast = useToast();
  const [open, setOpen] = useState<Invoice | null>(null);
  const [sendEmail, setSendEmail] = useState(true);
  const [monthly, setMonthly] = useState(false);
  const [period, setPeriod] = useState<string | null>("30");
  const [tab, setTab] = useState("mes");
  const [confirming, setConfirming] = useState(false);

  return (
    <SafeAreaView className="flex-1">
      <ScrollView contentContainerClassName="gap-4 p-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-semibold text-fg">Painel</Text>
            <Text className="text-sm text-fg-muted">Agosto, até agora.</Text>
          </View>
          <Badge tone="accent">v0 do ui-native</Badge>
        </View>

        <View className="flex-row gap-3">
          <Stat label="Faturado" value="R$ 246,7K" delta={20} deltaLabel="sobre julho" />
          <Stat label="Vencidas" value="6" delta={50} deltaLabel="sobre julho" invert />
        </View>

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
              <Input placeholder="00.000.000/0000-00" keyboardType="numbers-and-punctuation" />
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
              <Avatar initials="EB" />
              <View className="min-w-0 flex-1">
                <Text className="text-base text-fg">Emanuel Bacalhau</Text>
                <Text className="text-xs text-fg-subtle">emissor</Text>
              </View>
              <Button size="sm" variant="destructive" onPress={() => setConfirming(true)}>
                Cancelar nota
              </Button>
            </View>
            <Separator />
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
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-fg-muted">Situação</Text>
              <Badge tone={open.tone}>{open.status}</Badge>
            </View>
            <Button
              onPress={() => {
                setOpen(null);
                toast.add({ title: `Nota ${open.number} baixada`, description: "PDF salvo." });
              }}
            >
              Baixar PDF
            </Button>
          </View>
        )}
      </Sheet>

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
  // Tema fixo por enquanto: a troca em runtime espera o fix upstream
  // descrito no metro.config.js. O provider ja fala a API final.
  const theme: RivoNativeTheme = "rivocode-dark";

  return (
    <SafeAreaProvider>
      <RivoProvider theme={theme} density="comfortable">
        <Painel />
        <StatusBar style="light" />
      </RivoProvider>
    </SafeAreaProvider>
  );
}
