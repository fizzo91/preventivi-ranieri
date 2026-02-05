-- Create section_templates table for reusable section configurations
CREATE TABLE public.section_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT '{}',
  complexity INTEGER CHECK (complexity >= 1 AND complexity <= 4),
  risk INTEGER CHECK (risk >= 1 AND risk <= 4),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.section_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for users to manage their own templates
CREATE POLICY "Users can manage own templates" 
  ON public.section_templates 
  FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_section_templates_updated_at
  BEFORE UPDATE ON public.section_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();