import { expect, test } from "bun:test";
import { fireEvent, render } from "@testing-library/react";

import { MaskedInput, applyMask, boletoLineToBarcode, isValidBoletoLine, parseBoleto } from "../src/index";
import { boletoDueDate } from "../src/shared/boleto";

const BANK_LINES = [
  "10492006506100010004200997263900989810000021403",
  "00190000090114971860168524522114675860000102656",
  "34192220090000556638551012140003679060000100000",
  "23790448095616862379336011058009740430000124020",
  "23794150099001980167035000211405700000000000000",
];

const COLLECTION_LINES = [
  "846300000003299902962024004101360008002006441147",
  "838600000050096000190009000801782309000343062712",
  "858200000007572503282030560708202107539591904460",
  "846100000005246100291102005460339004695895061080",
];

const TODAY = new Date(2026, 8, 24);

const day = (date: Date | null) =>
  date ? [date.getFullYear(), date.getMonth() + 1, date.getDate()] : null;

test("a linha de banco confere os tres campos no modulo 10 e o verificador geral no 11", () => {
  for (const line of BANK_LINES) expect(isValidBoletoLine(line), line).toBe(true);
  expect(isValidBoletoLine("10492.00650 61000.100042 00997.263900 9 89810000021403")).toBe(true);
});

test("a linha de convenio confere os quatro blocos e o geral, no modulo que a terceira casa pede", () => {
  for (const line of COLLECTION_LINES) expect(isValidBoletoLine(line), line).toBe(true);
  expect(isValidBoletoLine("84630000000-3 29990296202-4 00410136000-8 00200644114-7")).toBe(true);
});

test("um digito trocado em qualquer campo da linha de banco reprova", () => {
  const line = BANK_LINES[0]!;
  const swap = (at: number) =>
    line.slice(0, at) + String((Number(line[at]) + 1) % 10) + line.slice(at + 1);

  expect(isValidBoletoLine(swap(3))).toBe(false);
  expect(isValidBoletoLine(swap(9))).toBe(false);
  expect(isValidBoletoLine(swap(15))).toBe(false);
  expect(isValidBoletoLine(swap(25))).toBe(false);
  expect(isValidBoletoLine(swap(32))).toBe(false);
  expect(isValidBoletoLine(swap(46))).toBe(false);
});

test("o verificador geral pega o que os campos deixam passar", () => {
  expect(isValidBoletoLine("10492006506100010005900997263900989810000021403")).toBe(false);
  expect(isValidBoletoLine("846300000003299902962032004101360008002006441147")).toBe(false);
});

test("no banco, resto 0 ou 1 do modulo 11 vira verificador 1, como manda a Carta-Circular 2.926", () => {
  expect(isValidBoletoLine("00190000090234567890400000123174110000000010005")).toBe(true);
  expect(isValidBoletoLine("00190000090234567890400000123174110000000010009")).toBe(true);
  expect(isValidBoletoLine("00190000090234567890400000123174010000000010005")).toBe(false);
  expect(isValidBoletoLine("00190000090234567890400000123174010000000010009")).toBe(false);
});

test("um digito trocado num bloco do convenio reprova", () => {
  const line = COLLECTION_LINES[2]!;
  const swap = (at: number) =>
    line.slice(0, at) + String((Number(line[at]) + 1) % 10) + line.slice(at + 1);

  expect(isValidBoletoLine(swap(5))).toBe(false);
  expect(isValidBoletoLine(swap(11))).toBe(false);
  expect(isValidBoletoLine(swap(30))).toBe(false);
  expect(isValidBoletoLine(swap(47))).toBe(false);
});

test("tamanho e tipo que nao combinam reprovam", () => {
  expect(isValidBoletoLine(BANK_LINES[0]!.slice(0, 46))).toBe(false);
  expect(isValidBoletoLine(`${BANK_LINES[0]}0`)).toBe(false);
  expect(isValidBoletoLine(COLLECTION_LINES[0]!.slice(0, 47))).toBe(false);
  expect(isValidBoletoLine(`1${COLLECTION_LINES[0]!.slice(1)}`)).toBe(false);
  expect(isValidBoletoLine("146800000003299902962024004101360008002006441147")).toBe(false);
  expect(isValidBoletoLine("10499898100000214032006561000100040099726390")).toBe(false);
  expect(isValidBoletoLine("")).toBe(false);
});

test("a linha vira o codigo de barras de 44 digitos que o leitor otico le", () => {
  expect(boletoLineToBarcode(BANK_LINES[0]!)).toBe("10499898100000214032006561000100040099726390");
  expect(boletoLineToBarcode("34191.57007 00000.000000 00000.000000 7 19450000248000")).toBe(
    "34197194500002480001570000000000000000000000",
  );
  expect(boletoLineToBarcode(COLLECTION_LINES[0]!)).toBe(
    "84630000000299902962020041013600000200644114",
  );
  expect(boletoLineToBarcode(`${BANK_LINES[0]!.slice(0, 46)}4`)).toBeNull();
});

test("o boleto de banco diz o banco, o valor em centavos e o vencimento", () => {
  expect(parseBoleto(BANK_LINES[1]!, { today: TODAY })).toEqual({
    kind: "bank",
    line: BANK_LINES[1]!,
    barcode: "00196758600001026560000001149718606852452211",
    bank: "001",
    amount: 102656,
    dueDate: new Date(2018, 6, 15),
    segment: null,
  });

  const federal = parseBoleto(BANK_LINES[0]!, { today: TODAY });
  expect(federal?.bank).toBe("104");
  expect(federal?.amount).toBe(21403);
  expect(day(federal!.dueDate)).toEqual([2022, 5, 10]);
});

test("o fator volta a 1000 em 22/02/2025, e o 9999 e o dia anterior", () => {
  const last = parseBoleto("00190000090234567890400000123174199990000015000", { today: TODAY });
  const first = parseBoleto("00190000090234567890400000123174710000000015000", { today: TODAY });
  const later = parseBoleto("34191570070000000000000000000000719450000248000", { today: TODAY });

  expect(day(last!.dueDate)).toEqual([2025, 2, 21]);
  expect(day(first!.dueDate)).toEqual([2025, 2, 22]);
  expect(day(later!.dueDate)).toEqual([2027, 9, 25]);
  expect(later?.amount).toBe(248000);
});

test("o mesmo fator serve a dois ciclos, e vale o mais perto do dia de referencia", () => {
  expect(day(boletoDueDate(1000, new Date(2010, 0, 1)))).toEqual([2000, 7, 3]);
  expect(day(boletoDueDate(1000, TODAY))).toEqual([2025, 2, 22]);
  expect(day(boletoDueDate(7586, TODAY))).toEqual([2018, 7, 15]);
  expect(day(boletoDueDate(7586, new Date(2043, 0, 1)))).toEqual([2043, 3, 6]);
  expect(day(boletoDueDate(1001, TODAY))).toEqual([2025, 2, 23]);
});

test("fator zerado e valor zerado viram null, e nao data e valor inventados", () => {
  const blank = parseBoleto(BANK_LINES[4]!, { today: TODAY });
  expect(blank?.dueDate).toBeNull();
  expect(blank?.amount).toBeNull();
  expect(blank?.bank).toBe("237");
  expect(boletoDueDate(0)).toBeNull();
});

test("o convenio diz o segmento e o valor quando a terceira casa e 6 ou 8", () => {
  const energy = parseBoleto(COLLECTION_LINES[1]!);
  expect(energy?.kind).toBe("collection");
  expect(energy?.segment).toBe(3);
  expect(energy?.amount).toBe(50960);
  expect(energy?.bank).toBeNull();
  expect(energy?.dueDate).toBeNull();

  expect(parseBoleto(COLLECTION_LINES[2]!)?.amount).toBe(5725);
});

test("o convenio que carrega referencia, na terceira casa 7 ou 9, nao inventa valor", () => {
  const ten = parseBoleto("817500000010234501232024609240000008000000000018");
  const eleven = parseBoleto("859200000013234501232025609240000007000000000019");

  expect(ten?.segment).toBe(1);
  expect(ten?.amount).toBeNull();
  expect(eleven?.segment).toBe(5);
  expect(eleven?.amount).toBeNull();
});

test("o codigo de barras lido pelo leitor entra direto, e a linha sai montada", () => {
  const fromBarcode = parseBoleto("10499898100000214032006561000100040099726390", { today: TODAY });
  expect(fromBarcode?.line).toBe(BANK_LINES[0]!);
  expect(fromBarcode?.amount).toBe(21403);

  const collection = parseBoleto("84630000000299902962020041013600000200644114");
  expect(collection?.line).toBe(COLLECTION_LINES[0]!);

  expect(parseBoleto("10499898100000214032006561000100040099726391")).toBeNull();
  expect(parseBoleto("texto qualquer")).toBeNull();
});

test("o molde boleto pontua a linha de banco e troca para o de convenio quando comeca com 8", () => {
  expect(applyMask(BANK_LINES[0]!, "boleto")).toBe(
    "10492.00650 61000.100042 00997.263900 9 89810000021403",
  );
  expect(applyMask(COLLECTION_LINES[0]!, "boleto")).toBe(
    "84630000000-3 29990296202-4 00410136000-8 00200644114-7",
  );
  expect(applyMask("104920065", "boleto")).toBe("10492.0065");
  expect(applyMask("8463000000032", "boleto")).toBe("84630000000-3 2");
  expect(applyMask("10492.00650 61000.1", "boleto")).toBe("10492.00650 61000.1");
  expect(applyMask(`${BANK_LINES[0]}999`, "boleto")).toBe(
    "10492.00650 61000.100042 00997.263900 9 89810000021403",
  );
});

const BANK_BARCODE = "10499898100000214032006561000100040099726390";
const COLLECTION_BARCODE = "84630000000299902962020041013600000200644114";

test("os 44 digitos do codigo de barras colados no molde boleto ficam sem a pontuacao da linha", () => {
  expect(applyMask(BANK_BARCODE, "boleto")).toBe(BANK_BARCODE);
  expect(applyMask(COLLECTION_BARCODE, "boleto")).toBe(COLLECTION_BARCODE);
  expect(applyMask(` ${BANK_BARCODE}\n`, "boleto")).toBe(BANK_BARCODE);

  expect(applyMask(BANK_LINES[0]!.slice(0, 44), "boleto")).toBe(
    "10492.00650 61000.100042 00997.263900 9 89810000021",
  );
  expect(applyMask(COLLECTION_LINES[0]!.slice(0, 44), "boleto")).toBe(
    "84630000000-3 29990296202-4 00410136000-8 00200644",
  );
});

test("no MaskedInput, o codigo de barras colado fica cru, e o valor limpo e o mesmo", () => {
  const values: string[][] = [];
  const { getByRole } = render(
    <MaskedInput
      mask="boleto"
      aria-label="Linha digitável"
      onValueChange={(masked, clean) => values.push([masked, clean])}
    />,
  );
  fireEvent.change(getByRole("textbox"), { target: { value: BANK_BARCODE } });
  expect(values.at(-1)).toEqual([BANK_BARCODE, BANK_BARCODE]);
  expect((getByRole("textbox") as HTMLInputElement).value).toBe(BANK_BARCODE);
});

test("o MaskedInput de boleto abre o teclado numerico", () => {
  const { getByRole } = render(<MaskedInput mask="boleto" aria-label="Linha digitável" />);
  expect(getByRole("textbox").getAttribute("inputmode")).toBe("numeric");
});
