ALTER TABLE estimate_responses 
ADD COLUMN estimate_number VARCHAR(50),
ADD COLUMN estimate_price DECIMAL(15,2),
ADD COLUMN response_remarks TEXT,
ADD COLUMN response_date DATE,
ADD COLUMN created_by INTEGER REFERENCES users(user_id);

ALTER TABLE estimate_responses 
ALTER COLUMN validity_period TYPE VARCHAR(100);

ALTER TABLE estimate_responses 
ALTER COLUMN delivery_date TYPE DATE;

ALTER TABLE estimate_responses 
ALTER COLUMN total_amount DROP NOT NULL;

ALTER TABLE estimate_responses 
ALTER COLUMN delivery_date DROP NOT NULL;

ALTER TABLE estimate_responses 
ALTER COLUMN validity_period DROP NOT NULL;

ALTER TABLE estimate_responses 
RENAME COLUMN notes TO terms_conditions;
