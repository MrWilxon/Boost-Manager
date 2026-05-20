-- BOOST MANAGER DATABASE INITIALIZATION SCHEMA

-- Drop existing views/triggers/functions if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.increment_balance(UUID, NUMERIC);

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
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

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
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

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
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

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
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

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
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- 6. AUTOMATIC PROFILE CREATION TRIGGER
-- Triggers profile record insert when standard auth.users creates account
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    isAdmin BOOLEAN;
    initialBalance NUMERIC;
BEGIN
    -- Assign Admin role for target main user
    IF new.email = 'wilxon.xtha@gmail.com' THEN
        isAdmin := true;
        initialBalance := 999999.00;
    ELSE
        isAdmin := false;
        initialBalance := 0.00;
    END IF;

    INSERT INTO public.profiles (id, email, username, role, balance)
    VALUES (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
        CASE WHEN isAdmin THEN 'Admin' ELSE 'User' END,
        initialBalance
    );
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
    IF (SELECT role FROM public.profiles WHERE id = auth.uid()) != 'Admin' THEN
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
    IF (SELECT role FROM public.profiles WHERE id = auth.uid()) != 'Admin' THEN
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
