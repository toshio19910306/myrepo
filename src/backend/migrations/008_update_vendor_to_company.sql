ALTER TABLE estimate_requests ADD COLUMN company_id INTEGER;
ALTER TABLE estimate_requests ADD CONSTRAINT fk_estimate_requests_company_id 
    FOREIGN KEY (company_id) REFERENCES companies(company_id);

ALTER TABLE estimate_responses ADD COLUMN company_id INTEGER;
ALTER TABLE estimate_responses ADD CONSTRAINT fk_estimate_responses_company_id 
    FOREIGN KEY (company_id) REFERENCES companies(company_id);

UPDATE estimate_requests 
SET company_id = (
    SELECT c.company_id 
    FROM companies c 
    JOIN users u ON (c.company_name = u.company_name OR c.company_name = u.full_name)
    WHERE u.user_id = estimate_requests.vendor_id 
    AND u.user_type = 'VENDOR'
    LIMIT 1
)
WHERE vendor_id IS NOT NULL;

UPDATE estimate_responses 
SET company_id = (
    SELECT c.company_id 
    FROM companies c 
    JOIN users u ON (c.company_name = u.company_name OR c.company_name = u.full_name)
    WHERE u.user_id = estimate_responses.vendor_id 
    AND u.user_type = 'VENDOR'
    LIMIT 1
)
WHERE vendor_id IS NOT NULL;
