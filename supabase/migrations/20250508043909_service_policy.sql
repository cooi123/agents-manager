ALTER TABLE services
ADD COLUMN owner_id UUID REFERENCES auth.users(id);

-- Allow admins to create services
CREATE POLICY "Admin can create services"
ON services FOR INSERT
WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- Allow admins to update any service
CREATE POLICY "Admin can update any service"
ON services FOR UPDATE
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Allow admins to delete any service
CREATE POLICY "Admin can delete any service"
ON services FOR DELETE
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Allow admins to read all services
CREATE POLICY "Admin can read all services"
ON services FOR SELECT
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');