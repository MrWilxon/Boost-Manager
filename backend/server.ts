import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import compression from 'compression';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Bulletproof environment variable loading resolving relative to the file path
dotenv.config({ path: path.join(__dirname, '.env') });

// Memory Caches for performance optimization
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes
const authCache = new Map<string, { user: any, expiresAt: number }>();
let globalSettingsCache: { data: any, expiresAt: number } | null = null;

// Prevent memory leak by periodically sweeping expired tokens from authCache
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of authCache.entries()) {
    if (value.expiresAt <= now) {
      authCache.delete(key);
    }
  }
}, 5 * 60 * 1000); // Sweep every 5 minutes

const app = express();
app.set('trust proxy', 1); // Trust first proxy for correct IP in rate limiting
const PORT = process.env.PORT || 5000;

// Supabase Admin Client (using Service Role Key for secure operations)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

app.use(compression());
// Secure CORS Configuration
const allowedOrigins = [
  'http://localhost:3000',
  'https://boost-manager-one.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean) as string[];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`Blocked by CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Global Rate Limiter: 5000 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
  message: { error: 'Too many requests from this IP, please try again later.' }
});

// Strict Rate Limiter: 50 requests per 15 minutes per IP (for sensitive endpoints)
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'Strict limit exceeded. Try again later.' }
});

app.use('/api/', globalLimiter);
app.use('/api/delete-request', strictLimiter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Middleware to validate Supabase JWT and fetch user role
const authMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const now = Date.now();

    // 1. Check Cache first
    const cachedAuth = authCache.get(token);
    if (cachedAuth && cachedAuth.expiresAt > now) {
      (req as any).user = cachedAuth.user;
      return next();
    }

    // 2. Fetch from Supabase if not cached
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.warn('⚠️ Authentication failed (Invalid Token):', authError?.message || 'User object is null');
      return res.status(401).json({ 
        error: 'Unauthorized: Invalid token', 
        details: authError?.message || 'User object is null' 
      });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('❌ Profile fetch failed for user ID:', user.id, 'Error:', profileError.message);
      return res.status(401).json({ 
        error: 'Unauthorized: Profile not found', 
        details: profileError.message 
      });
    }

    const userData = {
      id: user.id,
      role: profile?.role || 'User'
    };

    // Store in cache
    authCache.set(token, { user: userData, expiresAt: now + CACHE_TTL_MS });
    (req as any).user = userData;

    next();
  } catch (error: any) {
    console.error('🔥 Auth middleware exception:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error during authentication', 
      details: error.message, 
      stack: error.stack 
    });
  }
};

/**
 * Endpoint to safely fetch a user profile bypassing RLS recursion
 */
app.get('/api/profile/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const reqUser = (req as any).user;

    // Users can only fetch their own profile unless they are Admin
    if (reqUser.role !== 'Admin' && reqUser.id !== id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Proxy for Boost Requests
app.get('/api/dashboard/boost-requests', authMiddleware, async (req, res) => {
  try {
    const { page = '1', limit = '10', scope = 'personal' } = req.query;
    const reqUser = (req as any).user;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    
    let query = supabaseAdmin
      .from('boost_requests')
      .select('*', { count: 'exact' });
      
    if (reqUser.role !== 'Admin' || scope === 'personal') {
      query = query.eq('user_id', reqUser.id);
    }
    
    query = query
      .order('created_at', { ascending: false })
      .range((pageNum - 1) * limitNum, pageNum * limitNum - 1);
      
    const { data, count, error } = await query;
    if (error) throw error;
    
    res.json({ data, count });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Proxy for Balance Requests
app.get('/api/dashboard/balance-requests', authMiddleware, async (req, res) => {
  try {
    const { scope = 'personal' } = req.query;
    const reqUser = (req as any).user;
    
    let query = supabaseAdmin
      .from('balance_requests')
      .select('*');
      
    if (reqUser.role !== 'Admin' || scope === 'personal') {
      query = query.eq('user_id', reqUser.id);
    }
    
    query = query
      .order('created_at', { ascending: false })
      .limit(100);
      
    const { data, error } = await query;
    if (error) throw error;
    
    res.json({ data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/delete-request', authMiddleware, async (req, res) => {
  const { requestId } = req.body;
  const reqUser = (req as any).user;

  try {
    // 2. Fetch the request
    const { data: request, error: reqError } = await supabaseAdmin
      .from('boost_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (reqError || !request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // 3. Permission Check (Admin or Owner)
    const isAdmin = reqUser.role === 'Admin';
    const isOwner = request.user_id === reqUser.id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // 4. Delete request (Refund and audit log are handled automatically by the DB trigger on_boost_request_deleted)
    const { error: deleteError } = await supabaseAdmin
      .from('boost_requests')
      .delete()
      .eq('id', requestId);

    if (deleteError) throw deleteError;

    res.json({ success: true });
  } catch (error: any) {
    console.error('Server error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ── Settings: fetch global app settings ────────────────────────────────────────
app.get('/api/settings/app', async (req, res) => {
  try {
    const now = Date.now();
    if (globalSettingsCache && globalSettingsCache.expiresAt > now) {
      return res.json({ data: globalSettingsCache.data });
    }

    const { data, error } = await supabaseAdmin
      .from('app_settings')
      .select('*')
      .eq('id', 'global')
      .single();
    if (error) throw error;

    globalSettingsCache = { data, expiresAt: now + CACHE_TTL_MS };
    res.json({ data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── Settings: update global app settings ───────────────────────────────────────
app.post('/api/settings/app', authMiddleware, async (req, res) => {
  try {
    const userRole = (req as any).user.user_metadata?.role || (req as any).user.role;
    if (userRole !== 'Admin') {
      return res.status(403).json({ error: 'Unauthorized. Admin access required.' });
    }

    const { exchange_rate, whatsapp_number, allowed_platforms, all_platforms, platform_rates } = req.body;
    
    // Upsert the global settings row
    const upsertData: any = {
      id: 'global',
      updated_at: new Date().toISOString()
    };
    if (exchange_rate !== undefined) upsertData.exchange_rate = exchange_rate;
    if (whatsapp_number !== undefined) upsertData.whatsapp_number = whatsapp_number;
    if (allowed_platforms !== undefined) upsertData.allowed_platforms = allowed_platforms;
    if (all_platforms !== undefined) upsertData.all_platforms = all_platforms;
    if (platform_rates !== undefined) upsertData.platform_rates = platform_rates;

    const { data, error } = await supabaseAdmin
      .from('app_settings')
      .upsert(upsertData, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    
    // Invalidate cache immediately after updating
    globalSettingsCache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
    
    res.json({ data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── Admin: fetch all profiles ──────────────────────────────────────────────────
app.get('/api/admin/profiles', authMiddleware, async (req, res) => {
  const reqUser = (req as any).user;
  if (reqUser.role !== 'Admin') {
    return res.status(403).json({ error: 'Forbidden: Admins only' });
  }
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    res.json({ data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── Admin: fetch audit logs with performer info ────────────────────────────────
app.get('/api/admin/audit-logs', authMiddleware, async (req, res) => {
  const reqUser = (req as any).user;
  if (reqUser.role !== 'Admin') {
    return res.status(403).json({ error: 'Forbidden: Admins only' });
  }
  try {
    const { data, error } = await supabaseAdmin
      .from('audit_logs')
      .select(`
        *,
        performer:profiles!audit_logs_performed_by_fkey (
          username,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    res.json({ data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});

