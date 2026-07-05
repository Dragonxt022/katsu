/** Testes unitários do Shared (Fase 2 — funções puras). */
import { toCents, fromCents, formatBRL, sumCents } from '../shared/money';
import { validateCPF, validateCNPJ, validateDocument, formatCPF, formatCNPJ } from '../shared/documents';

let failures = 0;
function check(label: string, ok: boolean) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
  if (!ok) failures++;
}
function throws(fn: () => unknown): boolean {
  try { fn(); return false; } catch { return true; }
}

// money
check('toCents "1.234,56" → 123456', toCents('1.234,56') === 123456);
check('toCents "1234.56" → 123456', toCents('1234.56') === 123456);
check('toCents "R$ 10,00" → 1000', toCents('R$ 10,00') === 1000);
check('toCents 19.9 → 1990', toCents(19.9) === 1990);
check('toCents "0,1" → 10', toCents('0,1') === 10);
check('toCents "-5,50" → -550', toCents('-5,50') === -550);
check('toCents inválido lança', throws(() => toCents('abc')));
check('toCents "1,23,45" lança', throws(() => toCents('1,23,45')));
check('fromCents 123456 → 1234.56', fromCents(123456) === 1234.56);
check('formatBRL 123456 → "R$ 1.234,56"', formatBRL(123456) === 'R$ 1.234,56');
check('formatBRL 5 → "R$ 0,05"', formatBRL(5) === 'R$ 0,05');
check('formatBRL -1000 → "-R$ 10,00"', formatBRL(-1000) === '-R$ 10,00');
check('sumCents 100+250+50 → 400', sumCents(100, 250, 50) === 400);
check('round-trip toCents(formatBRL)', toCents(formatBRL(98765)) === 98765);

// documents
check('CPF válido 529.982.247-25', validateCPF('529.982.247-25'));
check('CPF válido sem máscara', validateCPF('52998224725'));
check('CPF inválido dígito', !validateCPF('529.982.247-26'));
check('CPF repetido inválido', !validateCPF('111.111.111-11'));
check('CPF curto inválido', !validateCPF('1234567890'));
check('CNPJ válido 11.222.333/0001-81', validateCNPJ('11.222.333/0001-81'));
check('CNPJ inválido dígito', !validateCNPJ('11.222.333/0001-82'));
check('CNPJ repetido inválido', !validateCNPJ('11.111.111/1111-11'));
check('validateDocument detecta CPF', validateDocument('52998224725'));
check('validateDocument detecta CNPJ', validateDocument('11222333000181'));
check('validateDocument tamanho errado', !validateDocument('123'));
check('formatCPF', formatCPF('52998224725') === '529.982.247-25');
check('formatCNPJ', formatCNPJ('11222333000181') === '11.222.333/0001-81');

console.log(failures === 0 ? '\nShared: TODOS OS TESTES PASSARAM' : `\n${failures} falha(s)`);
process.exit(failures === 0 ? 0 : 1);
