-- BOOST MANAGER DATABASE INITIALIZATION SCHEMA

-- Drop existing views/triggers/functions if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.increment_balance(UUID, NUMERIC) CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.admin_get_all_profiles() CASCADE;
DROP FUNCTION IF EXISTS public.admin_get_audit_logs() CASCADE;

-- Helper function to check if current user is admin without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    is_admin BOOLEAN;
BEGIN
    SELECT role = 'Admin' INTO is_admin FROM public.profiles WHERE id = auth.uid();
    RETURN COALESCE(is_admin, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Admin RPC: fetch all profiles (bypasses RLS, checks admin role internally)
CREATE OR REPLACE FUNCTION public.admin_get_all_profiles()
RETURNS SETOF public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  RETURN QUERY SELECT * FROM public.profiles ORDER BY created_at DESC;
END;
$$;

-- Admin RPC: fetch audit logs with performer info (bypasses RLS, checks admin role internally)
CREATE OR REPLACE FUNCTION public.admin_get_audit_logs()
RETURNS TABLE (
  id uuid, action text, performed_by uuid, target_user_id uuid,
  details jsonb, created_at timestamptz,
  performer_username text, performer_email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  RETURN QUERY
    SELECT al.id, al.action, al.performed_by, al.target_user_id,
           al.details, al.created_at,
           p.username AS performer_username, p.email AS performer_email
    FROM public.audit_logs al
    LEFT JOIN public.profiles p ON p.id = al.performed_by
    ORDER BY al.created_at DESC
    LIMIT 100;
END;
$$;

-- 1. PROFILES TABLE
-- Maps user accounts and profiles. References auth.users from Supabase auth dashboard.
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'User' CHECK (role IN ('Admin', 'User')),
    balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
    profile_pic TEXT,
    whatsapp TEXT,
    referral_code TEXT UNIQUE,
    referred_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile fields" ON public.profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles" ON public.profiles
    FOR ALL USING (auth.uid() != id AND public.is_admin());

-- 2. BOOST REQUESTS TABLE
-- Tracks client orders for boosting services
CREATE TABLE IF NOT EXISTS public.boost_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    platform TEXT NOT NULL,
    platforms TEXT[] DEFAULT '{}',
    url TEXT NOT NULL,
    budget NUMERIC(12, 2) NOT NULL CHECK (budget >= 0),
    allocated_budget NUMERIC(12, 2) DEFAULT 0.00 CHECK (allocated_budget >= 0),
    duration INTEGER,
    ad_goal TEXT NOT NULL,
    destination TEXT,
    location TEXT,
    gender TEXT,
    age TEXT,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Approved', 'Pending', 'Rejected')),
    amount_npr NUMERIC(12, 2) DEFAULT 0.00 CHECK (amount_npr >= 0),
    rate_used NUMERIC(12, 2) DEFAULT 0.00,
    remarks TEXT,
    admin_note TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS for Boost Requests
ALTER TABLE public.boost_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view and manage their own boost requests" ON public.boost_requests
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all boost requests" ON public.boost_requests
    FOR ALL USING (public.is_admin());

-- 3. BALANCE REQUESTS TABLE
-- Tracks top-up and payment verification requests
CREATE TABLE IF NOT EXISTS public.balance_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Approved', 'Pending', 'Rejected')),
    method TEXT,
    transaction_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS for Balance Requests
ALTER TABLE public.balance_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select their own balance requests" ON public.balance_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own balance requests" ON public.balance_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id AND status = 'Pending');

CREATE POLICY "Admins can manage all balance requests" ON public.balance_requests
    FOR ALL USING (public.is_admin());

-- 4. PROMO CODES TABLE
CREATE TABLE IF NOT EXISTS public.promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'rate_override')),
    value NUMERIC(12, 2) NOT NULL CHECK (value >= 0),
    is_active BOOLEAN DEFAULT true NOT NULL,
    usage_count INTEGER DEFAULT 0 NOT NULL,
    max_usage INTEGER,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS for Promo Codes
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active promo codes" ON public.promo_codes
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage promo codes" ON public.promo_codes
    FOR ALL USING (public.is_admin());

-- 5. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    target_request_id UUID,
    target_user_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS for Audit Logs (Only accessible by Admins)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can select audit logs" ON public.audit_logs
    FOR SELECT USING (public.is_admin());

-- 6. AUTOMATIC PROFILE CREATION TRIGGER
-- Triggers profile record insert when standard auth.users creates account
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    isAdmin BOOLEAN;
    initialBalance NUMERIC;
    generated_code TEXT;
    referrer_id UUID := NULL;
    referrer_code TEXT;
BEGIN
    -- Assign Admin role for target main user
    IF new.email = 'wilxon.xtha@gmail.com' THEN
        isAdmin := true;
        initialBalance := 999999.00;
    ELSE
        isAdmin := false;
        initialBalance := 0.00;
    END IF;

    -- Generate a random referral code
    generated_code := substring(md5(random()::text) from 1 for 8);

    -- Check if user signed up with a referral code in metadata
    referrer_code := new.raw_user_meta_data->>'referred_by_code';
    IF referrer_code IS NOT NULL THEN
        SELECT id INTO referrer_id FROM public.profiles WHERE referral_code = referrer_code;
    END IF;

    INSERT INTO public.profiles (id, email, username, role, balance, referral_code, referred_by)
    VALUES (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
        CASE WHEN isAdmin THEN 'Admin' ELSE 'User' END,
        initialBalance,
        generated_code,
        referrer_id
    );

    -- If a valid referrer was found, credit them 50 NPR
    IF referrer_id IS NOT NULL THEN
        UPDATE public.profiles SET balance = balance + 50.00 WHERE id = referrer_id;
        INSERT INTO public.audit_logs (action, performed_by, target_user_id, details)
        VALUES ('referral_bonus', new.id, referrer_id, jsonb_build_object('amount', 50.00, 'referred_email', new.email));
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. BALANCE INCREMENT DEFINER FUNCTION
-- Helper def to increment balance via atomic RPC (used by backend controller)
CREATE OR REPLACE FUNCTION public.increment_balance(user_id UUID, amount NUMERIC)
RETURNS VOID AS $$
BEGIN
    UPDATE public.profiles
    SET balance = balance + amount
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. SECURE TRIGGER-BASED BALANCE DEDUCTION & VALIDATION
-- Triggers before inserting a boost request: checks balance, then deducts it
CREATE OR REPLACE FUNCTION public.handle_boost_request_insert()
RETURNS TRIGGER AS $$
DECLARE
    current_balance NUMERIC;
BEGIN
    SELECT balance INTO current_balance FROM public.profiles WHERE id = new.user_id;
    IF current_balance IS NULL OR current_balance < new.amount_npr THEN
        RAISE EXCEPTION 'Insufficient balance. You need रू% but only have रू%.', new.amount_npr, coalesce(current_balance, 0);
    END IF;
    
    UPDATE public.profiles
    SET balance = balance - new.amount_npr
    WHERE id = new.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_boost_request_created
    BEFORE INSERT ON public.boost_requests
    FOR EACH ROW EXECUTE FUNCTION public.handle_boost_request_insert();

-- 9. AUTOMATIC REFUND ON DELETING PENDING CAMPAIGNS
-- Triggers before deleting a boost request: refunds user if request is Pending
CREATE OR REPLACE FUNCTION public.handle_boost_request_delete()
RETURNS TRIGGER AS $$
BEGIN
    IF old.status = 'Pending' THEN
        UPDATE public.profiles
        SET balance = balance + old.amount_npr
        WHERE id = old.user_id;
        
        INSERT INTO public.audit_logs (action, performed_by, target_request_id, details)
        VALUES ('delete_request_refund', old.user_id, old.id, jsonb_build_object('refundAmount', old.amount_npr));
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_boost_request_deleted
    BEFORE DELETE ON public.boost_requests
    FOR EACH ROW EXECUTE FUNCTION public.handle_boost_request_delete();

-- 10. SECURE CAMPAIGN EDIT & BUDGET ADJUSTMENT VALIDATOR
-- Triggers before updating a boost request: blocks status editing by user,
-- adjusts profile balance dynamically for budget modifications, and blocks
-- editing if status is not Pending.
CREATE OR REPLACE FUNCTION public.handle_boost_request_before_update()
RETURNS TRIGGER AS $$
DECLARE
    current_balance NUMERIC;
    balance_diff NUMERIC;
BEGIN
    -- Prevent non-admins from changing status or editing non-pending campaigns
    IF NOT public.is_admin() THEN
        IF old.status != new.status THEN
            RAISE EXCEPTION 'You are not authorized to change the status of this campaign.';
        END IF;
        
        IF old.status != 'Pending' THEN
            RAISE EXCEPTION 'You can only edit campaigns that are still Pending.';
        END IF;
    END IF;

    -- Adjust balance automatically if amount_npr (budget) is modified
    IF old.amount_npr != new.amount_npr THEN
        balance_diff := new.amount_npr - old.amount_npr;
        
        SELECT balance INTO current_balance FROM public.profiles WHERE id = old.user_id;
        IF balance_diff > 0 AND current_balance < balance_diff THEN
            RAISE EXCEPTION 'Insufficient balance. You need an additional रू% but only have रू%.', balance_diff, current_balance;
        END IF;

        UPDATE public.profiles
        SET balance = balance - balance_diff
        WHERE id = old.user_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_boost_request_before_update
    BEFORE UPDATE ON public.boost_requests
    FOR EACH ROW EXECUTE FUNCTION public.handle_boost_request_before_update();

-- 11. AUTOMATIC REFUNDS ON CAMPAIGN STATUS REJECTION
-- Triggers after updating a boost request status: processes automatic refund on Rejection
CREATE OR REPLACE FUNCTION public.handle_boost_request_update()
RETURNS TRIGGER AS $$
DECLARE
    balance_change NUMERIC := 0;
BEGIN
    IF old.status != 'Rejected' AND new.status = 'Rejected' THEN
        balance_change := old.amount_npr;
    ELSIF old.status = 'Rejected' AND new.status != 'Rejected' THEN
        balance_change := -old.amount_npr;
    END IF;

    IF balance_change != 0 THEN
        UPDATE public.profiles
        SET balance = balance + balance_change
        WHERE id = old.user_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_boost_request_updated
    AFTER UPDATE ON public.boost_requests
    FOR EACH ROW EXECUTE FUNCTION public.handle_boost_request_update();

-- 12. AUTOMATIC BALANCE TOP-UP APPROVALS
-- Triggers after updating a balance request: processes balance top-ups on admin approval
CREATE OR REPLACE FUNCTION public.handle_balance_request_update()
RETURNS TRIGGER AS $$
BEGIN
    IF old.status = 'Pending' AND new.status = 'Approved' THEN
        UPDATE public.profiles
        SET balance = balance + new.amount
        WHERE id = new.user_id;
        
        INSERT INTO public.audit_logs (action, performed_by, target_user_id, details)
        VALUES ('approve_topup', auth.uid(), new.user_id, jsonb_build_object('amount', new.amount));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_balance_request_updated
    AFTER UPDATE ON public.balance_requests
    FOR EACH ROW EXECUTE FUNCTION public.handle_balance_request_update();

-- 13. ROW-LEVEL SECURITY PROFILE PROTECTION
-- Triggers before updating profiles: blocks users from updating their own balance or role fields
CREATE OR REPLACE FUNCTION public.enforce_profile_security()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT public.is_admin() AND pg_trigger_depth() = 1 THEN
        IF old.balance != new.balance OR old.role != new.role THEN
            RAISE EXCEPTION 'You are not authorized to directly modify balance or role fields.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER protect_profiles_balance
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_security();


-- Enable real-time for public tables
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.boost_requests;
alter publication supabase_realtime add table public.balance_requests;
alter publication supabase_realtime add table public.promo_codes;

-- 14. CAMPAIGN TYPES TABLE
CREATE TABLE IF NOT EXISTS public.campaign_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS for campaign types
ALTER TABLE public.campaign_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage campaign types" ON public.campaign_types FOR ALL USING (public.is_admin());

-- 15. APP SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.app_settings (
    id TEXT PRIMARY KEY,
    exchange_rate NUMERIC(12,2) NOT NULL DEFAULT 135,
    whatsapp_number TEXT NOT NULL DEFAULT '+977-9843398340',
    allowed_platforms JSONB DEFAULT '["Facebook", "Instagram", "TikTok", "YouTube", "Twitter", "LinkedIn"]'::jsonb,
    all_platforms JSONB DEFAULT '["Facebook", "Instagram", "TikTok", "YouTube", "Twitter", "LinkedIn"]'::jsonb,
    platform_rates JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for app settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage app settings" ON public.app_settings FOR ALL USING (public.is_admin());
-- Allow all authenticated users to read the exchange rate
CREATE POLICY "Authenticated users can read app settings" ON public.app_settings FOR SELECT USING (auth.role() = 'authenticated');

-- Allow all authenticated users to read active campaign types (needed for Boost Request modal)
CREATE POLICY "Authenticated users can read campaign types" ON public.campaign_types FOR SELECT USING (auth.role() = 'authenticated');

-- Add to realtime publication
alter publication supabase_realtime add table public.campaign_types;
alter publication supabase_realtime add table public.app_settings;
