"use client";

import { RotateCw, Trash2, UploadCloud } from "lucide-react";
import { useRef, useState, type ComponentProps, type DragEvent, type ReactNode } from "react";

import { cn } from "../lib/cn";
import { Button } from "./button";

/** "48,2 KB", "1,2 MB": o tamanho sai formatado, nunca digitado. */
const UNIT = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

function fileSize(bytes: number) {
  if (bytes < 1024) return `${UNIT.format(bytes)} B`;
  if (bytes < 1024 * 1024) return `${UNIT.format(bytes / 1024)} KB`;
  return `${UNIT.format(bytes / (1024 * 1024))} MB`;
}

export type Rejection = {
  file: File;
  /** Pronto para um toast: "maior que 5 MB", "tipo não aceito". */
  reason: string;
};

/** A mesma regra do seletor nativo: extensão com ponto, MIME, ou `tipo/*`. */
function matchesAccept(file: File, accept: string) {
  const wanted = accept.split(",").map((token) => token.trim().toLowerCase());
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  return wanted.some((token) => {
    if (token.startsWith(".")) return name.endsWith(token);
    if (token.endsWith("/*")) return type.startsWith(token.slice(0, -1));
    return type === token;
  });
}

export type FileUploadProps = {
  /** A frase da área: "Arraste o XML da nota, ou clique para escolher". */
  label: ReactNode;
  /** A letra miúda: formatos e limite, para a pessoa não descobrir na recusa. */
  hint?: ReactNode;
  /** Como no seletor nativo: `.xml,application/pdf`, `image/*`. */
  accept?: string;
  multiple?: boolean;
  /** Em bytes. Arquivo maior não entra: vira recusa com o motivo. */
  maxSize?: number;
  disabled?: boolean;
  /** Os que passaram na validação. Subir é trabalho do app, que conhece a rede. */
  onSelect?: (files: File[]) => void;
  /** Os que não passaram, cada um com o motivo legível. */
  onReject?: (rejections: Rejection[]) => void;
  className?: string;
};

/**
 * A área de anexar: clique abre o seletor, arrastar acende, soltar valida.
 *
 * A peça não conhece rede, de propósito, como o `DataTable` não conhece React
 * Query: fetch, progresso e retry são do app. Ela entrega `File` validado e
 * apresenta o estado que o app informar nos itens.
 */
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
  const input = useRef<HTMLInputElement>(null);
  // Contador, e nao booleano: entrar num filho dispara dragleave do pai, e
  // com booleano a borda piscava a cada texto atravessado.
  const [dragDepth, setDragDepth] = useState(0);

  function deliver(list: FileList | File[] | null) {
    if (!list || disabled) return;
    const files = [...list];
    const accepted: File[] = [];
    const rejected: Rejection[] = [];

    for (const file of files) {
      if (accept && !matchesAccept(file, accept)) {
        rejected.push({ file, reason: "tipo não aceito" });
      } else if (maxSize !== undefined && file.size > maxSize) {
        rejected.push({ file, reason: `maior que ${fileSize(maxSize)}` });
      } else {
        accepted.push(file);
      }
    }

    const kept = multiple ? accepted : accepted.slice(0, 1);
    if (kept.length > 0) onSelect?.(kept);
    if (rejected.length > 0) onReject?.(rejected);
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setDragDepth(0);
    deliver(event.dataTransfer?.files ?? null);
  }

  return (
    <div className={className}>
      <button
        type="button"
        disabled={disabled}
        data-drag={dragDepth > 0 ? "" : undefined}
        onClick={() => input.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled) setDragDepth((depth) => depth + 1);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragDepth((depth) => Math.max(0, depth - 1))}
        onDrop={handleDrop}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 rounded-lg",
          "border border-dashed border-border-strong bg-surface px-6 py-8",
          "font-sans text-base text-fg-muted",
          "transition-colors duration-[var(--rc-duration-fast)] ease-rc",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
          "hover:border-line-hover hover:text-fg",
          "data-drag:border-accent data-drag:bg-accent-subtle data-drag:text-fg",
          "disabled:pointer-events-none disabled:text-fg-disabled",
        )}
      >
        <UploadCloud size={20} aria-hidden="true" className="text-fg-subtle" />
        <span>{label}</span>
        {hint && <span className="text-sm text-fg-subtle">{hint}</span>}
      </button>

      {/* O input de verdade, escondido: e ele que abre o seletor nativo e
          carrega accept e multiple, entao o dialogo do sistema ja filtra. */}
      <input
        ref={input}
        type="file"
        hidden
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(event) => {
          deliver(event.target.files);
          // O mesmo arquivo de novo dispara change de novo.
          event.target.value = "";
        }}
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}

export type FileUploadListProps = ComponentProps<"ul">;

export function FileUploadList({ className, ...props }: FileUploadListProps) {
  return <ul {...props} className={cn("mt-3 space-y-2", className)} />;
}

export type FileUploadItemProps = {
  name: string;
  /** Em bytes. A formatacao ("48,2 KB") e da peca. */
  size: number;
  /** 0 a 100 vira barra. Omitido, o arquivo esta pronto. */
  progress?: number;
  /** Vence o progresso: mostra o texto e oferece nova tentativa. */
  error?: ReactNode;
  onRetry?: () => void;
  onRemove: () => void;
  className?: string;
};

export function FileUploadItem({
  name,
  size,
  progress,
  error,
  onRetry,
  onRemove,
  className,
}: FileUploadItemProps) {
  const uploading = error === undefined && progress !== undefined;

  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-md border border-border bg-surface px-3 py-2.5",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="truncate font-sans text-sm text-fg">{name}</span>
          <span className="shrink-0 font-mono text-xs text-fg-subtle">{fileSize(size)}</span>
        </div>

        {uploading && (
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
            aria-label={`Enviando ${name}`}
            className="mt-2 h-1 overflow-hidden rounded-pill bg-skeleton"
          >
            <div
              className="h-full rounded-pill bg-accent transition-[width] duration-[var(--rc-duration-base)] ease-rc"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        )}

        {error !== undefined && (
          <p className="mt-1 flex items-center gap-2 text-xs text-danger-text">
            {error}
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className={cn(
                  "inline-flex items-center gap-1 rounded-sm text-fg-muted underline-offset-2",
                  "hover:text-fg hover:underline",
                  "outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                <RotateCw size={12} aria-hidden="true" />
                Tentar de novo
              </button>
            )}
          </p>
        )}
      </div>

      <Button
        size="iconSm"
        variant="ghost"
        aria-label={`Remover ${name}`}
        onClick={onRemove}
        data-rc-keep-row=""
      >
        <Trash2 size={14} />
      </Button>
    </li>
  );
}
