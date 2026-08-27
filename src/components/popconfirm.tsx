"use client";

import { TriangleAlert } from "lucide-react";
import {
  useId,
  useRef,
  useState,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from "react";

import { cn } from "../lib/cn";
import { FLOATING_SIDE_OFFSET, type FloatingPositionProps } from "../lib/positioning";
import { useMobile } from "../lib/screen";
import type { Slots } from "../lib/slots";
import { Button } from "./button";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "./popover";
import { Sheet, SheetClose, SheetContent, SheetHandle, SheetTrigger } from "./sheet";

type CloseRequest = { cancel: () => void };

export type PopconfirmProps = Omit<
  ComponentProps<"div">,
  "title" | "children" | "onCancel" | "onSubmit"
> &
  FloatingPositionProps & {
    /** O botao que abre a confirmacao. E nele que o painel ancora. */
    trigger: ReactElement;
    /** A pergunta, curta e com o alvo dentro: "Excluir a nota 4813?". */
    title: string;
    /** O que a pessoa perde ao confirmar, ou o que acontece depois. */
    description?: ReactNode;
    /**
     * O verbo do botao que executa. Escreva a acao - "Excluir", "Cancelar
     * nota" -, porque so o verbo distingue os dois botoes num painel deste
     * tamanho.
     */
    confirmLabel?: string;
    /** O verbo do botao que sai sem fazer nada. */
    cancelLabel?: string;
    /**
     * `danger` pinta o botao de vermelho e traz o icone de aviso; `neutral`
     * serve para o que se desfaz, como arquivar.
     */
    tone?: "danger" | "neutral";
    /**
     * A acao. Devolvendo promessa, o painel fica aberto e o botao entra em
     * espera ate ela terminar - e um clique so vira uma chamada so. Promessa
     * que rejeita devolve o painel ao estado anterior, com o texto ainda na
     * tela.
     */
    onConfirm: () => void | Promise<unknown>;
    /** Chamado em toda saida sem confirmar: botao, Esc, clique fora, arrasto. */
    onCancel?: () => void;
    /** Deixa a abertura por conta de quem usa. Sem ela, a peca se controla. */
    open?: boolean;
    /** Estado inicial de quem nao controla a abertura. */
    defaultOpen?: boolean;
    /** Avisa toda abertura e todo fechamento, controlado ou nao. */
    onOpenChange?: (open: boolean) => void;
    /**
     * Estado de espera vindo de fora, para quem ja tem a chamada em uma
     * store. Soma com a espera da promessa do `onConfirm`.
     */
    loading?: boolean;
    /**
     * Para onde o foco volta ao fechar. Vale quando o proprio gatilho some na
     * confirmacao - a linha excluida leva o botao junto, e sem isto o foco cai
     * no corpo da pagina.
     */
    finalFocus?: RefObject<HTMLElement | null>;
    /**
     * Classe por parte: `title`, `description`, `footer`, `confirm`,
     * `cancel`. O `className` veste o painel.
     */
    classNames?: Slots<"title" | "description" | "footer" | "confirm" | "cancel">;
  };

export function Popconfirm({
  trigger,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  tone = "danger",
  onConfirm,
  onCancel,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  loading = false,
  finalFocus,
  classNames,
  className,
  side,
  align,
  sideOffset = FLOATING_SIDE_OFFSET,
  ...rest
}: PopconfirmProps) {
  const isMobile = useMobile();
  const [selfOpen, setSelfOpen] = useState(defaultOpen);
  const [pending, setPending] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const labelId = useId();
  const descriptionId = useId();

  const open = openProp ?? selfOpen;
  const busy = loading || pending;

  function move(next: boolean) {
    if (openProp === undefined) setSelfOpen(next);
    onOpenChange?.(next);
  }

  function handleOpenChange(next: boolean, details: CloseRequest) {
    if (!next && busy) {
      details.cancel();
      return;
    }

    move(next);
    if (!next) onCancel?.();
  }

  async function confirm() {
    if (busy) return;

    const running = onConfirm();
    if (running && typeof running.then === "function") {
      setPending(true);
      try {
        await running;
      } catch {
        setPending(false);
        return;
      }
      setPending(false);
    }

    move(false);
  }

  const body = (
    <div className="flex gap-2.5">
      {tone === "danger" && (
        <TriangleAlert size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-danger-text" />
      )}
      <div className="min-w-0">
        <h2
          id={labelId}
          className={cn(
            "font-display text-base leading-[var(--rc-leading-tight)] tracking-tight text-fg",
            classNames?.title,
          )}
        >
          {title}
        </h2>
        {description && (
          <p
            id={descriptionId}
            className={cn("mt-1 text-sm text-fg-muted", classNames?.description)}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  );

  const confirmButton = (
    <Button
      type="button"
      variant={tone === "danger" ? "destructive" : "primary"}
      size={isMobile ? "md" : "sm"}
      loading={busy}
      onClick={confirm}
      className={classNames?.confirm}
    >
      {confirmLabel}
    </Button>
  );

  const described = description ? descriptionId : undefined;

  if (isMobile) {
    return (
      <Sheet
        side="bottom"
        open={open}
        onOpenChange={handleOpenChange}
        disablePointerDismissal={busy}
      >
        <SheetTrigger render={trigger} />
        <SheetContent
          {...rest}
          role="alertdialog"
          aria-labelledby={labelId}
          aria-describedby={described}
          finalFocus={finalFocus}
          initialFocus={cancelRef}
          className={className}
        >
          <SheetHandle />
          {body}
          <div className={cn("mt-5 flex flex-col-reverse gap-2 [&>*]:w-full", classNames?.footer)}>
            <SheetClose
              disabled={busy}
              render={<Button type="button" variant="secondary" size="md" ref={cancelRef} />}
              className={classNames?.cancel}
            >
              {cancelLabel}
            </SheetClose>
            {confirmButton}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange} modal="trap-focus">
      <PopoverTrigger render={trigger} />
      <PopoverContent
        {...rest}
        role="alertdialog"
        aria-labelledby={labelId}
        aria-describedby={described}
        side={side}
        align={align}
        sideOffset={sideOffset}
        initialFocus={cancelRef}
        finalFocus={finalFocus}
        className={cn("w-[min(20rem,calc(100vw-2rem))]", className)}
      >
        {body}
        <div className={cn("mt-4 flex items-center justify-end gap-2", classNames?.footer)}>
          <PopoverClose
            disabled={busy}
            render={<Button type="button" variant="secondary" size="sm" ref={cancelRef} />}
            className={classNames?.cancel}
          >
            {cancelLabel}
          </PopoverClose>
          {confirmButton}
        </div>
      </PopoverContent>
    </Popover>
  );
}
