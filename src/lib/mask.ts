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
      `[rivocode/ui] mask="${mask}" is not a known mask and does not look like a pattern. ` +
        `The built-in ones are: ${Object.keys(MASKS).join(", ")}, moeda. ` +
        `A hand-written pattern uses 9 for a digit, A for a letter and * for either.`,
    );
  }
  if (mask === "boleto") return applyPattern(text, boletoPatternFor(text));
  return maskText(text, mask);
}

export function toCents(text: string): number {
  const digits = text.replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}
