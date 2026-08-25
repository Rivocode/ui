import "./generated.css";

import { StatusBar } from "expo-status-bar";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { useState } from "react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  EmptyState,
  Field,
  Input,
  RivoProvider,
  Skeleton,
  Stat,
  Switch,
} from "../../native/src";
import type { RivoNativeTheme } from "../../native/tokens";

/* A mesma tela que a demo web abre: painel de notas. E o argumento inteiro
   do ui-native - os mesmos papeis, o mesmo vocabulario, outra plataforma. */
export default function App() {
  // Fixos por enquanto: a troca em runtime espera o fix upstream descrito no
  // metro.config.js. O provider ja fala a API final.
  const theme: RivoNativeTheme = "rivocode-dark";
  const compact = false;

  const [sendEmail, setSendEmail] = useState(true);
  const [monthly, setMonthly] = useState(false);

  return (
    <SafeAreaProvider>
      <RivoProvider theme={theme} density={compact ? "compact" : "comfortable"}>
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
                <CardDescription>As três últimas emitidas.</CardDescription>
              </CardHeader>
              <CardContent className="gap-3">
                {[
                  ["4813", "Clínica São Lucas", "Paga", "success"],
                  ["4814", "Transportes Cabo Branco", "Aberta", "info"],
                  ["4815", "Supermercado Tambaú", "Vencida", "danger"],
                ].map(([number, customer, status, tone]) => (
                  <View key={number} className="flex-row items-center justify-between gap-3">
                    <View className="min-w-0 flex-1">
                      <Text className="text-base text-fg" numberOfLines={1}>
                        {customer}
                      </Text>
                      <Text className="text-xs text-fg-subtle">Nota {number}</Text>
                    </View>
                    <Badge tone={tone as "success"}>{status}</Badge>
                  </View>
                ))}
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
                <Button>Emitir nota</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Carregando</CardTitle>
                <CardDescription>O esqueleto segura o lugar.</CardDescription>
              </CardHeader>
              <CardContent className="gap-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <EmptyState
                  title="Nenhuma nota por aqui"
                  description="Quando você emitir a primeira, ela aparece nesta lista."
                  action={<Button size="sm">Emitir nota</Button>}
                />
              </CardContent>
            </Card>
          </ScrollView>
        </SafeAreaView>
        <StatusBar style={theme === "rivocode-dark" ? "light" : "dark"} />
      </RivoProvider>
    </SafeAreaProvider>
  );
}
