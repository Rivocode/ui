/**
 * O react-native que os testes das pecas nativas enxergam. O pacote real nao
 * roda fora do metro (Flow, modulos nativos), e os testes nao medem o RN:
 * medem a NOSSA logica - papel de acessibilidade, estado, os quatro finais do
 * DataList. Cada componente vira um host element com o mesmo nome, e o
 * react-test-renderer deixa ler as props direto da arvore.
 */
import { createElement } from "react";

type AnyProps = Record<string, unknown>;

const host = (name: string) => {
  const Component = (props: AnyProps) => createElement(name, props);
  Component.displayName = name;
  return Component;
};

export const View = host("View");
export const Text = host("Text");
export const TextInput = host("TextInput");
export const ActivityIndicator = host("ActivityIndicator");
export const ScrollView = host("ScrollView");
export const Pressable = host("Pressable");
export const Switch = host("Switch");

/** Como no aparelho: com visible={false} o conteudo do Modal nao existe. */
export const Modal = (props: AnyProps & { visible?: boolean }) =>
  props.visible === false ? null : createElement("Modal", props);

/** O Slider so precisa que os handlers existam; gesto nao se testa aqui. */
export const PanResponder = {
  create: () => ({ panHandlers: {} }),
};

/* O Appearance de verdade e a ponte com o sistema; aqui e uma variavel, para
   o teste do provider poder afirmar qual esquema foi pedido. */
let scheme: "light" | "dark" | null = "dark";
const listeners = new Set<(event: { colorScheme: "light" | "dark" | null }) => void>();

export const Appearance = {
  getColorScheme: () => scheme,
  setColorScheme: (next: "light" | "dark" | "unspecified") => {
    scheme = next === "unspecified" ? null : next;
    for (const listener of listeners) listener({ colorScheme: scheme });
  },
  addChangeListener: (listener: (event: { colorScheme: "light" | "dark" | null }) => void) => {
    listeners.add(listener);
    return { remove: () => listeners.delete(listener) };
  },
};

export const useColorScheme = () => scheme;

/* O AppState de verdade e a ponte com o ciclo de vida do aparelho; aqui e uma
   variavel mais um emissor, para o teste do RelativeTime poder mandar o app
   dormir e acordar. O `setState` NAO existe no react-native: o sistema e quem
   muda o estado la, e aqui e o teste. */
type AppStateValue = "active" | "background" | "inactive";
const appStateListeners = new Set<(state: AppStateValue) => void>();
let appState: AppStateValue = "active";

export const AppState = {
  get currentState() {
    return appState;
  },
  addEventListener: (type: string, listener: (state: AppStateValue) => void) => {
    if (type !== "change") return { remove: () => {} };
    appStateListeners.add(listener);
    return { remove: () => appStateListeners.delete(listener) };
  },
  /** So no duble: empurra a mudanca que o sistema empurraria. */
  setState: (next: AppStateValue) => {
    appState = next;
    for (const listener of appStateListeners) listener(next);
  },
};
