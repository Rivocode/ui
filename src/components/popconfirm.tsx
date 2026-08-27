"use client";

import { TriangleAlert } from "lucide-react";
import {
  useEffect,
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

const CANCEL_BLOCKED = cn(
  "aria-disabled:cursor-not-allowed aria-disabled:border-transparent",
  "aria-disabled:bg-surface-raised aria-disabled:text-fg-disabled aria-disabled:shadow-none",
);

export type PopconfirmProps = Omit<
  ComponentProps<"div">,
  "title" | "children" | "onCancel" | "onSubmit"
> &
  FloatingPositionProps & {
    /** O botao que abre a confirmacao. E nele que o painel ancora. */
    trigger: ReactElement;
    /** A pergunta, curta e com o alvo dentro: "Excluir a nota 4813?". */
    title: string;
    /**
     * Em que nivel a pergunta sai. Padrao `h2`, como no `DialogTitle` e no
     * `AlertDialogTitle`.
     *
     * Baixe quando o painel nascer dentro de uma secao que ja tem titulo: o
     * gatilho costuma ser um botao de linha dentro de um `Card`, cujo
     * `CardTitle` e `h3`, e um `h2` ali abre uma secao acima da que o contem.
     * O esboco da pagina, que e como muita gente navega, inverte.
     */
    titleAs?: "h2" | "h3" | "h4";
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
     * O que o leitor de tela ouve quando a espera comeca, dentro do painel.
     * Sem isto a espera e muda: o painel nao troca de nome e o unico sinal
     * mora no botao. O padrao repete o verbo do `confirmLabel`.
     */
    busyLabel?: string;
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
  titleAs: Title = "h2",
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
  busyLabel,
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
  const [notice, setNotice] = useState("");
  const cancelRef = useRef<HTMLButtonElement>(null);
  const labelId = useId();
  const descriptionId = useId();

  const open = openProp ?? selfOpen;
  const busy = loading || pending;

  const busyMessage = busyLabel ?? `${confirmLabel}: ação em andamento. Aguarde.`;
  const blockedMessage = "Não dá para cancelar enquanto a ação está em andamento.";

  useEffect(() => {
    setNotice(busy ? busyMessage : "");
  }, [busy, busyMessage]);

  /*
   * Quem aperta o confirmar segura o foco nele, e o `loading` do Button o
   * marca `disabled` de verdade - o navegador larga o foco no `<body>`, e o Tab
   * seguinte sai do painel. Ter um alvo vivo nao basta: alguem tem que MOVER o
   * foco ate ele.
   *
   * A 0.8.0 consertou so a metade de ter o alvo, e a outra metade so aparece em
   * Chromium e Firefox - o WebKit segura o foco dentro sozinho, entao um teste
   * rodado so no Safari passa com o defeito de pe.
   *
   * O destino e o cancelar, e nao a moldura: ele e o unico controle que a
   * pessoa ainda pode usar, e cair nele e a resposta a "e agora?".
   */
  useEffect(() => {
    if (!busy) return;

    // So quando o foco caiu no vazio. Se a pessoa moveu o foco para outro lugar
    // de proposito, o `activeElement` nao e o `<body>` e nada e roubado dela.
    const perdido = document.activeElement === null || document.activeElement === document.body;
    if (!perdido) return;

    cancelRef.current?.focus();
  }, [busy]);

  function move(next: boolean) {
    if (openProp === undefined) setSelfOpen(next);
    onOpenChange?.(next);
  }

  function handleOpenChange(next: boolean, details: CloseRequest) {
    if (!next && busy) {
      details.cancel();
      setNotice(blockedMessage);
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
        <Title
          id={labelId}
          className={cn(
            "font-display text-base leading-[var(--rc-leading-tight)] tracking-tight text-fg",
            classNames?.title,
          )}
        >
          {title}
        </Title>
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

  const status = (
    <div role="status" aria-live="polite" className="sr-only">
      {notice}
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
          {status}
          <div className={cn("mt-5 flex flex-col-reverse gap-2 [&>*]:w-full", classNames?.footer)}>
            <SheetClose
              aria-disabled={busy || undefined}
              render={<Button type="button" variant="secondary" size="md" ref={cancelRef} />}
              className={cn(CANCEL_BLOCKED, classNames?.cancel)}
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
        {status}
        <div className={cn("mt-4 flex items-center justify-end gap-2", classNames?.footer)}>
          <PopoverClose
            aria-disabled={busy || undefined}
            render={<Button type="button" variant="secondary" size="sm" ref={cancelRef} />}
            className={cn(CANCEL_BLOCKED, classNames?.cancel)}
          >
            {cancelLabel}
          </PopoverClose>
          {confirmButton}
        </div>
      </PopoverContent>
    </Popover>
  );
}
