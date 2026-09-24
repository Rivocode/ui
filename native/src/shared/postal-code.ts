/* Gerado de src/shared/postal-code.ts por bun run gen:compartilhado. Nao editar. */

export type PostalAddress = {
  street: string;
  district: string;
  city: string;
  state: string;
};

export type PostalCodeLookup = (
  postalCode: string,
  signal: AbortSignal,
) => Promise<PostalAddress | null>;

export type PostalCodeStatus = "idle" | "searching" | "found" | "notFound" | "failed";

export type PostalCodeOutcome =
  | { status: "found"; address: PostalAddress }
  | { status: "notFound" }
  | { status: "failed"; error: unknown };

export const POSTAL_CODE_LENGTH = 8;

export const POSTAL_CODE_MESSAGES = {
  searching: "Buscando endereço…",
  found: "Endereço encontrado.",
  notFound: "CEP não encontrado. Confira os números ou preencha o endereço à mão.",
  failed: "Não foi possível buscar o CEP agora. Confira a conexão e tente de novo.",
  retry: "Tentar de novo",
};

export function postalCodeDigits(text: string): string {
  return text.replace(/\D/g, "").slice(0, POSTAL_CODE_LENGTH);
}

export function formatPostalCode(text: string): string {
  const digits = postalCodeDigits(text);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

export function searchPostalCode(
  postalCode: string,
  lookup: PostalCodeLookup,
  settle: (outcome: PostalCodeOutcome) => void,
): () => void {
  const controller = new AbortController();
  let live = true;

  Promise.resolve()
    .then(() => lookup(postalCode, controller.signal))
    .then(
      (address) => {
        if (live) settle(address ? { status: "found", address } : { status: "notFound" });
      },
      (error: unknown) => {
        if (live) settle({ status: "failed", error });
      },
    );

  return () => {
    live = false;
    controller.abort();
  };
}
