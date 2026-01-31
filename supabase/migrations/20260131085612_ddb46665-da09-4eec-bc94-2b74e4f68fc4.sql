-- Update section-charts bucket to be private
UPDATE storage.buckets SET public = false WHERE id = 'section-charts';

-- Drop existing policies that don't enforce user isolation
DROP POLICY IF EXISTS "Authenticated users can upload section charts" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view section charts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own section charts" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own section charts" ON storage.objects;

-- Create new policies with user isolation
-- Users can only upload to their own folder: {user_id}/filename
CREATE POLICY "Users can upload to own folder" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'section-charts' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can only view their own files
CREATE POLICY "Users can view own section charts" 
ON storage.objects 
FOR SELECT 
TO authenticated 
USING (
  bucket_id = 'section-charts' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can only update their own files
CREATE POLICY "Users can update own section charts" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (
  bucket_id = 'section-charts' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can only delete their own files
CREATE POLICY "Users can delete own section charts" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (
  bucket_id = 'section-charts' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);