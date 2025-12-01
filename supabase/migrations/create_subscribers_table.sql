-- Create subscribers table for landing page email capture
CREATE TABLE IF NOT EXISTS subscribers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    subscribed_at TIMESTAMPTZ DEFAULT NOW(),
    source TEXT DEFAULT 'landing_page',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_subscribers_status ON subscribers(status);

-- Enable Row Level Security
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- Create policy to allow inserts from anyone (for public signup)
CREATE POLICY "Allow public inserts" ON subscribers
    FOR INSERT
    WITH CHECK (true);

-- Create policy to allow authenticated users to read
CREATE POLICY "Allow authenticated reads" ON subscribers
    FOR SELECT
    USING (auth.role() = 'authenticated');
