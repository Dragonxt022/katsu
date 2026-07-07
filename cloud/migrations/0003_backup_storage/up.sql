CREATE TABLE cloud_backups (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  company_uuid CHAR(36) NOT NULL,
  uuid CHAR(36) NOT NULL,
  machine_id VARCHAR(64) NOT NULL,
  checksum CHAR(64) NOT NULL,
  size_bytes BIGINT NOT NULL,
  storage_path VARCHAR(500) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_cloud_backups (company_uuid, uuid),
  KEY idx_cloud_backups_company (company_uuid, created_at),
  CONSTRAINT fk_cloud_backups_company FOREIGN KEY (company_uuid) REFERENCES companies(company_uuid)
) ENGINE=InnoDB;
