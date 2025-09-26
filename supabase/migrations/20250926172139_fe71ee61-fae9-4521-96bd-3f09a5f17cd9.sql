-- Fix database consistency by standardizing user identifiers
-- Update schedule_template to use khalil-user and abigail-user to match assignments table
UPDATE schedule_template 
SET student_name = 'khalil-user' 
WHERE student_name = 'khalilsjh10';

UPDATE schedule_template 
SET student_name = 'abigail-user' 
WHERE student_name = 'abigailsjh10';

-- Update student_profiles to use khalil-user and abigail-user to match assignments table  
UPDATE student_profiles 
SET student_name = 'khalil-user' 
WHERE student_name = 'khalilsjh10';

UPDATE student_profiles 
SET student_name = 'abigail-user' 
WHERE student_name = 'abigailsjh10';

-- Update any other tables with the old identifiers
UPDATE student_scheduling_profiles 
SET student_name = 'khalil-user' 
WHERE student_name = 'khalilsjh10';

UPDATE student_scheduling_profiles 
SET student_name = 'abigail-user' 
WHERE student_name = 'abigailsjh10';

UPDATE bible_curriculum_position 
SET student_name = 'khalil-user' 
WHERE student_name = 'khalilsjh10';

UPDATE bible_curriculum_position 
SET student_name = 'abigail-user' 
WHERE student_name = 'abigailsjh10';

UPDATE checklist_items 
SET student_name = 'khalil-user' 
WHERE student_name = 'khalilsjh10';

UPDATE checklist_items 
SET student_name = 'abigail-user' 
WHERE student_name = 'abigailsjh10';

UPDATE daily_schedule_status 
SET student_name = 'khalil-user' 
WHERE student_name = 'khalilsjh10';

UPDATE daily_schedule_status 
SET student_name = 'abigail-user' 
WHERE student_name = 'abigailsjh10';

UPDATE progress_sessions 
SET student_name = 'khalil-user' 
WHERE student_name = 'khalilsjh10';

UPDATE progress_sessions 
SET student_name = 'abigail-user' 
WHERE student_name = 'abigailsjh10';

UPDATE student_status 
SET student_name = 'khalil-user' 
WHERE student_name = 'khalilsjh10';

UPDATE student_status 
SET student_name = 'abigail-user' 
WHERE student_name = 'abigailsjh10';