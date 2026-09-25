import { useRef, useState } from "react";
import {
  AccessibilityInfo,
  PanResponder,
  Platform,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from "react-native";
import Svg, { Line, Path, Text as SvgText } from "react-native-svg";

import { tokens } from "../../tokens";
import { Button } from "../button";
import { cn } from "../cn";
import { Input } from "../field";
import { IconButton } from "../icon-button";
import {
  SIGNATURE_BASELINE,
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
import { Text } from "../text";

const PAPER = tokens.signature;

const HIDDEN = {
  accessibilityElementsHidden: true,
  importantForAccessibility: "no-hide-descendants",
} as const;

const UNDO = ["M9 14 4 9l5-5", "M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11"];
const ERASER = [
  "M21 21H8a2 2 0 0 1-1.42-.587l-3.994-3.999a2 2 0 0 1 0-2.828l10-10a2 2 0 0 1 2.829 0l5.999 6a2 2 0 0 1 0 2.828L12.834 21",
  "m5.082 11.09 8.828 8.828",
];

const SIGNATURE_NATIVE_FONT =
  Platform.select({ ios: "Snell Roundhand", android: "cursive", default: "cursive" }) ?? "cursive";

export type SignatureExportOptions = {
  /** A cor da tinta. Sem ela, a do token `signature-ink`, escura nos dois temas. */
  ink?: string;
  /** O fundo: `true` pinta o papel do token `signature-paper`, uma cor pinta aquela cor, e sem ele sai transparente. */
  paper?: boolean | string;
};

export function signatureToSvg(
  value: SignatureValue | null | undefined,
  options: SignatureExportOptions = {},
): string {
  const paper =
    options.paper === true
      ? PAPER["signature-paper"]
      : typeof options.paper === "string"
        ? options.paper
        : undefined;
  return signatureSvg(value ?? null, { ink: options.ink ?? PAPER["signature-ink"], paper });
}

export type SignaturePadProps = {
  /**
   * A assinatura, controlada: os tracos (`kind: "drawn"`) ou o nome digitado
   * (`kind: "typed"`). `null` e sem assinatura. O mesmo formato do web.
   */
  value: SignatureValue | null;
  /** Chamado ao fim de cada traco, a cada letra, ao desfazer e ao limpar. Sem ele, a peca so exibe. */
  onValueChange?: (value: SignatureValue | null) => void;
  /** O nome que o leitor de tela ouve no grupo. Dentro do `FormField`, chega sozinho pelo `forValue`. */
  accessibilityLabel?: string;
  /** Trava o desenho, o nome e os botoes. A camada esmaece, como em todo o pacote nativo. */
  disabled?: boolean;
  /** So exibe a assinatura: sem desenho, sem botoes e sem o modo de digitar. */
  readOnly?: boolean;
  /** A borda de perigo. O `FormField` mostra o erro embaixo; ligue junto com ele. */
  invalid?: boolean;
  /** Largura sobre altura da area. Padrao `3`, igual ao web. */
  ratio?: number;
  /**
   * A familia cursiva do modo de digitar, ja carregada no app. Sem ela, a
   * cursiva do sistema: Snell Roundhand no iOS, `cursive` no Android.
   */
  font?: string;
  /** Em que modo a area abre quando esta vazia. Padrao `draw`. */
  defaultMode?: "draw" | "type";
  /**
   * Avisa quando o dedo comeca e termina um traco. Ligue ao `scrollEnabled` da
   * `ScrollView` em volta quando a tela rola, para o traco nao virar rolagem.
   */
  onDrawingChange?: (drawing: boolean) => void;
  /** Os textos da peca, os mesmos do web. */
  labels?: Partial<SignaturePadLabels>;
  className?: string;
};

type Latest = {
  interactive: boolean;
  width: number;
  size: { width: number; height: number };
  strokes: SignatureStroke[];
  commit: (next: SignatureValue | null) => void;
  setLive: (stroke: SignatureStroke | null) => void;
  onDrawingChange?: (drawing: boolean) => void;
};

function pointOf(event: GestureResponderEvent, latest: Latest): SignaturePoint {
  const { locationX, locationY, timestamp, force } = event.nativeEvent as typeof event.nativeEvent & {
    force?: number;
  };
  const scale = latest.size.width / (latest.width || 1);
  const x = Math.min(latest.size.width, Math.max(0, locationX * scale));
  const y = Math.min(latest.size.height, Math.max(0, locationY * scale));
  const point: SignaturePoint = {
    x: Math.round(x * 100) / 100,
    y: Math.round(y * 100) / 100,
    time: Math.round(timestamp ?? 0),
  };
  if (typeof force === "number" && force > 0) point.pressure = Math.min(1, force);
  return point;
}

function Glyph({ paths, color, size }: { paths: string[]; color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {paths.map((d) => (
        <Path
          key={d}
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  );
}

export function SignaturePad({
  value,
  onValueChange,
  accessibilityLabel,
  disabled = false,
  readOnly = false,
  invalid = false,
  ratio = 3,
  font = SIGNATURE_NATIVE_FONT,
  defaultMode = "draw",
  onDrawingChange,
  labels: labelsProp,
  className,
}: SignaturePadProps) {
  const labels = {
    ...SIGNATURE_LABELS,
    instruction:
      "Desenhe a assinatura com o dedo ou a caneta. Se preferir, toque em Digitar assinatura e escreva o nome.",
    ...labelsProp,
  };
  const size = signatureSize(ratio);
  const interactive = !disabled && !readOnly && onValueChange !== undefined;
  const [width, setWidth] = useState(0);
  const [live, setLive] = useState<SignatureStroke | null>(null);
  const [chosen, setChosen] = useState<"draw" | "type">(defaultMode);
  const drafts = useRef<{ drawn: SignatureValue | null; typed: string }>({ drawn: null, typed: "" });
  const known = useRef<SignatureValue | null>(value);

  if (value !== known.current) {
    if (value === null) drafts.current = { drawn: null, typed: "" };
    known.current = value;
  }

  const mode = value?.kind === "typed" ? "type" : value?.kind === "drawn" ? "draw" : chosen;
  const strokes = value?.kind === "drawn" ? value.strokes : [];
  const text = value?.kind === "typed" ? value.text : "";
  const empty = isSignatureEmpty(value) && !live;

  const commit = (next: SignatureValue | null) => {
    const normalized = isSignatureEmpty(next) ? null : next;
    known.current = normalized;
    onValueChange?.(normalized);
  };

  const latest = useRef<Latest>({
    interactive,
    width,
    size,
    strokes,
    commit,
    setLive,
    onDrawingChange,
  });
  latest.current = {
    interactive: interactive && mode === "draw",
    width,
    size,
    strokes,
    commit,
    setLive,
    onDrawingChange,
  };

  const stroke = useRef<SignatureStroke>([]);
  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => latest.current.interactive,
      onMoveShouldSetPanResponder: () => latest.current.interactive,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: (event: GestureResponderEvent) => {
        stroke.current = [pointOf(event, latest.current)];
        latest.current.setLive(stroke.current);
        latest.current.onDrawingChange?.(true);
      },
      onPanResponderMove: (event: GestureResponderEvent) => {
        const next = extendStroke(stroke.current, pointOf(event, latest.current));
        if (next === stroke.current) return;
        stroke.current = next;
        latest.current.setLive(next);
      },
      onPanResponderRelease: () => finish(),
      onPanResponderTerminate: () => finish(),
    }),
  ).current;

  function finish() {
    const done = stroke.current;
    stroke.current = [];
    const current = latest.current;
    current.setLive(null);
    current.onDrawingChange?.(false);
    if (done.length === 0) return;
    current.commit({ kind: "drawn", strokes: [...current.strokes, done], ...current.size });
  }

  function undo() {
    const rest = strokes.slice(0, -1);
    if (rest.length === 0) setChosen("draw");
    commit(rest.length > 0 ? { kind: "drawn", strokes: rest, ...size } : null);
    AccessibilityInfo.announceForAccessibility(labels.undone);
  }

  function clear() {
    if (mode === "type") drafts.current.typed = "";
    else drafts.current.drawn = null;
    setChosen(mode);
    commit(null);
    AccessibilityInfo.announceForAccessibility(labels.cleared);
  }

  function switchMode() {
    if (mode === "draw") {
      drafts.current.drawn = value?.kind === "drawn" ? value : null;
      setChosen("type");
      const saved = drafts.current.typed;
      commit(saved.trim() ? { kind: "typed", text: saved, font, ...size } : null);
      return;
    }
    drafts.current.typed = text;
    setChosen("draw");
    commit(drafts.current.drawn);
  }

  const summary =
    value?.kind === "typed" && !isSignatureEmpty(value)
      ? labels.typed(value.text.trim())
      : strokes.length > 0
        ? labels.drawn(strokes.length)
        : labels.empty;
  const layout = typedLayout(text, size.width, size.height);
  const baseline = size.height * SIGNATURE_BASELINE;
  const drawnBox = value?.kind === "drawn" ? `0 0 ${value.width} ${value.height}` : undefined;
  const border = invalid && !disabled ? "border-danger" : "border-border-strong";

  return (
    <View className={cn("w-full gap-2", disabled && "opacity-50", className)}>
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={`${accessibilityLabel ?? labels.group}: ${summary}`}
        accessibilityHint={readOnly ? undefined : labels.instruction}
        accessibilityState={{ disabled }}
        onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
        {...responder.panHandlers}
        style={{
          backgroundColor: PAPER["signature-paper"],
          aspectRatio: size.width / size.height,
        }}
        className={cn("w-full overflow-hidden rounded-md border", border)}
      >
        <View pointerEvents="none" className="absolute inset-0" {...HIDDEN}>
          <Svg width="100%" height="100%" viewBox={`0 0 ${size.width} ${size.height}`}>
            <Line
              x1={size.width * 0.06}
              x2={size.width * 0.94}
              y1={baseline}
              y2={baseline}
              stroke={PAPER["signature-guide"]}
              strokeWidth={1.5}
            />
            <Svg x={0} y={0} width={size.width} height={size.height} viewBox={drawnBox}>
              {signaturePaths(strokes).map((d, index) => (
                <Path key={index} d={d} fill={PAPER["signature-ink"]} />
              ))}
              {live ? <Path d={signaturePaths([live])[0]} fill={PAPER["signature-ink"]} /> : null}
            </Svg>
            {mode === "type" && text.trim() ? (
              <SvgText
                x={layout.x}
                y={layout.y}
                fontSize={layout.fontSize}
                fontFamily={font}
                textAnchor="middle"
                textLength={layout.fit}
                lengthAdjust={layout.fit ? "spacingAndGlyphs" : undefined}
                fill={PAPER["signature-ink"]}
              >
                {text.trim()}
              </SvgText>
            ) : null}
          </Svg>
          {empty ? (
            <Text
              style={{
                color: PAPER["signature-guide"],
                bottom: `${(1 - SIGNATURE_BASELINE) * 100}%`,
              }}
              className="absolute left-[6%] mb-1.5 text-sm"
            >
              {labels.placeholder}
            </Text>
          ) : null}
        </View>
      </View>

      {mode === "type" && !readOnly ? (
        <View className="gap-1.5">
          <Text className="text-sm font-rc-medium text-fg">{labels.typedName}</Text>
          <Input
            accessibilityLabel={labels.typedName}
            autoComplete="name"
            autoCapitalize="words"
            maxLength={80}
            editable={interactive}
            invalid={invalid && !disabled}
            value={text || drafts.current.typed}
            onChangeText={(next) => {
              drafts.current.typed = next;
              commit({ kind: "typed", text: next, font, ...size });
            }}
          />
        </View>
      ) : null}

      {readOnly ? null : (
        <View className="flex-row flex-wrap items-center justify-between gap-2">
          <Button variant="ghost" size="sm" disabled={!interactive} onPress={switchMode}>
            {mode === "draw" ? labels.typeMode : labels.drawMode}
          </Button>
          <View className="flex-row items-center gap-1">
            {mode === "draw" ? (
              <IconButton
                variant="ghost"
                size="sm"
                label={labels.undo}
                disabled={!interactive || strokes.length === 0}
                onPress={undo}
              >
                {({ color, size: side }) => <Glyph paths={UNDO} color={color} size={side} />}
              </IconButton>
            ) : null}
            <IconButton
              variant="ghost"
              size="sm"
              label={labels.clear}
              disabled={!interactive || isSignatureEmpty(value)}
              onPress={clear}
            >
              {({ color, size: side }) => <Glyph paths={ERASER} color={color} size={side} />}
            </IconButton>
          </View>
        </View>
      )}
    </View>
  );
}

export type { SignaturePadLabels, SignaturePoint, SignatureStroke, SignatureValue };
