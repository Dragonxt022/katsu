CREATE TABLE companies (
  company_uuid CHAR(36) PRIMARY KEY,
  license_key_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB;

CREATE TABLE sync_records (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  company_uuid CHAR(36) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  uuid CHAR(36) NOT NULL,
  payload JSON NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted_at DATETIME(3) NULL,
  origin_machine VARCHAR(64) NOT NULL,
  server_received_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_sync_records (company_uuid, entity_type, uuid),
  KEY idx_sync_records_pull (company_uuid, server_received_at, id),
  KEY idx_sync_records_entity (company_uuid, entity_type),
  CONSTRAINT fk_sync_records_company FOREIGN KEY (company_uuid) REFERENCES companies(company_uuid)
) ENGINE=InnoDB;
