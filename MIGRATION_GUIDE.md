# Boost Manager Migration Guide

This guide outlines the steps to migrate Boost Manager from Firebase to a modern stack: **Vercel (Frontend)**, **Render (Backend)**, and **Supabase (Database & Auth)**.

## Phase 1: Supabase Setup (Database & Auth)

1. **Create Supabase Project:**
   - Sign up at [supabase.com](https://supabase.com).
   - Create a new project named "Boost Manager".

2. **Database Schema:**
   Run the following SQL in the Supabase SQL Editor to create the necessary tables:

   ```sql
   -- Users/Profiles Table (Linked to Auth)
   create table public.profiles (
     id uuid references auth.users on delete cascade primary key,
     email text unique,
     full_name text,
     role text default 'User' check (role in ('User', 'Admin')),
     balance numeric default 0,
     created_at timestamp with time zone default timezone('utc'::text, now()) not null
   );

   -- Boost Requests
   create table public.requests (
     id uuid default gen_random_uuid() primary key,
     user_id uuid references public.profiles(id) on delete cascade not null,
     status text default 'Pending' check (status in ('Pending', 'Approved', 'Rejected', 'Completed')),
     ad_platform text,
     ad_type text,
     amount_npr numeric,
     target_url text,
     description text,
     created_at timestamp with time zone default timezone('utc'::text, now()) not null
   );

   -- Audit Logs
   create table public.audit_logs (
     id uuid default gen_random_uuid() primary key,
     action text not null,
     performed_by uuid references public.profiles(id),
     target_request_id uuid,
     target_user_id uuid,
     details jsonb,
     timestamp timestamp with time zone default timezone('utc'::text, now()) not null
   );

   -- Trigger to create profile on sign up
   create function public.handle_new_user()
   returns trigger as $$
   begin
     insert into public.profiles (id, email, full_name)
     values (new.id, new.email, new.raw_user_meta_data->>'full_name');
     return new;
   end;
   $$ language plpgsql security definer;

   create trigger on_auth_user_created
     after insert on auth.users
     for each row execute procedure public.handle_new_user();

   -- Atomic Balance Increment Function
   create or replace function public.increment_balance(user_id uuid, amount numeric)
   returns void as $$
   begin
     update public.profiles
     set balance = balance + amount
     where id = user_id;
   end;
   $$ language plpgsql security definer;
   ```

3. **API Keys:**
   - Go to **Project Settings -> API**.
   - Note down `Project URL`, `anon` key, and `service_role` key (keep this secret!).

---

## Phase 2: Backend Setup (Render)

1. **Create a new repository** for the backend (or use a subdirectory in your main repo).
2. **Server Implementation (Express):**
   Create a `server.js` (or `.ts`) that handles complex logic like the refund deletion.
3. **Environment Variables on Render:**
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `PORT=3000`
4. **Deploy to Render:**
   - Link your GitHub repo to Render.
   - Set the build command to `npm install` and start command to `node server.js`.

---

## Phase 3: Frontend Setup (Vercel)

1. **Environment Variables on Vercel:**
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_BACKEND_URL` (URL of your Render service)

2. **Refactor Code:**
   - Switch from `firebase` SDK to `@supabase/supabase-js`.
   - Update `AuthContext` to use Supabase Auth.
   - Update `Dashboard` and other pages to query Supabase instead of Firestore.

3. **Deploy:**
   - Connect your GitHub repo to Vercel.
   - Vercel will automatically detect the Vite project and deploy it.
