-- Create table for storing location QR codes
CREATE TABLE public.location_qrs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location TEXT NOT NULL UNIQUE,
  qr_code TEXT NOT NULL,
  section TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.location_qrs ENABLE ROW LEVEL SECURITY;

-- Create policies for location QRs
CREATE POLICY "Location QRs are viewable by everyone" 
ON public.location_qrs 
FOR SELECT 
USING (true);

CREATE POLICY "Only authenticated users can manage location QRs" 
ON public.location_qrs 
FOR ALL 
USING (auth.role() = 'authenticated');

-- Create table for storing generated pallet QR codes
CREATE TABLE public.pallet_qrs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  qr_code TEXT NOT NULL UNIQUE,
  is_used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  pallet_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.pallet_qrs ENABLE ROW LEVEL SECURITY;

-- Create policies for pallet QRs
CREATE POLICY "Pallet QRs are viewable by everyone" 
ON public.pallet_qrs 
FOR SELECT 
USING (true);

CREATE POLICY "Only authenticated users can manage pallet QRs" 
ON public.pallet_qrs 
FOR ALL 
USING (auth.role() = 'authenticated');