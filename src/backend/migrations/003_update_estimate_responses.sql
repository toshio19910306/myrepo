ALTER TABLE estimate_responses 
ADD COLUMN estimate_number VARCHAR(255),
ADD COLUMN estimate_price VARCHAR(255),
ADD COLUMN response_remarks TEXT,
ADD COLUMN response_date VARCHAR(255),
ADD COLUMN created_by INTEGER REFERENCES users(user_id);

ALTER TABLE estimate_responses 
ALTER COLUMN validity_period TYPE VARCHAR(255);

ALTER TABLE estimate_responses 
ALTER COLUMN delivery_date TYPE VARCHAR(255);

ALTER TABLE estimate_responses 
ALTER COLUMN total_amount DROP NOT NULL;

ALTER TABLE estimate_responses 
ALTER COLUMN delivery_date DROP NOT NULL;

ALTER TABLE estimate_responses 
ALTER COLUMN validity_period DROP NOT NULL;

ALTER TABLE estimate_responses 
RENAME COLUMN notes TO terms_conditions;
