import { expect, mock, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { PixCode } from "../src/components/pix-code";
import type { PixCodeLabels } from "../src/index";
import { buildPixPayload, isValidPixKey, parsePixPayload } from "../src/index";
import { RivoProvider } from "../src/provider/rivo-provider";
import { formatBrl, pixCrc } from "../src/shared/pix";
import { readQr, shapesOf } from "./qr-reader";

const STATIC =
  "00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D";
const DYNAMIC =
  "00020101021226700014br.gov.bcb.pix2548pix.example.com/8b3da2f39a4140d1a91abd93113bd4415204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***630464E4";
const COMPOSITE_WITH_AMOUNT =
  "00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865406100.505802BR5913Fulano de Tal6008BRASILIA62070503***80740014br.gov.bcb.pix2552pix.example.com/rec/2353c790eefb11eaadc10242ac12000263042875";
const COMPOSITE =
  "00020126180014br.gov.bcb.pix5204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***80740014br.gov.bcb.pix2552pix.example.com/rec/2353c790eefb11eaadc10242ac1200026304F2DA";
const DYNAMIC_COMPOSITE =
  "00020101021226700014br.gov.bcb.pix2548pix.example.com/8b3da2f39a4140d1a91abd93113bd4415204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***80740014br.gov.bcb.pix2552pix.example.com/rec/2353c790eefb11eaadc10242ac1200026304FB42";

const MANUAL = [STATIC, DYNAMIC, COMPOSITE_WITH_AMOUNT, COMPOSITE, DYNAMIC_COMPOSITE];

test("crc16 is CCITT-FALSE: 29B1 on the check vector 123456789", () => {
  expect(pixCrc("123456789")).toBe("29B1");
});

test("the five examples of the Pix Initiation Standards Manual 2.10 match the crc", () => {
  for (const payload of MANUAL) {
    expect(pixCrc(payload.slice(0, -4))).toBe(payload.slice(-4));
    expect(parsePixPayload(payload)).not.toBeNull();
  }
});

test("buildPixPayload rebuilds the manual's static example character by character", () => {
  expect(
    buildPixPayload({
      key: "123e4567-e12b-12d1-a456-426655440000",
      name: "Fulano de Tal",
      city: "BRASILIA",
    }),
  ).toBe(STATIC);
});

test("parse reads key, name, city and txid from the static one, and the single payment from the dynamic one", () => {
  expect(parsePixPayload(STATIC)).toEqual({
    key: "123e4567-e12b-12d1-a456-426655440000",
    url: undefined,
    recurrence: undefined,
    name: "Fulano de Tal",
    city: "BRASILIA",
    amount: undefined,
    txid: undefined,
    description: undefined,
    unique: false,
  });

  const dynamic = parsePixPayload(DYNAMIC)!;
  expect(dynamic.key).toBeUndefined();
  expect(dynamic.url).toBe("pix.example.com/8b3da2f39a4140d1a91abd93113bd441");
  expect(dynamic.unique).toBe(true);

  expect(parsePixPayload(COMPOSITE_WITH_AMOUNT)!.amount).toBe(100.5);
  expect(parsePixPayload(COMPOSITE)!.recurrence).toBe(
    "pix.example.com/rec/2353c790eefb11eaadc10242ac120002",
  );
  expect(parsePixPayload(COMPOSITE)!.key).toBeUndefined();
});

test("parse rejects a wrong crc, a swapped character and a code without the Pix GUI", () => {
  expect(parsePixPayload(`${STATIC.slice(0, -4)}1D3E`)).toBeNull();
  expect(parsePixPayload(STATIC.replace("Fulano", "Fulana"))).toBeNull();
  expect(parsePixPayload("")).toBeNull();

  const foreign = "00020126300014br.gov.bcb.xyz0108abcdefgh5204000053039865802BR5901A6001B62070503***6304";
  expect(parsePixPayload(foreign + pixCrc(foreign))).toBeNull();
});

test("a lowercase crc also checks out", () => {
  expect(parsePixPayload(`${STATIC.slice(0, -4)}1d3d`)).not.toBeNull();
});

test("amount, txid and description round-trip, with the accent stripped from name and city", () => {
  const payload = buildPixPayload({
    key: "fulano_da_silva.recebedor@example.com",
    name: "Clínica São Lucas",
    city: "João Pessoa",
    amount: 1284.5,
    txid: "NF4813",
    description: "Nota 4813",
  });

  expect(payload).toContain("54071284.50");
  expect(payload).toContain("5917Clinica Sao Lucas");
  expect(payload).toContain("6011Joao Pessoa");
  expect(parsePixPayload(payload)).toEqual({
    key: "fulano_da_silva.recebedor@example.com",
    url: undefined,
    recurrence: undefined,
    name: "Clinica Sao Lucas",
    city: "Joao Pessoa",
    amount: 1284.5,
    txid: "NF4813",
    description: "Nota 4813",
    unique: false,
  });
});

test("build rejects what the manual and EMV do not accept", () => {
  const base = { key: "+5583988112233", name: "Fulano", city: "Joao Pessoa" };
  expect(() => buildPixPayload({ ...base, name: "N".repeat(26) })).toThrow(RangeError);
  expect(() => buildPixPayload({ ...base, city: "C".repeat(16) })).toThrow(RangeError);
  expect(() => buildPixPayload({ ...base, key: "k".repeat(78) })).toThrow(RangeError);
  expect(() => buildPixPayload({ ...base, txid: "nota-4813" })).toThrow(RangeError);
  expect(() => buildPixPayload({ ...base, txid: "A".repeat(26) })).toThrow(RangeError);
  expect(() => buildPixPayload({ ...base, amount: 0 })).toThrow(RangeError);
  expect(() => buildPixPayload({ ...base, amount: Number.NaN })).toThrow(RangeError);
  expect(() => buildPixPayload({ ...base, description: "d".repeat(80) })).toThrow(RangeError);
  expect(() => buildPixPayload({ ...base, name: "  " })).toThrow(RangeError);
});

const emv = (amount: string) => {
  const body =
    "0002012625" +
    "0014br.gov.bcb.pix0103a@b" +
    `54${String(amount.length).padStart(2, "0")}${amount}` +
    "53039865802BR5901A6001B62070503***6304";
  return body + pixCrc(body);
};

test("parse rejects a field 54 that is not an amount in reais", () => {
  for (const amount of ["-5", "0x10", "1e3", " ", "0", "0.00", "1.234", "+5", ".5", "5.", "12345678901"]) {
    expect(parsePixPayload(emv(amount))).toBeNull();
  }
  expect(parsePixPayload(emv("1.5"))!.amount).toBe(1.5);
  expect(parsePixPayload(emv("100.50"))!.amount).toBe(100.5);
  expect(parsePixPayload(emv("7"))!.amount).toBe(7);
});

test("build writes the key as DICT stores it, stripping punctuation from CPF, CNPJ and phone", () => {
  const keyOf = (key: string) =>
    parsePixPayload(buildPixPayload({ key, name: "Fulano", city: "Joao Pessoa" }))!.key;

  expect(keyOf("529.982.247-25")).toBe("52998224725");
  expect(keyOf(" 00.038.166/0001-05 ")).toBe("00038166000105");
  expect(keyOf("12.abc.345/01de-35")).toBe("12ABC34501DE35");
  expect(keyOf("(83) 98811-2233")).toBe("+5583988112233");
  expect(keyOf("+55 (83) 98811-2233")).toBe("+5583988112233");
  expect(keyOf("+55 83 98811 2233")).toBe("+5583988112233");
  expect(keyOf("Fulano@Example.com")).toBe("fulano@example.com");
  expect(keyOf("123E4567-E12B-12D1-A456-426655440000")).toBe("123e4567-e12b-12d1-a456-426655440000");
});

test("build rejects a key DICT would not find, instead of generating a code that does not pay", () => {
  const base = { name: "Fulano", city: "Joao Pessoa" };
  for (const key of [
    "529.982.247-24",
    "83988112233",
    "(83) 3234-5678",
    "fulano@exemplo",
    "joão@exemplo.com",
    "chave qualquer",
  ]) {
    expect(() => buildPixPayload({ ...base, key })).toThrow(RangeError);
  }
});

test("the code comes out ASCII only, so the TLV length and the crc count the same as the QR bytes", () => {
  const payload = buildPixPayload({
    key: "fulano@example.com",
    name: "Jørgen Ångström Œuvre",
    city: "São Paulo",
    description: "Café ☕ – nº 4",
  });

  expect(new TextEncoder().encode(payload).length).toBe(payload.length);
  expect(parsePixPayload(payload)).not.toBeNull();
});

test("the name loses the accent and keeps the letter: Jørgen Ångström becomes Jorgen Angstrom", () => {
  const parsed = parsePixPayload(
    buildPixPayload({ key: "fulano@example.com", name: "Jørgen Ångström", city: "São Paulo" }),
  )!;
  expect(parsed.name).toBe("Jorgen Angstrom");
  expect(parsed.city).toBe("Sao Paulo");

  const decomposed = parsePixPayload(
    buildPixPayload({ key: "fulano@example.com", name: "João".normalize("NFD"), city: "Brasília" }),
  )!;
  expect(decomposed.name).toBe("Joao");
  expect(decomposed.city).toBe("Brasilia");
});

test("the amount is checked after rounding to the cent: 0.004 is rejected, 1.005 does not become 1.00", () => {
  const base = { key: "fulano@example.com", name: "Fulano", city: "Joao Pessoa" };
  expect(() => buildPixPayload({ ...base, amount: 0.004 })).toThrow(RangeError);
  expect(() => buildPixPayload({ ...base, amount: -1 })).toThrow(RangeError);
  expect(parsePixPayload(buildPixPayload({ ...base, amount: 1.005 }))!.amount).toBe(1.01);
  expect(parsePixPayload(buildPixPayload({ ...base, amount: 0.005 }))!.amount).toBe(0.01);
  expect(parsePixPayload(buildPixPayload({ ...base, amount: 1284.5 }))!.amount).toBe(1284.5);
});

test("formatBrl returns a dash for what is not an amount, and does not write minus zero", () => {
  expect(formatBrl(Number.NaN)).toBe("-");
  expect(formatBrl(Number.POSITIVE_INFINITY)).toBe("-");
  expect(formatBrl(1e21)).toBe("-");
  expect(formatBrl(-0.001)).toBe("R$ 0,00");
  expect(formatBrl(-0)).toBe("R$ 0,00");
  expect(formatBrl(-12.5)).toBe("-R$ 12,50");
  expect(formatBrl(999999999999.99)).toBe("R$ 999.999.999.999,99");
});

test("isValidPixKey accepts the five DICT forms, as the manual writes them", () => {
  expect(isValidPixKey("52998224725")).toBe(true);
  expect(isValidPixKey("00038166000105")).toBe(true);
  expect(isValidPixKey("12ABC34501DE35")).toBe(true);
  expect(isValidPixKey("fulano_da_silva.recebedor@example.com")).toBe(true);
  expect(isValidPixKey("+5561912345678")).toBe(true);
  expect(isValidPixKey("123e4567-e12b-12d1-a456-426655440000")).toBe(true);
});

test("isValidPixKey rejects a wrong check digit, punctuation, a landline and a phone without +55", () => {
  expect(isValidPixKey("52998224724")).toBe(false);
  expect(isValidPixKey("529.982.247-25")).toBe(false);
  expect(isValidPixKey("00038166000106")).toBe(false);
  expect(isValidPixKey("12abc34501de35")).toBe(false);
  expect(isValidPixKey("Fulano@Example.com")).toBe(false);
  expect(isValidPixKey("fulano@exemplo")).toBe(false);
  expect(isValidPixKey("5561912345678")).toBe(false);
  expect(isValidPixKey("+556132345678")).toBe(false);
  expect(isValidPixKey("+15551234567")).toBe(false);
  expect(isValidPixKey("123e4567e12b12d1a456426655440000")).toBe(false);
  expect(isValidPixKey("")).toBe(false);
  expect(isValidPixKey(`${"a".repeat(70)}@exemplo.com`)).toBe(false);
});

test("the amount comes out in reais without Intl, the same in both packages", () => {
  expect(formatBrl(100.5)).toBe("R$ 100,50");
  expect(formatBrl(1284.5)).toBe("R$ 1.284,50");
  expect(formatBrl(1234567.891)).toBe("R$ 1.234.567,89");
  expect(formatBrl(0)).toBe("R$ 0,00");
});

function pix(
  props: Partial<Parameters<typeof PixCode>[0]> = {},
  theme: "rivocode-light" | "rivocode-dark" = "rivocode-dark",
) {
  return render(
    <RivoProvider scope="local" theme={theme}>
      <PixCode payload={COMPOSITE_WITH_AMOUNT} {...props} />
    </RivoProvider>,
  );
}

for (const theme of ["rivocode-light", "rivocode-dark"] as const) {
  test(`PixCode draws a QR that decodes without inversion into its own copy-and-paste code, in ${theme}`, () => {
    const payload = buildPixPayload({
      key: "+5583988112233",
      name: "Clinica Sao Lucas",
      city: "Joao Pessoa",
      amount: 1284.5,
      txid: "NF4813",
    });
    const { container } = pix({ payload, size: 240 }, theme);
    const svg = container.querySelector("svg")!;
    const viewBox = Number(svg.getAttribute("viewBox")!.split(" ")[2]);
    expect(readQr(viewBox, 240, shapesOf(svg))).toBe(payload);
  });
}

test("amount and receiver come from the code, and the image name states both", () => {
  pix();
  expect(screen.getByText("R$ 100,50")).toBeDefined();
  expect(screen.getByText("para Fulano de Tal")).toBeDefined();
  expect(screen.getByRole("img", { name: "QR Code Pix de R$ 100,50 para Fulano de Tal" })).toBeDefined();
  expect(screen.getByText(COMPOSITE_WITH_AMOUNT)).toBeDefined();
});

test("amount and receiver beat the code, and in the dynamic one field 54 is ignored", () => {
  pix({ amount: 250, receiver: "Clinica Sao Lucas" });
  expect(screen.getByText("R$ 250,00")).toBeDefined();
  expect(screen.getByText("para Clinica Sao Lucas")).toBeDefined();

  const body = DYNAMIC.slice(0, -4).replace("5802BR", "540599.905802BR");
  const withAmount = body.slice(0, -4) + "6304" + pixCrc(body.slice(0, -4) + "6304");
  expect(parsePixPayload(withAmount)!.amount).toBe(99.9);
  const { container } = pix({ payload: withAmount });
  expect(container.textContent).not.toContain("R$ 99,90");
});

test("copy takes the whole copy-and-paste code, and the button confirms", async () => {
  const written: string[] = [];
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: async (text: string) => void written.push(text) },
  });

  pix();
  fireEvent.click(screen.getByRole("button", { name: "Copiar código" }));
  await new Promise((resolve) => setTimeout(resolve, 0));

  expect(written).toEqual([COMPOSITE_WITH_AMOUNT]);
  expect(screen.getByRole("button", { name: "Código copiado" })).toBeDefined();
});

test("a code with a wrong crc becomes neither a QR nor a copy button: it becomes a warning", () => {
  pix({ payload: `${STATIC.slice(0, -4)}0000` });
  expect(screen.getByRole("alert").textContent).toBe("Este código Pix não é válido.");
  expect(screen.queryByRole("img")).toBeNull();
  expect(screen.queryByRole("button")).toBeNull();
});

test("expired removes the QR and the copy button, and offers to generate another", () => {
  const onRenew = mock(() => {});
  pix({ expired: true, onRenew });
  expect(screen.queryByRole("img")).toBeNull();
  expect(screen.queryByRole("button", { name: "Copiar código" })).toBeNull();
  expect(screen.queryByText(COMPOSITE_WITH_AMOUNT)).toBeNull();
  expect(screen.getByRole("status").textContent).toBe("Este código Pix expirou.");
  expect(screen.getByText("R$ 100,50")).toBeDefined();

  fireEvent.click(screen.getByRole("button", { name: "Gerar novo código" }));
  expect(onRenew).toHaveBeenCalledTimes(1);
});

test("loading holds the place, announces it is busy and does not allow copying", () => {
  const { container } = pix({ loading: true, payload: "" });
  expect(container.querySelector("[aria-busy='true']")).not.toBeNull();
  expect(screen.queryByRole("img")).toBeNull();
  expect(screen.queryByRole("alert")).toBeNull();
  expect((screen.getByRole("button", { name: "Copiar código" }) as HTMLButtonElement).disabled).toBe(true);
  expect(container.textContent).not.toContain("R$");
});

test("loading with the amount already known shows the amount, and only the QR waits", () => {
  pix({ loading: true, payload: "", amount: 1284.5 });
  expect(screen.getByText("R$ 1.284,50")).toBeDefined();
  expect(screen.queryByRole("img")).toBeNull();
});

test("the copy-and-paste code with spaces and line breaks around it goes trimmed to the QR, the screen and the copy", async () => {
  const written: string[] = [];
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: async (text: string) => void written.push(text) },
  });

  const { container } = pix({ payload: `\n  ${COMPOSITE_WITH_AMOUNT} \n`, size: 240 });
  const svg = container.querySelector("svg")!;
  const viewBox = Number(svg.getAttribute("viewBox")!.split(" ")[2]);
  expect(readQr(viewBox, 240, shapesOf(svg))).toBe(COMPOSITE_WITH_AMOUNT);
  expect(screen.getByText(COMPOSITE_WITH_AMOUNT).textContent).toBe(COMPOSITE_WITH_AMOUNT);

  fireEvent.click(screen.getByRole("button", { name: "Copiar código" }));
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(written).toEqual([COMPOSITE_WITH_AMOUNT]);
});

test("every text of the piece comes from labels, including the receiver's para and the QR name", () => {
  const labels: Partial<PixCodeLabels> = {
    receiver: (name) => `to ${name}`,
    code: (amount, receiver) => `Pix QR ${amount ?? ""} ${receiver ?? ""}`.trim(),
  };
  pix({ labels });
  expect(screen.getByText("to Fulano de Tal")).toBeDefined();
  expect(screen.getByRole("img", { name: "Pix QR R$ 100,50 Fulano de Tal" })).toBeDefined();
});

test("receiver shows the accented name, which the code stores in ASCII", () => {
  const payload = buildPixPayload({
    key: "+5583988112233",
    name: "Clínica São Lucas",
    city: "João Pessoa",
  });
  pix({ payload });
  expect(screen.getByText("para Clinica Sao Lucas")).toBeDefined();

  pix({ payload, receiver: "Clínica São Lucas" });
  expect(screen.getByText("para Clínica São Lucas")).toBeDefined();
  expect(screen.getByRole("img", { name: "QR Code Pix para Clínica São Lucas" })).toBeDefined();
});

test("expiring reaches the screen reader: the live region already existed, and only its text changes", () => {
  const { container, rerender } = pix();
  const region = container.querySelector("[role='status']")!;
  expect(region).not.toBeNull();
  expect(region.getAttribute("aria-live")).toBe("polite");
  expect(region.textContent).toBe("");

  rerender(
    <RivoProvider scope="local" theme="rivocode-dark">
      <PixCode payload={COMPOSITE_WITH_AMOUNT} expired />
    </RivoProvider>,
  );
  expect(container.querySelector("[role='status']")).toBe(region);
  expect(region.textContent).toBe("Este código Pix expirou.");
});

test("loading and finishing loading reach the screen reader, through the same live region", () => {
  const { container, rerender } = pix({ loading: true, payload: "" });
  const region = container.querySelector("[role='status']")!;
  expect(region.textContent).toBe("Gerando o código Pix…");

  rerender(
    <RivoProvider scope="local" theme="rivocode-dark">
      <PixCode payload={COMPOSITE_WITH_AMOUNT} />
    </RivoProvider>,
  );
  expect(container.querySelector("[role='status']")).toBe(region);
  expect(region.textContent).toBe("Código Pix pronto.");
});
