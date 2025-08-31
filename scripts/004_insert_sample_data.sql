-- Insert sample flight data for testing
INSERT INTO flights (callsign, aircraft_type, departure, arrival, altitude, speed, status, notes) VALUES
('UAL123', 'B737', 'KORD', 'KLAX', '35000', '450', 'delivery', 'Priority departure'),
('DAL456', 'A320', 'KJFK', 'KMIA', '37000', '480', 'ground', 'Gate 23'),
('AAL789', 'B777', 'KDFW', 'EGLL', '41000', '520', 'tower', 'Heavy aircraft'),
('SWA101', 'B737', 'KLAS', 'KPHX', '33000', '420', 'departure', 'Runway 08L'),
('JBU202', 'A321', 'KBOS', 'KLAX', '39000', '460', 'approach', 'Inbound from east'),
('UAL303', 'B787', 'KSFO', 'RJTT', '43000', '540', 'control', 'International flight')
ON CONFLICT (callsign) DO NOTHING;
