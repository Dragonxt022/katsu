import { randomUUID } from 'node:crypto';
import type { Request } from 'express';
import { getSqlite } from '../../core/database/connection';
import { audit } from '../../core/audit/service';

export type MovementType = 'entrada' | 'saida' | 'ajuste';

/**
 * Movimentação de estoque consistente (DoD Fase 3):
 * transação única que atualiza o saldo do produto E grava a linha no livro-razão.
 * O saldo nunca é editado direto; é sempre consequência de uma movimentação.
 * 'ajuste' define o saldo absoluto; entrada/saída somam/subtraem.
 */
export function moveStock(
  req: Request,
  productId: number,
  type: MovementType,
  qty: number,
  reason?: string,
  refEntity?: string,
  refId?: string | number,
): { ok: true; balance: number } | { ok: false; error: string } {
  if (!Number.isFinite(qty) || (type !== 'ajuste' && qty <= 0)) {
    return { ok: false, error: 'Quantidade inválida.' };
  }
  const db = getSqlite();
  let result: { ok: true; balance: number } | { ok: false; error: string } = {
    ok: false,
    error: 'Falha desconhecida.',
  };

  db.transaction(() => {
    const product = db
      .prepare('SELECT id, name, track_stock, stock_qty FROM products WHERE id = ? AND deleted_at IS NULL')
      .get(productId) as { id: number; name: string; track_stock: number; stock_qty: number } | undefined;
    if (!product) {
      result = { ok: false, error: 'Produto não encontrado.' };
      return;
    }
    if (!product.track_stock) {
      result = { ok: false, error: 'Produto não controla estoque.' };
      return;
    }

    const balance =
      type === 'entrada' ? product.stock_qty + qty
      : type === 'saida' ? product.stock_qty - qty
      : qty; // ajuste = saldo absoluto

    if (balance < 0) {
      result = { ok: false, error: `Estoque insuficiente: saldo ${product.stock_qty}, saída ${qty}.` };
      return;
    }

    db.prepare(`UPDATE products SET stock_qty = ?, updated_at = datetime('now') WHERE id = ?`).run(balance, productId);
    db.prepare(
      `INSERT INTO stock_movements (product_id, type, qty, balance_after, reason, ref_entity, ref_id, user_id, uuid)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      productId,
      type,
      qty,
      balance,
      reason ?? null,
      refEntity ?? null,
      refId != null ? String(refId) : null,
      req.user?.id ?? null,
      randomUUID(),
    );
    audit(req, `estoque_${type}`, 'product', productId, { saldo: product.stock_qty }, { saldo: balance, qty, reason });
    result = { ok: true, balance };
  })();

  return result;
}

export function listMovements(productId?: number, limit = 100) {
  const db = getSqlite();
  const base = `SELECT m.id, m.product_id, p.name AS product_name, m.type, m.qty, m.balance_after,
                       m.reason, m.ref_entity, m.ref_id, u.username, m.created_at
                FROM stock_movements m
                JOIN products p ON p.id = m.product_id
                LEFT JOIN users u ON u.id = m.user_id`;
  return productId
    ? db.prepare(`${base} WHERE m.product_id = ? ORDER BY m.id DESC LIMIT ?`).all(productId, limit)
    : db.prepare(`${base} ORDER BY m.id DESC LIMIT ?`).all(limit);
}
