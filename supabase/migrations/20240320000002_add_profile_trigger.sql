-- Create function to handle new profile creation
CREATE OR REPLACE FUNCTION handle_new_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Create a personal project for the new user
    INSERT INTO projects (
        name,
        description,
        user_id,
        project_type
    ) VALUES (
        'Personal Project',
        'Your personal workspace',
        NEW.id,
        'personal'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function after a new profile is created
CREATE TRIGGER on_profile_created
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_profile();

-- Add comment to explain the trigger
COMMENT ON TRIGGER on_profile_created ON profiles IS 
    'Creates a personal project for each new user profile';

-- Add comment to explain the function
COMMENT ON FUNCTION handle_new_profile() IS 
    'Creates a personal project when a new user profile is created'; 