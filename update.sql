-- 1. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications (read status)" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can read admin notifications" ON public.notifications FOR SELECT USING (user_id IS NULL AND public.is_admin());
CREATE POLICY "Admins can update admin notifications" ON public.notifications FOR UPDATE USING (user_id IS NULL AND public.is_admin());
CREATE POLICY "Admins can insert any notification" ON public.notifications FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Authenticated users can insert admin notifications" ON public.notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 2. ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read announcements" ON public.announcements FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage announcements" ON public.announcements FOR ALL USING (public.is_admin());

-- 3. ENABLE REALTIME
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.announcements;

-- 4. AUTOMATED TRIGGERS
CREATE OR REPLACE FUNCTION public.notify_admin_new_boost() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (NULL, 'New Boost Request', NEW.username || ' requested a ' || NEW.platform || ' boost for $' || NEW.budget, 'boost_created');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_boost_request ON public.boost_requests;
CREATE TRIGGER on_new_boost_request AFTER INSERT ON public.boost_requests FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_boost();

CREATE OR REPLACE FUNCTION public.notify_user_boost_status() RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'Pending' AND NEW.status != 'Pending' THEN
        INSERT INTO public.notifications (user_id, title, message, type)
        VALUES (NEW.user_id, 'Boost Request ' || NEW.status, 'Your ' || NEW.platform || ' boost request has been ' || lower(NEW.status) || '.', 'boost_' || lower(NEW.status));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_boost_status_change ON public.boost_requests;
CREATE TRIGGER on_boost_status_change AFTER UPDATE ON public.boost_requests FOR EACH ROW EXECUTE FUNCTION public.notify_user_boost_status();

CREATE OR REPLACE FUNCTION public.notify_admin_new_balance() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (NULL, 'New Balance Load', NEW.username || ' requested a balance load of Rs.' || NEW.amount_npr, 'balance_requested');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_balance_request ON public.balance_requests;
CREATE TRIGGER on_new_balance_request AFTER INSERT ON public.balance_requests FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_balance();

CREATE OR REPLACE FUNCTION public.notify_user_balance_status() RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'Pending' AND NEW.status != 'Pending' THEN
        INSERT INTO public.notifications (user_id, title, message, type)
        VALUES (NEW.user_id, 'Balance Request ' || NEW.status, 'Your request for $' || NEW.amount || ' has been ' || lower(NEW.status) || '.', 'balance_' || lower(NEW.status));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_balance_status_change ON public.balance_requests;
CREATE TRIGGER on_balance_status_change AFTER UPDATE ON public.balance_requests FOR EACH ROW EXECUTE FUNCTION public.notify_user_balance_status();
