
ALTER TABLE estimate_responses 
ALTER COLUMN delivery_date TYPE DATE USING CASE 
    WHEN delivery_date IS NULL OR delivery_date = '' THEN NULL 
    ELSE delivery_date::DATE 
END;

ALTER TABLE estimate_responses 
ALTER COLUMN response_date TYPE DATE USING CASE 
    WHEN response_date IS NULL OR response_date = '' THEN NULL 
    ELSE response_date::DATE 
END;
