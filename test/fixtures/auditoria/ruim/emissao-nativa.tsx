import { Button, Modal, TextInput, View } from "react-native";
import { Field, IconButton, QRCode, Text } from "@rivocode/ui-native";
import { ChartContainer } from "@rivocode/ui-native/chart";
import { Clipboard } from "@rivocode/ui-native/clipboard";
import { Card } from "@rivocode/ui";
import { Share } from "lucide-react-native";

export function IssueScreen({ payload }: { payload: string }) {
  return (
    <View style={{ backgroundColor: "#ffffff", zIndex: 3 }}>
      <Modal visible>
        <Text className="text-red-500">Nao foi possivel emitir a nota</Text>
        <Field>
          <TextInput />
        </Field>
        <IconButton>
          <Share />
        </IconButton>
        <Button title="Save" onPress={() => {}} />
        <QRCode value={payload} />
        <Clipboard value={payload} />
        <ChartContainer config={{}} className="h-40">
          {() => null}
        </ChartContainer>
        <Card />
      </Modal>
    </View>
  );
}
