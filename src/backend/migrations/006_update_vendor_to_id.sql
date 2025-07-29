
ALTER TABLE estimate_requests ADD COLUMN vendor_id INTEGER;

ALTER TABLE estimate_requests ADD CONSTRAINT fk_estimate_requests_vendor_id 
    FOREIGN KEY (vendor_id) REFERENCES users(user_id);

ALTER TABLE estimate_requests DROP COLUMN vendor_name;
