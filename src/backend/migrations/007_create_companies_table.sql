CREATE TABLE companies (
    company_id SERIAL PRIMARY KEY,
    company_name VARCHAR(200) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_companies_name ON companies(company_name);
CREATE INDEX idx_companies_active ON companies(is_active);

INSERT INTO companies (company_name, created_at, updated_at)
SELECT DISTINCT 
    COALESCE(company_name, full_name) as company_name,
    created_at,
    updated_at
FROM users 
WHERE user_type = 'VENDOR' AND is_active = true;
