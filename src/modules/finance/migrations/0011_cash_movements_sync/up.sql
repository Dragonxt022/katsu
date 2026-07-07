-- 0011_cash_movements_sync — Fase 6a: motor de sincronização.
-- cash_movements é append-only (nunca editada/soft-deletada), por isso só ganha
-- origin_machine/synced_at — não updated_at/deleted_at.

ALTER TABLE cash_movements ADD COLUMN origin_machine TEXT;
ALTER TABLE cash_movements ADD COLUMN synced_at TEXT;
