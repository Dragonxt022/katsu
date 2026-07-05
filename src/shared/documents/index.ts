/**
 * shared/documents — CPF e CNPJ: validação e formatação.
 * Funções puras: zero dependência de Core ou Apps (Fase 2, DoD).
 */

const onlyDigits = (s: string) => s.replace(/\D/g, '');

export function validateCPF(cpf: string): boolean {
  const d = onlyDigits(cpf);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  for (const len of [9, 10]) {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(d[i]) * (len + 1 - i);
    const digit = ((sum * 10) % 11) % 10;
    if (digit !== Number(d[len])) return false;
  }
  return true;
}

export function validateCNPJ(cnpj: string): boolean {
  const d = onlyDigits(cnpj);
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  const calc = (len: number) => {
    const weights = len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(d[i]) * weights[i];
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  return calc(12) === Number(d[12]) && calc(13) === Number(d[13]);
}

/** Valida CPF (11 dígitos) ou CNPJ (14 dígitos) automaticamente. */
export function validateDocument(doc: string): boolean {
  const d = onlyDigits(doc);
  if (d.length === 11) return validateCPF(d);
  if (d.length === 14) return validateCNPJ(d);
  return false;
}

export function formatCPF(cpf: string): string {
  const d = onlyDigits(cpf).padStart(11, '0');
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function formatCNPJ(cnpj: string): string {
  const d = onlyDigits(cnpj).padStart(14, '0');
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export function formatDocument(doc: string): string {
  const d = onlyDigits(doc);
  return d.length === 11 ? formatCPF(d) : d.length === 14 ? formatCNPJ(d) : doc;
}
