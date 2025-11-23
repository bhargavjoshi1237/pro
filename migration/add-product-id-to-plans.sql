-- Add stripe_product_id to plans table
ALTER TABLE plans ADD COLUMN IF NOT EXISTS stripe_product_id TEXT;

-- Update existing plans with placeholder product IDs (User needs to replace these)
UPDATE plans SET stripe_product_id = 'prod_pro_placeholder' WHERE id = 'pro';
UPDATE plans SET stripe_product_id = 'prod_premium_placeholder' WHERE id = 'premium';
