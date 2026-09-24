import { expect, mock, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { PixCode } from "../src/components/pix-code";
import { buildPixPayload, isValidPixKey, parsePixPayload } from "../src/index";
import { RivoProvider } from "../src/provider/rivo-provider";
import { formatBrl, pixCrc } from "../src/shared/pix";
import { readQr, shapesOf } from "./leitor-de-qr";

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

test("o crc16 e o CCITT-FALSE: 29B1 no vetor de conferencia 123456789", () => {
  expect(pixCrc("123456789")).toBe("29B1");
});

test("os cinco exemplos do Manual de Padroes para Iniciacao do Pix 2.10 batem o crc", () => {
  for (const payload of MANUAL) {
    expect(pixCrc(payload.slice(0, -4))).toBe(payload.slice(-4));
    expect(parsePixPayload(payload)).not.toBeNull();
  }
});

test("buildPixPayload remonta o exemplo estatico do manual caractere por caractere", () => {
  expect(
    buildPixPayload({
      key: "123e4567-e12b-12d1-a456-426655440000",
      name: "Fulano de Tal",
      city: "BRASILIA",
    }),
  ).toBe(STATIC);
});

test("o parse le chave, nome, cidade e txid do estatico, e o pagamento unico do dinamico", () => {
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

test("o parse recusa crc errado, um caractere trocado e codigo sem o GUI do Pix", () => {
  expect(parsePixPayload(`${STATIC.slice(0, -4)}1D3E`)).toBeNull();
  expect(parsePixPayload(STATIC.replace("Fulano", "Fulana"))).toBeNull();
  expect(parsePixPayload("")).toBeNull();

  const foreign = "00020126300014br.gov.bcb.xyz0108abcdefgh5204000053039865802BR5901A6001B62070503***6304";
  expect(parsePixPayload(foreign + pixCrc(foreign))).toBeNull();
});

test("o crc em minuscula tambem confere", () => {
  expect(parsePixPayload(`${STATIC.slice(0, -4)}1d3d`)).not.toBeNull();
});

test("valor, txid e descricao vao e voltam, com o acento tirado do nome e da cidade", () => {
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

test("o build recusa o que o manual e o EMV nao aceitam", () => {
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

test("isValidPixKey aceita as cinco formas do DICT, como o manual as escreve", () => {
  expect(isValidPixKey("52998224725")).toBe(true);
  expect(isValidPixKey("00038166000105")).toBe(true);
  expect(isValidPixKey("12ABC34501DE35")).toBe(true);
  expect(isValidPixKey("fulano_da_silva.recebedor@example.com")).toBe(true);
  expect(isValidPixKey("+5561912345678")).toBe(true);
  expect(isValidPixKey("123e4567-e12b-12d1-a456-426655440000")).toBe(true);
});

test("isValidPixKey recusa digito verificador errado, pontuacao, fixo e telefone sem +55", () => {
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

test("o valor sai em reais sem Intl, igual nos dois pacotes", () => {
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
  test(`o PixCode desenha um QR que decodifica sem inverter no proprio copia e cola, no ${theme}`, () => {
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

test("valor e recebedor saem do codigo, e o nome da imagem diz os dois", () => {
  pix();
  expect(screen.getByText("R$ 100,50")).toBeDefined();
  expect(screen.getByText("para Fulano de Tal")).toBeDefined();
  expect(screen.getByRole("img", { name: "QR Code Pix de R$ 100,50 para Fulano de Tal" })).toBeDefined();
  expect(screen.getByText(COMPOSITE_WITH_AMOUNT)).toBeDefined();
});

test("amount e receiver vencem o codigo, e no dinamico o campo 54 e ignorado", () => {
  pix({ amount: 250, receiver: "Clinica Sao Lucas" });
  expect(screen.getByText("R$ 250,00")).toBeDefined();
  expect(screen.getByText("para Clinica Sao Lucas")).toBeDefined();

  const body = DYNAMIC.slice(0, -4).replace("5802BR", "540599.905802BR");
  const withAmount = body.slice(0, -4) + "6304" + pixCrc(body.slice(0, -4) + "6304");
  expect(parsePixPayload(withAmount)!.amount).toBe(99.9);
  const { container } = pix({ payload: withAmount });
  expect(container.textContent).not.toContain("R$ 99,90");
});

test("copiar leva o copia e cola inteiro, e o botao confirma", async () => {
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

test("codigo com crc errado nao vira QR nem botao de copiar: vira aviso", () => {
  pix({ payload: `${STATIC.slice(0, -4)}0000` });
  expect(screen.getByRole("alert").textContent).toBe("Este código Pix não é válido.");
  expect(screen.queryByRole("img")).toBeNull();
  expect(screen.queryByRole("button")).toBeNull();
});

test("expirado tira o QR e o copiar, e oferece gerar outro", () => {
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

test("carregando marca o lugar, avisa que esta ocupado e nao deixa copiar", () => {
  const { container } = pix({ loading: true, payload: "" });
  expect(container.querySelector("[aria-busy='true']")).not.toBeNull();
  expect(screen.queryByRole("img")).toBeNull();
  expect(screen.queryByRole("alert")).toBeNull();
  expect((screen.getByRole("button", { name: "Copiar código" }) as HTMLButtonElement).disabled).toBe(true);
  expect(container.textContent).not.toContain("R$");
});

test("carregando com o valor ja conhecido mostra o valor, e so o QR espera", () => {
  pix({ loading: true, payload: "", amount: 1284.5 });
  expect(screen.getByText("R$ 1.284,50")).toBeDefined();
  expect(screen.queryByRole("img")).toBeNull();
});
