import { randomUUID } from 'node:crypto';
import type { Request } from 'express';
import { getSqlite } from '../../core/database/connection';
import { audit } from '../../core/audit/service';

/**
 * Caixa (Fase 4): sessão única aberta por vez.
 * Esperado no fechamento = abertura + entradas - saídas (livro-razão cash_movements).
 * DoD: abertura/fechamento confere; diferença = contado - esperado.
 */

export interface CashRegister {
  id: number;
  status: string;
  opening_cents: number;
  opened_at: string;
  opened_by: number;
}

export function currentRegister(): CashRegister | undefined {
  return getSqlite()
    .prepare("SELECT * FROM cash_registers WHERE status = 'aberto' AND deleted_at IS NULL LIMIT 1")
    .get() as CashRegister | undefined;
}

export function registerTotals(registerId: number): { entradas: number; saidas: number } {
  const row = getSqlite()
    .prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN direction = 'entrada' THEN amount_cents END), 0) AS entradas,
         COALESCE(SUM(CASE WHEN direction = 'saida' THEN amount_cents END), 0) AS saidas
       FROM cash_movements WHERE register_id = ?`,
    )
    .get(registerId) as { entradas: number; saidas: number };
  return row;
}

/** Esperado na gaveta = todas as entradas (inclui abertura) - saídas. */
export function expectedCents(registerId: number): number {
  const { entradas, saidas } = registerTotals(registerId);
  return entradas - saidas;
}

export function addMovement(
  req: Request,
  registerId: number,
  direction: 'entrada' | 'saida',
  type: 'abertura' | 'suprimento' | 'sangria' | 'venda' | 'recebimento' | 'pagamento',
  amountCents: number,
  description?: string,
  refEntity?: string,
  refId?: string | number,
): void {
  getSqlite()
    .prepare(
      `INSERT INTO cash_movements (register_id, direction, type, amount_cents, description, ref_entity, ref_id, user_id, uuid)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(registerId, direction, type, Math.round(amountCents), description ?? null,
      refEntity ?? null, refId != null ? String(refId) : null, req.user?.id ?? null, randomUUID());
}

export function openRegister(req: Request, openingCents: number): { ok: true; id: number } | { ok: false; error: string } {
  if (currentRegister()) return { ok: false, error: 'Já existe um caixa aberto. Feche-o antes de abrir outro.' };
  if (!Number.isInteger(openingCents) || openingCents < 0) return { ok: false, error: 'Valor de abertura inválido.' };
  const db = getSqlite();
  let id = 0;
  db.transaction(() => {
    const info = db
      .prepare('INSERT INTO cash_registers (opened_by, opening_cents, uuid) VALUES (?, ?, ?)')
      .run(req.user!.id, openingCents, randomUUID());
    id = Number(info.lastInsertRowid);
    if (openingCents > 0) addMovement(req, id, 'entrada', 'abertura', openingCents, 'Fundo de troco');
  })();
  audit(req, 'caixa_abrir', 'cash_register', id, null, { openingCents });
  return { ok: true, id };
}

export function closeRegister(
  req: Request,
  countedCents: number,
  notes?: string,
): { ok: true; expected: number; counted: number; difference: number } | { ok: false; error: string } {
  const reg = currentRegister();
  if (!reg) return { ok: false, error: 'Nenhum caixa aberto.' };
  if (!Number.isInteger(countedCents) || countedCents < 0) return { ok: false, error: 'Valor contado inválido.' };

  const expected = expectedCents(reg.id);
  const difference = countedCents - expected;
  getSqlite()
    .prepare(
      `UPDATE cash_registers SET status = 'fechado', closed_by = ?, closed_at = datetime('now'),
         expected_cents = ?, counted_cents = ?, difference_cents = ?, notes = COALESCE(?, notes),
         updated_at = datetime('now')
       WHERE id = ?`,
    )
    .run(req.user!.id, expected, countedCents, difference, notes ?? null, reg.id);
  audit(req, 'caixa_fechar', 'cash_register', reg.id, { expected }, { counted: countedCents, difference });
  return { ok: true, expected, counted: countedCents, difference };
}
