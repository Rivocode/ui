import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { useAnnounce } from "./announce";
import { Button } from "./button";
import { cn, type Slots } from "./cn";
import { Input, type InputProps } from "./field";
import { Presence } from "./motion";
import { useRivo } from "./provider";
import {
  formatPostalCode,
  POSTAL_CODE_LENGTH,
  POSTAL_CODE_MESSAGES,
  postalCodeDigits,
  searchPostalCode,
  type PostalAddress,
  type PostalCodeLookup,
  type PostalCodeStatus,
} from "./shared/postal-code";
import { Text } from "./text";

export type PostalCodeFieldProps = Omit<
  InputProps,
  "value" | "onChangeText" | "onValueChange" | "keyboardType" | "maxLength" | "className"
> & {
  /** Os digitos, sem a pontuacao: a mascara e do campo, o dado nao a carrega. */
  value: string;
  /** Chamado a cada tecla com os digitos e, no segundo argumento, o CEP pontuado que o web entrega primeiro. */
  onValueChange: (digits: string, masked: string) => void;
  /**
   * A busca do endereco, escrita por quem usa: recebe os 8 digitos e o
   * `signal`, e devolve o endereco ou `null` quando o CEP nao existe. Rejeitar
   * e falha de rede.
   */
  lookup: PostalCodeLookup;
  /** Chamado quando a busca acha o endereco. E aqui que o resto do formulario se preenche. */
  onAddress?: (address: PostalAddress, postalCode: string) => void;
  /** Chamado a cada troca de estado da busca. */
  onStatusChange?: (status: PostalCodeStatus) => void;
  /** Os mesmos textos do web: `searching`, `found`, `notFound`, `failed` e `retry`. */
  labels?: Partial<typeof POSTAL_CODE_MESSAGES>;
  /** Veste a raiz, que embrulha o campo e o aviso. */
  className?: string;
  /**
   * Classe por parte: `input`, `suffix` (o giro, so enquanto busca), `message`
   * e `retry` (o botao de tentar de novo).
   */
  classNames?: Slots<"input" | "suffix" | "message" | "retry">;
};

export function PostalCodeField({
  value,
  onValueChange,
  lookup,
  onAddress,
  onStatusChange,
  labels = {},
  invalid,
  editable,
  className,
  classNames,
  ...props
}: PostalCodeFieldProps) {
  const { colors } = useRivo();
  const digits = postalCodeDigits(value);

  const [searched, setSearched] = useState("");
  const [rawStatus, setRawStatus] = useState<PostalCodeStatus>("idle");
  const status: PostalCodeStatus = digits === searched ? rawStatus : "idle";

  const cancel = useRef<(() => void) | null>(null);
  const latest = useRef({ lookup, onAddress, onStatusChange });
  latest.current = { lookup, onAddress, onStatusChange };

  const said = { ...POSTAL_CODE_MESSAGES, ...labels };

  function settleStatus(next: PostalCodeStatus) {
    setRawStatus(next);
    latest.current.onStatusChange?.(next);
  }

  function run(postalCode: string) {
    cancel.current?.();
    setSearched(postalCode);
    settleStatus("searching");
    cancel.current = searchPostalCode(postalCode, latest.current.lookup, (outcome) => {
      cancel.current = null;
      settleStatus(outcome.status);
      if (outcome.status === "found") latest.current.onAddress?.(outcome.address, postalCode);
    });
  }

  useEffect(() => {
    if (digits === searched) return;
    cancel.current?.();
    cancel.current = null;
  }, [digits, searched]);

  useEffect(() => () => cancel.current?.(), []);

  const notFound = status === "notFound";
  const failed = status === "failed";
  const message = notFound ? said.notFound : failed ? said.failed : null;
  const announcement =
    status === "searching" ? said.searching : status === "found" ? said.found : message;

  useAnnounce(announcement, { onMount: true });

  return (
    <View className={cn("gap-1.5", className)}>
      <View className="justify-center">
        <Input
          textContentType="postalCode"
          autoComplete="postal-code"
          placeholder="00000-000"
          {...props}
          editable={editable}
          keyboardType="number-pad"
          maxLength={9}
          value={formatPostalCode(value)}
          invalid={notFound || invalid}
          accessibilityState={{ busy: status === "searching", disabled: editable === false }}
          onChangeText={(text) => {
            const next = postalCodeDigits(text);
            onValueChange(next, formatPostalCode(next));
            if (next === digits) return;
            if (next.length === POSTAL_CODE_LENGTH) {
              run(next);
            } else if (searched) {
              cancel.current?.();
              cancel.current = null;
              setSearched("");
              settleStatus("idle");
            }
          }}
          className={cn("pr-11", classNames?.input)}
        />
        {status === "searching" ? (
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            className={cn("absolute right-3.5", classNames?.suffix)}
          >
            <ActivityIndicator size="small" color={colors["fg-subtle"]} />
          </View>
        ) : null}
      </View>

      <Presence show={message !== null} swapKey={status}>
        <View className="items-start gap-2">
          <Text
            className={cn(
              "text-xs",
              notFound ? "text-danger-text" : "text-fg-muted",
              classNames?.message,
            )}
          >
            {message}
          </Text>
          {failed ? (
            <Button
              size="sm"
              variant="secondary"
              disabled={editable === false}
              onPress={() => run(digits)}
              className={classNames?.retry}
            >
              {said.retry}
            </Button>
          ) : null}
        </View>
      </Presence>
    </View>
  );
}
