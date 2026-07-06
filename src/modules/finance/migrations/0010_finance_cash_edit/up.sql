ALTER TABLE cash_registers ADD COLUMN edited_at TEXT;
ALTER TABLE cash_registers ADD COLUMN edited_by INTEGER REFERENCES users(id);
