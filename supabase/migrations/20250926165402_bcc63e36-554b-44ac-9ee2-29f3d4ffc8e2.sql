-- Fix student name consistency between tables
-- Update student_profiles to match the authenticated user ID pattern
-- and ensure schedule_template uses consistent naming

-- First, let's see what we have and fix the student_profiles naming
-- The authenticated user is khalilsjh10@gmail.com, so we need to link that to the student data

-- Update student_profiles to use user IDs that match authentication
UPDATE student_profiles 
SET student_name = 'khalilsjh10' 
WHERE student_name = 'khalil' AND display_name = 'Khalil';

UPDATE student_profiles 
SET student_name = 'abigailsjh10' 
WHERE student_name = 'abigail' AND display_name = 'Abigail';

-- Update schedule_template to match the student_profiles naming
UPDATE schedule_template 
SET student_name = 'khalilsjh10' 
WHERE student_name = 'Khalil';

UPDATE schedule_template 
SET student_name = 'abigailsjh10' 
WHERE student_name = 'Abigail';