-- Create plans table
CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    interval TEXT,
    stripe_price_id TEXT,
    features JSONB DEFAULT '[]'::jsonb,
    limits JSONB DEFAULT '{}'::jsonb,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone
CREATE POLICY "Allow public read access to plans" ON plans
    FOR SELECT USING (true);

-- Allow write access only to service role (admin)
CREATE POLICY "Allow service role write access to plans" ON plans
    FOR ALL USING (auth.role() = 'service_role');

-- Insert default plans
INSERT INTO plans (id, name, price, interval, stripe_price_id, features, limits)
VALUES 
    ('free', 'Free', 0, null, null, 
    '["3 workspaces", "Basic AI assistance", "10 Kanban boards", "100 MB storage", "Community support"]'::jsonb,
    '{"workspaces": 3, "kanbanBoards": 10, "storage": 104857600, "aiRequests": 50}'::jsonb),
    
    ('pro', 'Pro', 12, 'month', 'price_1QO9s...REPLACE_WITH_REAL_ID', 
    '["Unlimited workspaces", "Advanced AI co-author", "Unlimited Kanban boards", "Priority support", "10 GB storage", "Advanced analytics", "Custom branding"]'::jsonb,
    '{"workspaces": -1, "kanbanBoards": -1, "storage": 10737418240, "aiRequests": 1000}'::jsonb),
    
    ('premium', 'Premium', 29, 'month', 'price_1QO9t...REPLACE_WITH_REAL_ID', 
    '["Everything in Pro", "Unlimited AI requests", "Team collaboration (up to 20 members)", "50 GB storage", "Dedicated support", "API access", "Advanced integrations", "Custom AI models"]'::jsonb,
    '{"workspaces": -1, "kanbanBoards": -1, "storage": 53687091200, "aiRequests": -1, "teamMembers": 20}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    interval = EXCLUDED.interval,
    features = EXCLUDED.features,
    limits = EXCLUDED.limits;
