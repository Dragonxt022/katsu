CREATE TABLE charges (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  company_uuid CHAR(36) NOT NULL,
  description VARCHAR(255) NOT NULL,
  amount_cents BIGINT NOT NULL,
  due_date DATE NOT NULL,
  status ENUM('pendente','paga','cancelada') NOT NULL DEFAULT 'pendente',
  paid_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_charges_company (company_uuid, due_date),
  CONSTRAINT fk_charges_company FOREIGN KEY (company_uuid) REFERENCES companies(company_uuid)
) ENGINE=InnoDB;
