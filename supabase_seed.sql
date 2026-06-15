-- Add initial data so the app isn't empty

-- Insert Captain
INSERT INTO captains (name, code) 
SELECT 'Captain 1', '1111'
WHERE NOT EXISTS (SELECT 1 FROM captains WHERE code = '1111');

-- Insert Tables
INSERT INTO tables (name, status, code_pin) 
SELECT 'Table 1', 'available', '0000'
WHERE NOT EXISTS (SELECT 1 FROM tables WHERE name = 'Table 1');

INSERT INTO tables (name, status, code_pin) 
SELECT 'Table 2', 'available', '0000'
WHERE NOT EXISTS (SELECT 1 FROM tables WHERE name = 'Table 2');

INSERT INTO tables (name, status, code_pin) 
SELECT 'Table 3', 'available', '0000'
WHERE NOT EXISTS (SELECT 1 FROM tables WHERE name = 'Table 3');

INSERT INTO tables (name, status, code_pin) 
SELECT 'Table 4', 'available', '0000'
WHERE NOT EXISTS (SELECT 1 FROM tables WHERE name = 'Table 4');
