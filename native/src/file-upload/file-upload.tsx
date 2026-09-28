import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { getDocumentAsync } from "expo-document-picker";

import { Progress } from "../basics";
import { cn } from "../cn";
import { Entrance } from "../motion";
import { Text } from "../text";

export type PickedFile = {
  /** The file's local address. It is what the app uses to upload the content. */
  uri: string;
  /** The original name, as it was on the device. */
  name: string;
  /**
   * In bytes. **It may be missing**: not every Android file provider reports
   * the size, and that is why `maxSize` only rejects what it managed to
   * measure.
   */
  size?: number;
  mimeType?: string;
};

export type Rejection = {
  file: PickedFile;
  /** Ready for a notice: "maior que 5 MB", "tipo não aceito". */
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
  /** What the button says: "Escolher o XML da nota". */
  label: string;
  /** The fine print: formats and limit, so the person does not find out on rejection. */
  hint?: string;
  /**
   * The accepted types. **Only MIME reaches the system picker**
   * (`application/pdf`, `text/xml`, `image/*`), because that is what
   * `expo-document-picker` can filter. A dotted extension (`.xml`) still
   * applies in the validation on the way back, against the file name, but does
   * not go to the dialog: sending it there would filter everything and the
   * picker would open empty.
   */
  accept?: string | string[];
  multiple?: boolean;
  /** In bytes. A larger file does not get in: it becomes a rejection with the reason. */
  maxSize?: number;
  disabled?: boolean;
  /** The ones that passed validation. Uploading is the app's job, since it knows the network. */
  onSelect?: (files: PickedFile[]) => void;
  /** The ones that did not pass, each with a readable reason. */
  onReject?: (rejections: Rejection[]) => void;
  className?: string;
  /**
   * The rejection reasons, to change the language: `invalidType` is the one for
   * a type outside `accept`, and `tooLarge` receives the limit already written
   * ("5 MB") and returns the one for a file that is too large. Pass only the
   * ones that change.
   */
  labels?: Partial<FileUploadLabels>;
};

export type FileUploadLabels = {
  invalidType: string;
  tooLarge: (limit: string) => string;
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
  labels,
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
        rejected.push({ file, reason: labels?.invalidType ?? "tipo não aceito" });
      } else if (maxSize !== undefined && file.size !== undefined && file.size > maxSize) {
        rejected.push({
          file,
          reason: labels?.tooLarge
            ? labels.tooLarge(fileSize(maxSize))
            : `maior que ${fileSize(maxSize)}`,
        });
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
        <Text className="text-base font-rc-medium text-fg">{label}</Text>
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
  /** In bytes. The formatting ("48,2 KB") is the component's. */
  size: number;
  /** 0 to 100 becomes a bar. Omitted, the file is ready. */
  progress?: number;
  /** Wins over progress: shows the text and offers a retry. */
  error?: string;
  onRetry?: () => void;
  onRemove: () => void;
  className?: string;
  /**
   * The row's texts, to change the language: `retry` is the retry button, and
   * `remove` and `uploading` receive the file name and return the name of the
   * remove button and of the progress bar. `retryFile` is the name the screen
   * reader hears on the retry button. Pass only the ones that change.
   */
  labels?: Partial<FileUploadItemLabels>;
};

export type FileUploadItemLabels = {
  retry: string;
  remove: (name: string) => string;
  uploading: (name: string) => string;
  retryFile: (name: string) => string;
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
  labels,
  className,
}: FileUploadItemProps) {
  return (
    <Entrance
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
          <Text font="mono" className="text-xs text-fg-subtle">
            {fileSize(size)}
          </Text>
        </View>

        {error === undefined && progress !== undefined && (
          <Progress
            value={progress}
            label={labels?.uploading ? labels.uploading(name) : `Enviando ${name}`}
          />
        )}

        {error !== undefined && (
          <View className="flex-row items-center gap-2">
            <Text className="min-w-0 flex-1 text-xs text-danger-text">{error}</Text>
            {onRetry && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  labels?.retryFile ? labels.retryFile(name) : `Tentar enviar ${name} de novo`
                }
                onPress={onRetry}
                hitSlop={8}
              >
                <Text className="text-xs font-rc-medium text-fg-muted">
                  {labels?.retry ?? "Tentar de novo"}
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={labels?.remove ? labels.remove(name) : `Remover ${name}`}
        onPress={onRemove}
        hitSlop={14}
      >
        <CloseIcon />
      </Pressable>
    </Entrance>
  );
}
