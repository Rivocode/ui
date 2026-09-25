"use client";

import { Field as BaseField } from "@base-ui/react/field";
import { Eraser, Keyboard, PenLine, Undo2 } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type FocusEvent,
  type PointerEvent,
  type Ref,
} from "react";

import { cn } from "../lib/cn";
import type { Slots } from "../lib/slots";
import {
  SIGNATURE_BASELINE,
  SIGNATURE_FONT,
  SIGNATURE_LABELS,
  extendStroke,
  isSignatureEmpty,
  signaturePaths,
  signatureSize,
  signatureSvg,
  typedLayout,
  type SignaturePadLabels,
  type SignaturePoint,
  type SignatureStroke,
  type SignatureValue,
} from "../shared/signature";
import { Button } from "./button";
import { inputVariants } from "./field";
import { IconButton } from "./icon-button";

export type SignatureExportOptions = {
  /**
   * A cor da tinta. Sem ela, a do token `--rc-signature-ink`, que e escura nos
   * dois temas: a assinatura feita no tema escuro nao sai clara no documento.
   */
  ink?: string;
  /**
   * O fundo. `true` pinta o papel do token `--rc-signature-paper`, uma cor
   * pinta aquela cor, e sem ele o fundo sai transparente, para assentar sobre
   * o documento.
   */
  paper?: boolean | string;
};

export type SignaturePngOptions = SignatureExportOptions & {
  /** Quantos pixels por unidade do desenho. `2` da 1200px de largura, nitido em tela densa. */
  scale?: number;
};

export type SignaturePadProps = Omit<
  ComponentPropsWithoutRef<"div">,
  "defaultValue" | "onChange" | "children"
> & {
  /**
   * A assinatura, controlada: os tracos desenhados (`kind: "drawn"`) ou o nome
   * digitado (`kind: "typed"`). `null` e sem assinatura. Use com `onValueChange`.
   */
  value?: SignatureValue | null;
  /** A assinatura ao montar, quando ninguem controla. Sem ela, vazia. */
  defaultValue?: SignatureValue | null;
  /**
   * Chamado ao fim de cada traco, a cada letra digitada, ao desfazer e ao
   * limpar. Chega `null` quando a area fica vazia, que e o que o schema do
   * formulario le como "sem assinatura".
   */
  onValueChange?: (value: SignatureValue | null) => void;
  /** Trava o desenho, a digitacao e os botoes. Dentro de um `Field` desabilitado, trava sozinho. */
  disabled?: boolean;
  /** So exibe a assinatura: sem desenho, sem botoes e sem o modo de digitar. */
  readOnly?: boolean;
  /**
   * Pinta a moldura de perigo e anuncia `aria-invalid`. Dentro de um `Field`
   * com `invalid`, ou de um `FormField` com erro, liga sozinho.
   */
  invalid?: boolean;
  /**
   * Nome do campo num `<form>`: vai num `input` escondido com o SVG da
   * assinatura, e vazio quando nao ha assinatura.
   */
  name?: string;
  /** Largura sobre altura da area. Padrao `3`: 600 por 200 unidades de desenho. */
  ratio?: number;
  /**
   * A familia cursiva do modo de digitar, em CSS (`'"Great Vibes", cursive'`).
   * Carregue a fonte na pagina: sem ela, o navegador cai na cursiva do sistema.
   */
  font?: string;
  /** Em que modo a area abre quando esta vazia. Padrao `draw`. */
  defaultMode?: "draw" | "type";
  /** Os textos da peca: rotulos dos botoes, instrucao, "Assine aqui" e o que o leitor de tela ouve. */
  labels?: Partial<SignaturePadLabels>;
  /** Classe por parte: `pad` (o papel), `placeholder`, `baseline`, `actions` e `input` (o campo do nome). */
  classNames?: Slots<"pad" | "placeholder" | "baseline" | "actions" | "input">;
  ref?: Ref<HTMLDivElement>;
};

type Colors = { ink: string; paper: string };

const FALLBACK: Colors = { ink: "currentColor", paper: "transparent" };

function readColors(): Colors {
  if (typeof document === "undefined" || typeof getComputedStyle !== "function") return FALLBACK;
  const style = getComputedStyle(document.documentElement);
  return {
    ink: style.getPropertyValue("--rc-signature-ink").trim() || FALLBACK.ink,
    paper: style.getPropertyValue("--rc-signature-paper").trim() || FALLBACK.paper,
  };
}

function exportColors(options: SignatureExportOptions): { ink: string; paper?: string } {
  const colors = readColors();
  const paper =
    options.paper === true
      ? colors.paper
      : typeof options.paper === "string"
        ? options.paper
        : undefined;
  return { ink: options.ink ?? colors.ink, paper };
}

export function signatureToSvg(
  value: SignatureValue | null | undefined,
  options: SignatureExportOptions = {},
): string {
  return signatureSvg(value ?? null, exportColors(options));
}

export async function signatureToPng(
  value: SignatureValue | null | undefined,
  options: SignaturePngOptions = {},
): Promise<string> {
  if (!value || isSignatureEmpty(value)) return "";
  const { ink, paper } = exportColors(options);
  const scale = options.scale ?? 2;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(value.width * scale);
  canvas.height = Math.round(value.height * scale);
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error(
      "[rivocode/ui] signatureToPng: o navegador não entregou o contexto 2d do canvas, " +
        "e sem ele não há imagem. Use signatureToSvg, que não depende de canvas.",
    );
  }

  context.scale(scale, scale);
  if (paper) {
    context.fillStyle = paper;
    context.fillRect(0, 0, value.width, value.height);
  }
  context.fillStyle = ink;

  if (value.kind === "typed") {
    const layout = typedLayout(value.text, value.width, value.height);
    const spec = `${layout.fontSize}px ${value.font}`;
    await document.fonts?.load(spec).catch(() => undefined);
    context.font = spec;
    context.textAlign = "center";
    context.textBaseline = "alphabetic";
    if (layout.fit) context.fillText(value.text.trim(), layout.x, layout.y, layout.fit);
    else context.fillText(value.text.trim(), layout.x, layout.y);
  } else {
    for (const path of signaturePaths(value.strokes)) context.fill(new Path2D(path));
  }

  return canvas.toDataURL("image/png");
}

export function SignaturePad({
  value,
  defaultValue = null,
  onValueChange,
  disabled = false,
  readOnly = false,
  invalid = false,
  name,
  id,
  ...props
}: SignaturePadProps) {
  const controlled = value !== undefined;
  const [own, setOwn] = useState<SignatureValue | null>(defaultValue);
  const current = controlled ? value : own;
  const [colors, setColors] = useState<Colors>(FALLBACK);

  useEffect(() => setColors(readColors()), []);

  function commit(next: SignatureValue | null) {
    const normalized = isSignatureEmpty(next) ? null : next;
    if (!controlled) setOwn(normalized);
    onValueChange?.(normalized);
  }

  const svg = signatureSvg(current, { ink: colors.ink });

  return (
    <BaseField.Control
      id={id}
      name={name}
      disabled={disabled}
      value={svg}
      render={(fieldProps, fieldState) => (
        <Pad
          {...props}
          fieldProps={fieldProps as FieldProps}
          current={current}
          svg={svg}
          commit={commit}
          readOnly={readOnly}
          invalid={invalid || fieldState.valid === false}
        />
      )}
    />
  );
}

type FieldProps = {
  id?: string;
  name?: string;
  disabled?: boolean;
  ref?: Ref<HTMLInputElement>;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  onFocus?: (event: FocusEvent<HTMLInputElement>) => void;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
};

type PadProps = Omit<
  SignaturePadProps,
  "value" | "defaultValue" | "onValueChange" | "disabled" | "invalid" | "name" | "id"
> & {
  fieldProps: FieldProps;
  current: SignatureValue | null;
  svg: string;
  commit: (next: SignatureValue | null) => void;
  invalid: boolean;
};

function Pad({
  fieldProps,
  current,
  svg,
  commit,
  readOnly = false,
  invalid,
  ratio = 3,
  font = SIGNATURE_FONT,
  defaultMode = "draw",
  labels: labelsProp,
  className,
  classNames,
  ref,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
  ...props
}: PadProps) {
  const labels = { ...SIGNATURE_LABELS, ...labelsProp };
  const disabled = Boolean(fieldProps.disabled);
  const interactive = !disabled && !readOnly;
  const size = signatureSize(ratio);
  const instructionId = useId();
  const inputId = useId();
  const typedInput = useRef<HTMLInputElement>(null);
  const modeButton = useRef<HTMLButtonElement>(null);

  const [chosen, setChosen] = useState<"draw" | "type">(defaultMode);
  const mode = current?.kind === "typed" ? "type" : current?.kind === "drawn" ? "draw" : chosen;
  const [focusTyped, setFocusTyped] = useState(false);
  const [status, setStatus] = useState("");
  const drafts = useRef<{ drawn: SignatureValue | null; typed: string }>({ drawn: null, typed: "" });

  const active = useRef<number | null>(null);
  const stroke = useRef<SignatureStroke>([]);
  const [live, setLive] = useState<SignatureStroke | null>(null);

  const strokes = current?.kind === "drawn" ? current.strokes : [];
  const text = current?.kind === "typed" ? current.text : "";
  const empty = isSignatureEmpty(current) && !live;

  useEffect(() => {
    if (!focusTyped) return;
    typedInput.current?.focus();
    setFocusTyped(false);
  }, [focusTyped]);

  function place(event: { clientX: number; clientY: number }, box: DOMRect) {
    const x = ((event.clientX - box.left) / (box.width || 1)) * size.width;
    const y = ((event.clientY - box.top) / (box.height || 1)) * size.height;
    return {
      x: Math.round(Math.min(size.width, Math.max(0, x)) * 100) / 100,
      y: Math.round(Math.min(size.height, Math.max(0, y)) * 100) / 100,
    };
  }

  function locate(event: PointerEvent<HTMLDivElement>, box: DOMRect): SignaturePoint[] {
    const native = event.nativeEvent;
    const samples =
      typeof native.getCoalescedEvents === "function" ? native.getCoalescedEvents() : [];
    const list = samples.length > 0 ? samples : [native];
    return list.map((sample) => {
      const point: SignaturePoint = { ...place(sample, box), time: Math.round(sample.timeStamp) };
      if (sample.pointerType === "pen" && sample.pressure > 0) point.pressure = sample.pressure;
      return point;
    });
  }

  function start(event: PointerEvent<HTMLDivElement>) {
    if (!interactive || mode !== "draw" || active.current !== null) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    active.current = event.pointerId;
    const box = event.currentTarget.getBoundingClientRect();
    const point: SignaturePoint = { ...place(event, box), time: Math.round(event.timeStamp) };
    if (event.pointerType === "pen" && event.pressure > 0) point.pressure = event.pressure;
    stroke.current = [point];
    setLive(stroke.current);
  }

  function move(event: PointerEvent<HTMLDivElement>) {
    if (active.current !== event.pointerId) return;
    const box = event.currentTarget.getBoundingClientRect();
    let next = stroke.current;
    for (const point of locate(event, box)) next = extendStroke(next, point);
    if (next === stroke.current) return;
    stroke.current = next;
    setLive(next);
  }

  function finish(event: PointerEvent<HTMLDivElement>) {
    if (active.current !== event.pointerId) return;
    active.current = null;
    const done = stroke.current;
    stroke.current = [];
    setLive(null);
    if (done.length === 0) return;
    setStatus("");
    commit({ kind: "drawn", strokes: [...strokes, done], ...size });
  }

  function keepFocus(button: HTMLElement | null) {
    if (button && button === button.ownerDocument.activeElement) {
      if (mode === "type") typedInput.current?.focus();
      else modeButton.current?.focus();
    }
  }

  function undo(event: { currentTarget: HTMLElement }) {
    const rest = strokes.slice(0, -1);
    const target = event.currentTarget;
    commit(rest.length > 0 ? { kind: "drawn", strokes: rest, ...size } : null);
    setStatus(labels.undone);
    if (rest.length === 0) keepFocus(target);
  }

  function clear(event: { currentTarget: HTMLElement }) {
    const target = event.currentTarget;
    if (mode === "type") drafts.current.typed = "";
    else drafts.current.drawn = null;
    commit(null);
    setStatus(labels.cleared);
    keepFocus(target);
  }

  function switchMode() {
    setStatus("");
    if (mode === "draw") {
      drafts.current.drawn = current?.kind === "drawn" ? current : null;
      setChosen("type");
      const saved = drafts.current.typed;
      commit(saved.trim() ? { kind: "typed", text: saved, font, ...size } : null);
      setFocusTyped(true);
      return;
    }
    drafts.current.typed = text;
    setChosen("draw");
    commit(drafts.current.drawn);
  }

  const described =
    [instructionId, ariaDescribedBy, fieldProps["aria-describedby"]].filter(Boolean).join(" ") ||
    undefined;
  const labelledBy = ariaLabelledBy ?? fieldProps["aria-labelledby"];
  const summary =
    current?.kind === "typed" && !isSignatureEmpty(current)
      ? labels.typed(current.text.trim())
      : strokes.length > 0
        ? labels.drawn(strokes.length)
        : labels.empty;
  const layout = typedLayout(text, size.width, size.height);
  const baseline = size.height * SIGNATURE_BASELINE;
  const scaleX = current?.kind === "drawn" ? current.width : size.width;
  const scaleY = current?.kind === "drawn" ? current.height : size.height;

  return (
    <div
      {...props}
      ref={ref}
      id={fieldProps.id}
      role="group"
      aria-label={ariaLabel ?? (labelledBy ? undefined : labels.group)}
      aria-labelledby={ariaLabel ? undefined : labelledBy}
      aria-describedby={described}
      aria-invalid={(invalid && !disabled) || undefined}
      data-invalid={(invalid && !disabled) || undefined}
      data-disabled={disabled || undefined}
      data-readonly={readOnly || undefined}
      data-mode={mode}
      data-empty={empty || undefined}
      className={cn("flex w-full flex-col gap-2 font-sans", className)}
    >
      <input
        ref={fieldProps.ref}
        type="hidden"
        name={fieldProps.name}
        value={svg}
        disabled={disabled}
      />

      <div
        role="img"
        aria-label={summary}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={finish}
        onPointerCancel={finish}
        onLostPointerCapture={finish}
        style={{ aspectRatio: String(size.width / size.height) }}
        className={cn(
          "relative w-full touch-none overflow-hidden rounded-md border bg-signature-paper select-none",
          "transition-colors duration-[var(--rc-duration-fast)] ease-rc",
          invalid && !disabled
            ? "border-danger"
            : disabled
              ? "border-border-disabled"
              : "border-border-strong",
          interactive && mode === "draw" ? "cursor-crosshair" : disabled && "cursor-not-allowed",
          classNames?.pad,
        )}
      >
        <svg
          aria-hidden="true"
          viewBox={`0 0 ${size.width} ${size.height}`}
          className="pointer-events-none absolute inset-0 size-full"
        >
          <line
            x1={size.width * 0.06}
            x2={size.width * 0.94}
            y1={baseline}
            y2={baseline}
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
            className={cn(
              disabled ? "stroke-signature-disabled" : "stroke-signature-guide",
              classNames?.baseline,
            )}
          />
          <svg
            x={0}
            y={0}
            width={size.width}
            height={size.height}
            viewBox={`0 0 ${scaleX} ${scaleY}`}
          >
            {signaturePaths(strokes).map((path, index) => (
              <path key={index} d={path} className="fill-signature-ink" />
            ))}
            {live ? <path d={signaturePaths([live])[0]} className="fill-signature-ink" /> : null}
          </svg>
          {mode === "type" && text.trim() ? (
            <text
              x={layout.x}
              y={layout.y}
              fontSize={layout.fontSize}
              textAnchor="middle"
              textLength={layout.fit}
              lengthAdjust={layout.fit ? "spacingAndGlyphs" : undefined}
              style={{ fontFamily: font }}
              className="fill-signature-ink"
            >
              {text.trim()}
            </text>
          ) : null}
        </svg>

        {empty ? (
          <span
            aria-hidden="true"
            style={{ bottom: `${(1 - SIGNATURE_BASELINE) * 100}%` }}
            className={cn(
              "pointer-events-none absolute start-[6%] mb-1.5 text-sm",
              disabled ? "text-signature-disabled" : "text-signature-guide",
              classNames?.placeholder,
            )}
          >
            {labels.placeholder}
          </span>
        ) : null}
      </div>

      <p id={instructionId} className="sr-only">
        {labels.instruction}
      </p>

      {mode === "type" && !readOnly ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor={inputId} className="text-sm font-rc-medium text-fg">
            {labels.typedName}
          </label>
          <input
            ref={typedInput}
            id={inputId}
            type="text"
            autoComplete="name"
            maxLength={80}
            disabled={disabled}
            value={text || drafts.current.typed}
            onChange={(event) => {
              drafts.current.typed = event.target.value;
              commit({ kind: "typed", text: event.target.value, font, ...size });
            }}
            aria-invalid={(invalid && !disabled) || undefined}
            data-invalid={(invalid && !disabled) || undefined}
            className={cn(inputVariants({ size: "md" }), classNames?.input)}
          />
        </div>
      ) : null}

      {readOnly ? null : (
        <div className={cn("flex flex-wrap items-center justify-between gap-2", classNames?.actions)}>
          <Button
            ref={modeButton}
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={switchMode}
          >
            {mode === "draw" ? (
              <Keyboard aria-hidden="true" className="size-4" />
            ) : (
              <PenLine aria-hidden="true" className="size-4" />
            )}
            {mode === "draw" ? labels.typeMode : labels.drawMode}
          </Button>

          <div className="flex items-center gap-1">
            {mode === "draw" ? (
              <IconButton
                type="button"
                variant="ghost"
                size="sm"
                tooltip
                label={labels.undo}
                disabled={disabled || strokes.length === 0}
                onClick={undo}
              >
                <Undo2 />
              </IconButton>
            ) : null}
            <IconButton
              type="button"
              variant="ghost"
              size="sm"
              tooltip
              label={labels.clear}
              disabled={disabled || isSignatureEmpty(current)}
              onClick={clear}
            >
              <Eraser />
            </IconButton>
          </div>
        </div>
      )}

      <p role="status" className="sr-only">
        {status}
      </p>
    </div>
  );
}

export type { SignaturePadLabels, SignaturePoint, SignatureStroke, SignatureValue };
export { isSignatureEmpty };
