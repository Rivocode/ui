import { useState } from "react";
import { View } from "react-native";
import { Button, CurrencyInput, Field, Heading, IconButton, Input, Text } from "@rivocode/ui-native";
import { PixCode } from "@rivocode/ui-native/chart";
import { Clipboard } from "@rivocode/ui-native/clipboard";
import { Share } from "lucide-react-native";

export function ChargeScreen({ payload }: { payload: string }) {
  const [customer, setCustomer] = useState("");
  const [amount, setAmount] = useState<number | null>(null);

  return (
    <View className="flex-1 gap-4 bg-bg p-4">
      <Heading level={1}>Nova cobrança</Heading>
      <Text tone="muted">O cliente recebe o Pix por mensagem.</Text>

      <Field label="Cliente">
        <Input value={customer} onChangeText={setCustomer} />
      </Field>
      <Field label="Valor">
        <CurrencyInput value={amount} onValueChange={setAmount} />
      </Field>

      <PixCode payload={payload} />
      <Clipboard value={payload} />

      <IconButton label="Compartilhar a cobrança">
        <Share />
      </IconButton>
      <Button onPress={() => setCustomer("")}>Emitir cobrança</Button>
    </View>
  );
}
