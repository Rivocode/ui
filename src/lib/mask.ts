import { boletoPatternFor } from "../shared/boleto";
import { applyPattern, isKnownMask, maskText, MASKS, type Mask } from "../shared/mask";

export {
  applyCurrencyMask,
  applyPattern,
  MASKS,
  phonePatternFor,
  unmask,
  type Mask,
  type MaskName,
} from "../shared/mask";

export function applyMask(text: string, mask: Mask): string {
  if (!isKnownMask(mask) && process.env.NODE_ENV !== "production") {
    console.warn(
      `[rivocode/ui] mask="${mask}" nao e um molde conhecido nem parece um molde. ` +
        `Os prontos sao: ${Object.keys(MASKS).join(", ")}, moeda. ` +
        `Molde escrito na mao usa 9 para digito, A para letra e * para os dois.`,
    );
  }
  if (mask === "boleto") return applyPattern(text, boletoPatternFor(text));
  return maskText(text, mask);
}

export function toCents(text: string): number {
  const digits = text.replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}
