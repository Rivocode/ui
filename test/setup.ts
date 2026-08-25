// Registra um DOM no bun test, que roda sem navegador por padrao.
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { mock } from "bun:test";
import * as reactNativeMock from "./react-native-mock";

GlobalRegistrator.register();

// As pecas nativas importam "react-native", que nao roda fora do metro. Os
// testes delas (native/test) recebem este dublê; os testes web nunca importam
// react-native, entao o mock nao os toca.
mock.module("react-native", () => reactNativeMock);

// Desmonta o que cada teste montou. Sem isto, um Provider deixa atributo e
// container de portal para tras, e o teste seguinte mede sujeira do anterior.
const { cleanup } = await import("@testing-library/react");
const { afterEach } = await import("bun:test");

afterEach(cleanup);
