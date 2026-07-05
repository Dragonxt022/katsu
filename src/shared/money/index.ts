/**
 * shared/money — dinheiro sempre em CENTAVOS (inteiro), nunca float.
 * Funções puras: zero dependência de Core ou Apps (Fase 2, DoD).
 */

/** "1.234,56", "1234.56", 1234.56 → 123456 centavos. Lança em entrada inválida. */
export function toCents(value: string | number): number {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Valor inválido');
    return Math.round(value * 100);
  }
  const s = value.trim().replace(/^R\$\s*/, '');
  if (!s) throw new Error('Valor vazio');
  // formato BR (1.234,56) ou US (1,234.56 / 1234.56)
  const br = /^-?\d{1,3}(\.\d{3})*(,\d{1,2})?$|^-?\d+(,\d{1,2})?$/;
  const us = /^-?\d{1,3}(,\d{3})*(\.\d{1,2})?$|^-?\d+(\.\d{1,2})?$/;
  let normalized: string;
  if (br.test(s)) normalized = s.replace(/\./g, '').replace(',', '.');
  else if (us.test(s)) normalized = s.replace(/,/g, '');
  else throw new Error(`Valor monetário inválido: ${value}`);
  return Math.round(parseFloat(normalized) * 100);
}

/** 123456 → 1234.56 */
export function fromCents(cents: number): number {
  return cents / 100;
}

/** 123456 → "R$ 1.234,56" */
export function formatBRL(cents: number): string {
  const negative = cents < 0;
  const abs = Math.abs(Math.round(cents));
  const int = Math.floor(abs / 100).toString();
  const dec = (abs % 100).toString().padStart(2, '0');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${negative ? '-' : ''}R$ ${grouped},${dec}`;
}

/** Soma segura de centavos. */
export function sumCents(...values: number[]): number {
  return values.reduce((a, b) => a + Math.round(b), 0);
}
