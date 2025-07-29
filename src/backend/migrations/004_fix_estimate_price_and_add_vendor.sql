
ALTER TABLE estimate_responses 
ALTER COLUMN estimate_price TYPE DECIMAL(15,2) USING CASE 
    WHEN estimate_price IS NULL OR estimate_price = '' THEN NULL 
    ELSE estimate_price::DECIMAL 
END;

ALTER TABLE estimate_requests 
ADD COLUMN vendor_name VARCHAR(200);

CREATE INDEX idx_estimate_requests_vendor_name ON estimate_requests(vendor_name);
