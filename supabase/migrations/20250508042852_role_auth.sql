-- Step 1: Create the function that will be called by the trigger
CREATE OR REPLACE FUNCTION update_auth_role_from_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the role in auth.users raw_app_meta_data
  UPDATE auth.users
  SET raw_app_meta_data = jsonb_set(
    COALESCE(raw_app_meta_data, '{}'::jsonb),
    '{role}',
    to_jsonb(NEW.role)
  )
  WHERE id = NEW.id;
  
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create the trigger on the profiles table
CREATE TRIGGER sync_profile_role_to_auth
AFTER UPDATE OF role ON profiles
FOR EACH ROW
WHEN (OLD.role IS DISTINCT FROM NEW.role)
EXECUTE FUNCTION update_auth_role_from_profile();