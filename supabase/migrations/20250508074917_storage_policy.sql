-- Enable RLS on the storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to delete their own documents
CREATE POLICY "Users can delete their own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  -- Check if the user is the owner of the document
  EXISTS (
    SELECT 1 FROM documents
    WHERE documents.path = storage.objects.name
    AND documents.user_id = auth.uid()
  )
);

-- First drop the existing policy
DROP POLICY IF EXISTS "Users can upload documents" ON storage.objects;

-- Then create the updated policy
CREATE POLICY "Users can upload documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow uploads to the documents bucket
  bucket_id = 'documents'
  AND
  -- Ensure the path starts with the user's project ID
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM projects
    WHERE user_id = auth.uid()
  )
);


