import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { getDocumentAsync } from "expo-document-picker";

import { Progress } from "../basics";
import { cn } from "../cn";
import { mono } from "../font";

export type PickedFile = {
  /** O endereço local do arquivo. É com ele que o app sobe o conteúdo. */
  uri: string;
  /** O nome de origem, como estava no aparelho. */
  name: string;
  /**
   * Em bytes. **Pode faltar**: nem todo provedor de arquivo do Android
   * informa o tamanho, e por isso `maxSize` só recusa o que conseguiu medir.
   */
  size?: number;
  mimeType?: string;
};

export type Rejection = {
  file: PickedFile;
  /** Pronto para um aviso: "maior que 5 MB", "tipo não aceito". */
  reason: string;
};

function decimal(value: number) {
  return String(Math.round(value * 10) / 10).replace(".", ",");
}

export function fileSize(bytes: number) {
  if (bytes < 1024) return `${decimal(bytes)} B`;
  if (bytes < 1024 * 1024) return `${decimal(bytes / 1024)} KB`;
  return `${decimal(bytes / (1024 * 1024))} MB`;
}

function tokensOf(accept: string | string[] | undefined) {
  if (accept === undefined) return [];
  const raw = Array.isArray(accept) ? accept : accept.split(",");
  return raw.map((token) => token.trim().toLowerCase()).filter(Boolean);
}

function matchesAccept(file: PickedFile, tokens: string[]) {
  const name = file.name.toLowerCase();
  const type = (file.mimeType ?? "").toLowerCase();

  return tokens.some((token) => {
    if (token.startsWith(".")) return name.endsWith(token);
    if (token.endsWith("/*")) return type.startsWith(token.slice(0, -1));
    return type === token;
  });
}

export type FileUploadProps = {
  /** O que o botão diz: "Escolher o XML da nota". */
  label: string;
  /** A letra miúda: formatos e limite, para a pessoa não descobrir na recusa. */
  hint?: string;
  /**
   * Os tipos aceitos. **Só MIME chega ao seletor do sistema** —
   * `application/pdf`, `text/xml`, `image/*` —, porque é o que o
   * `expo-document-picker` sabe filtrar. Extensão com ponto (`.xml`) continua
   * valendo na validação de volta, contra o nome do arquivo, mas não vai para
   * o diálogo: mandá-la para lá filtraria tudo e o seletor abriria vazio.
   */
  accept?: string | string[];
  multiple?: boolean;
  /** Em bytes. Arquivo maior não entra: vira recusa com o motivo. */
  maxSize?: number;
  disabled?: boolean;
  /** Os que passaram na validação. Subir é trabalho do app, que conhece a rede. */
  onSelect?: (files: PickedFile[]) => void;
  /** Os que não passaram, cada um com o motivo legível. */
  onReject?: (rejections: Rejection[]) => void;
  className?: string;
};

function UploadIcon() {
  return (
    <View className="h-4 w-4 items-center justify-end">
      <View className="absolute top-0 h-2 w-2 rotate-45 border-t-2 border-l-2 border-fg-muted" />
      <View className="absolute top-0.5 h-2.5 w-0.5 rounded-pill bg-fg-muted" />
      <View className="h-0.5 w-3.5 rounded-pill bg-fg-muted" />
    </View>
  );
}

export function FileUpload({
  label,
  hint,
  accept,
  multiple,
  maxSize,
  disabled,
  onSelect,
  onReject,
  className,
}: FileUploadProps) {
  const tokens = tokensOf(accept);
  const mimes = tokens.filter((token) => !token.startsWith("."));

  function deliver(
    assets: readonly { uri: string; name: string; size?: number; mimeType?: string }[],
  ) {
    const accepted: PickedFile[] = [];
    const rejected: Rejection[] = [];

    for (const asset of assets) {
      const file: PickedFile = {
        uri: asset.uri,
        name: asset.name,
        size: asset.size,
        mimeType: asset.mimeType,
      };

      if (tokens.length > 0 && !matchesAccept(file, tokens)) {
        rejected.push({ file, reason: "tipo não aceito" });
      } else if (maxSize !== undefined && file.size !== undefined && file.size > maxSize) {
        rejected.push({ file, reason: `maior que ${fileSize(maxSize)}` });
      } else {
        accepted.push(file);
      }
    }

    const kept = multiple ? accepted : accepted.slice(0, 1);
    if (kept.length > 0) onSelect?.(kept);
    if (rejected.length > 0) onReject?.(rejected);
  }

  async function open() {
    if (disabled) return;

    let result;
    try {
      result = await getDocumentAsync({
        type: mimes.length > 0 ? mimes : undefined,
        multiple,
        copyToCacheDirectory: true,
      });
    } catch {
      return;
    }

    if (result.canceled) return;
    deliver(result.assets);
  }

  return (
    <View className={className}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={hint ? `${label}. ${hint}` : label}
        accessibilityState={{ disabled: Boolean(disabled) }}
        disabled={disabled}
        onPress={open}
        className={cn(
          "h-12 flex-row items-center justify-center gap-2 rounded-md",
          "border border-border-strong bg-surface px-4 active:bg-surface-raised",
          disabled && "opacity-50",
        )}
      >
        <UploadIcon />
        <Text className="text-base font-medium text-fg">{label}</Text>
      </Pressable>

      {hint && (
        <Text
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          className="mt-1.5 text-xs text-fg-subtle"
        >
          {hint}
        </Text>
      )}
    </View>
  );
}

export type FileUploadListProps = {
  children: ReactNode;
  className?: string;
};

export function FileUploadList({ children, className }: FileUploadListProps) {
  return <View className={cn("mt-3 gap-2", className)}>{children}</View>;
}

export type FileUploadItemProps = {
  name: string;
  /** Em bytes. A formatação ("48,2 KB") é da peça. */
  size: number;
  /** 0 a 100 vira barra. Omitido, o arquivo está pronto. */
  progress?: number;
  /** Vence o progresso: mostra o texto e oferece nova tentativa. */
  error?: string;
  onRetry?: () => void;
  onRemove: () => void;
  className?: string;
};

function CloseIcon() {
  return (
    <View className="h-4 w-4 items-center justify-center">
      <View className="absolute h-0.5 w-3.5 rotate-45 rounded-pill bg-fg-muted" />
      <View className="absolute h-0.5 w-3.5 -rotate-45 rounded-pill bg-fg-muted" />
    </View>
  );
}

export function FileUploadItem({
  name,
  size,
  progress,
  error,
  onRetry,
  onRemove,
  className,
}: FileUploadItemProps) {
  return (
    <View
      className={cn(
        "flex-row items-center gap-3 rounded-md border border-border bg-surface px-3 py-2.5",
        className,
      )}
    >
      <View className="min-w-0 flex-1 gap-1">
        <View className="flex-row items-baseline justify-between gap-3">
          <Text numberOfLines={1} className="min-w-0 flex-1 text-sm text-fg">
            {name}
          </Text>
          <Text style={{ fontFamily: mono }} className="text-xs text-fg-subtle">
            {fileSize(size)}
          </Text>
        </View>

        {error === undefined && progress !== undefined && (
          <Progress value={progress} label={`Enviando ${name}`} />
        )}

        {error !== undefined && (
          <View className="flex-row items-center gap-2">
            <Text className="min-w-0 flex-1 text-xs text-danger-text">{error}</Text>
            {onRetry && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Tentar enviar ${name} de novo`}
                onPress={onRetry}
                hitSlop={8}
              >
                <Text className="text-xs font-medium text-fg-muted">Tentar de novo</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Remover ${name}`}
        onPress={onRemove}
        hitSlop={14}
      >
        <CloseIcon />
      </Pressable>
    </View>
  );
}
