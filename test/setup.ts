// Registra um DOM no bun test, que roda sem navegador por padrao.
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { mock } from "bun:test";
import * as reactNativeMock from "./react-native-mock";
import * as nativewindMock from "./nativewind-mock";

GlobalRegistrator.register();

// O `__DEV__` e global do metro, e as pecas nativas leem dele para so avisar
// em desenvolvimento. Fora do metro ele nao existe, e ler um global ausente e
// ReferenceError, nao undefined.
(globalThis as { __DEV__?: boolean }).__DEV__ = true;

// As pecas nativas importam "react-native", que nao roda fora do metro. Os
// testes delas (native/test) recebem este dublê; os testes web nunca importam
// react-native, entao o mock nao os toca.
mock.module("react-native", () => reactNativeMock);

// O nativewind so existe no app de exemplo, e o provider importa dele o
// VariableContextProvider que veste o tema de cliente. O duble guarda as
// variaveis onde o teste consegue le-las.
mock.module("nativewind", () => nativewindMock);

// Desmonta o que cada teste montou. Sem isto, um Provider deixa atributo e
// container de portal para tras, e o teste seguinte mede sujeira do anterior.
const { cleanup } = await import("@testing-library/react");
const { afterEach } = await import("bun:test");

afterEach(cleanup);
