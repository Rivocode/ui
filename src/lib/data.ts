/**
 * Formatar e ler `dd/mm/aaaa` sem trazer uma biblioteca de data para a API
 * publica. O DatePicker so precisa deste formato, e a react-day-picker fica
 * escondida como motor do calendario.
 *
 * Tudo aqui trabalha com a data local do navegador de proposito: o usuario
 * escolhe "3 de marco" no calendario da tela dele, nao um instante em UTC.
 */

/** `dd/mm/aaaa`, ou string vazia quando nao ha data. */
export function formatarData(data: Date | undefined): string {
  if (!data || Number.isNaN(data.getTime())) return "";
  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}/${data.getFullYear()}`;
}

/**
 * Le `dd/mm/aaaa`. Devolve `undefined` para texto incompleto e para data que
 * nao existe: `31/02/2026` vira `undefined`, e nao 3 de marco, que e o que o
 * `new Date` faria sozinho.
 */
export function lerData(texto: string): Date | undefined {
  const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto.trim());
  if (!partes) return undefined;

  const dia = Number(partes[1]);
  const mes = Number(partes[2]);
  const ano = Number(partes[3]);

  const data = new Date(ano, mes - 1, dia);
  const existe =
    data.getDate() === dia && data.getMonth() === mes - 1 && data.getFullYear() === ano;
  return existe ? data : undefined;
}

/**
 * A mascara enquanto se digita. So aceita numero, poe as barras sozinha e para
 * em oito digitos, entao o campo nunca fica num formato que o `lerData` nao
 * entende.
 */
export function mascararData(texto: string): string {
  const digitos = texto.replace(/\D/g, "").slice(0, 8);
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 4) return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
  return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
}
