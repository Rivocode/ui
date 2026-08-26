import { Platform } from "react-native";

export const mono = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
});
