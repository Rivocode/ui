"use client";

import { RotateCw, Trash2, UploadCloud } from "lucide-react";
import { useRef, useState, type ComponentProps, type DragEvent, type ReactNode } from "react";

import { cn } from "../lib/cn";
import { IconButton } from "./icon-button";

const UNIT = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

function fileSize(bytes: number) {
  if (bytes < 1024) return `${UNIT.format(bytes)} B`;
  if (bytes < 1024 * 1024) return `${UNIT.format(bytes / 1024)} KB`;
  return `${UNIT.format(bytes / (1024 * 1024))} MB`;
}

export type Rejection = {
  file: File;
  /** Ready for a toast: "maior que 5 MB", "tipo não aceito". */
  reason: string;
};

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

export type FileUploadProps = Omit<ComponentProps<"div">, "onSelect" | "children"> & {
  /** The area's sentence: "Arraste o XML da nota, ou clique para escolher". */
  label: ReactNode;
  /** The fine print: formats and limit, so the person does not find out on rejection. */
  hint?: ReactNode;
  /** Like in the native picker: `.xml,application/pdf`, `image/*`. */
  accept?: string;
  /**
   * Without it, the first file gets in and the others become rejections, with the reason `tooMany`.
   */
  multiple?: boolean;
  /** In bytes. A bigger file does not get in: it becomes a rejection with the reason. */
  maxSize?: number;
  disabled?: boolean;
  /** The ones that passed validation. Uploading is the app's job, since it knows the network. */
  onSelect?: (files: File[]) => void;
  /** The ones that did not pass, each with a readable reason. */
  onReject?: (rejections: Rejection[]) => void;
  className?: string;
  /**
   * The rejection reasons, to change the language: `invalidType` is the one for a type outside
   * `accept`, `tooLarge` receives the limit already written ("5 MB") and returns the
   * one for a file that is too big, and `tooMany` is the one for the leftover file when
   * `multiple` is off and several arrive. Pass only the ones that change.
   */
  labels?: Partial<FileUploadLabels>;
};

export type FileUploadLabels = {
  invalidType: string;
  tooLarge: (limit: string) => string;
  tooMany?: string;
};

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
  ...rest
}: FileUploadProps) {
  const input = useRef<HTMLInputElement>(null);
  const [dragDepth, setDragDepth] = useState(0);

  function deliver(list: FileList | File[] | null) {
    if (!list || disabled) return;
    const files = [...list];
    const accepted: File[] = [];
    const rejected: Rejection[] = [];

    for (const file of files) {
      if (accept && !matchesAccept(file, accept)) {
        rejected.push({ file, reason: labels?.invalidType ?? "tipo não aceito" });
      } else if (maxSize !== undefined && file.size > maxSize) {
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
    for (const file of accepted.slice(kept.length)) {
      rejected.push({ file, reason: labels?.tooMany ?? "só um arquivo por vez" });
    }
    if (kept.length > 0) onSelect?.(kept);
    if (rejected.length > 0) onReject?.(rejected);
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setDragDepth(0);
    deliver(event.dataTransfer?.files ?? null);
  }

  return (
    <div {...rest} className={className}>
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

      <input
        ref={input}
        type="file"
        hidden
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(event) => {
          deliver(event.target.files);
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
  /** In bytes. The formatting ("48,2 KB") is the piece's. */
  size: number;
  /** 0 to 100 becomes a bar. Omitted, the file is ready. */
  progress?: number;
  /** Wins over progress: shows the text and offers a retry. */
  error?: ReactNode;
  onRetry?: () => void;
  onRemove: () => void;
  className?: string;
  /**
   * The row's texts, to change the language: `retry` is the retry
   * button, and `remove` and `uploading` receive the file name and return the
   * name of the remove button and of the progress bar. Pass only the ones
   * that change.
   */
  labels?: Partial<FileUploadItemLabels>;
};

export type FileUploadItemLabels = {
  retry: string;
  remove: (name: string) => string;
  uploading: (name: string) => string;
};

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
  const uploading = error === undefined && progress !== undefined;

  return (
    <li
      className={cn(
        "flex animate-enter items-center gap-3 rounded-md border border-border bg-surface px-3 py-2.5",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <span title={name} className="truncate font-sans text-sm text-fg">
            {name}
          </span>
          <span className="shrink-0 font-mono text-xs text-fg-subtle">{fileSize(size)}</span>
        </div>

        {uploading && (
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
            aria-label={labels?.uploading ? labels.uploading(name) : `Enviando ${name}`}
            className="mt-2 h-1 overflow-hidden rounded-pill bg-skeleton"
          >
            <div
              className="h-full rounded-pill bg-accent-text transition-[width] duration-[var(--rc-duration-base)] ease-rc"
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
                {labels?.retry ?? "Tentar de novo"}
              </button>
            )}
          </p>
        )}
      </div>

      <IconButton
        type="button"
        size="sm"
        variant="ghost"
        label={labels?.remove ? labels.remove(name) : `Remover ${name}`}
        onClick={onRemove}
        data-rc-keep-row=""
      >
        <Trash2 size={14} />
      </IconButton>
    </li>
  );
}
