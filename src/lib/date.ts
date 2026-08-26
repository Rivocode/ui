export function formatDate(data: Date | undefined): string {
  if (!data || Number.isNaN(data.getTime())) return "";
  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}/${data.getFullYear()}`;
}

export function parseDate(text: string): Date | undefined {
  const parts = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text.trim());
  if (!parts) return undefined;

  const dia = Number(parts[1]);
  const mes = Number(parts[2]);
  const ano = Number(parts[3]);

  const data = new Date(ano, mes - 1, dia);
  const existe =
    data.getDate() === dia && data.getMonth() === mes - 1 && data.getFullYear() === ano;
  return existe ? data : undefined;
}

export function applyDateMask(text: string): string {
  const digits = text.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}
