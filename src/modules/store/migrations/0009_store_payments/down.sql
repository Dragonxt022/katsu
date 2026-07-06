DROP INDEX IF EXISTS idx_sale_payments_sale;
DROP TABLE IF EXISTS sale_payments;
ALTER TABLE sales DROP COLUMN surcharge_cents;
