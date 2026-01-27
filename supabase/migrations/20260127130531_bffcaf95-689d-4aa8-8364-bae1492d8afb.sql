-- Create storage bucket for section charts
INSERT INTO storage.buckets (id, name, public)
VALUES ('section-charts', 'section-charts', true);

-- Policy: Anyone can view images (public bucket)
CREATE POLICY "Public read access for section charts"
ON storage.objects FOR SELECT
USING (bucket_id = 'section-charts');

-- Policy: Authenticated users can upload their own images
CREATE POLICY "Authenticated users can upload section charts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'section-charts');

-- Policy: Authenticated users can update their own images
CREATE POLICY "Authenticated users can update section charts"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'section-charts');

-- Policy: Authenticated users can delete their own images
CREATE POLICY "Authenticated users can delete section charts"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'section-charts');