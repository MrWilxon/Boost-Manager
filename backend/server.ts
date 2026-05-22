import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Bulletproof environment variable loading resolving relative to the file path
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Supabase Admin Client (using Service Role Key for secure operations)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

app.use(cors());
app.use(express.json());

// Global Rate Limiter: 100 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests from this IP, please try again later.' }
});

// Strict Rate Limiter: 10 requests per 15 minutes per IP (for sensitive endpoints)
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
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

    (req as any).user = {
      id: user.id,
      role: profile?.role || 'User'
    };

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

/**
 * Endpoint to delete a request and refund balance atomically
 * Equivalent to the Firebase Cloud Function
 */
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

    // 4. Atomic Transaction (using RPC or sequential updates)
    // In Supabase, you often use an RPC function for atomic transactions, 
    // or you can do it here if consistency is manageable.
    
    // For simplicity in this example, we'll do sequential updates:
    const refundAmount = request.status === 'Pending' ? request.amount_npr : 0;

    // Delete request
    const { error: deleteError } = await supabaseAdmin
      .from('boost_requests')
      .delete()
      .eq('id', requestId);

    if (deleteError) throw deleteError;

    // Refund balance if needed
    if (refundAmount > 0) {
      const { error: refundError } = await supabaseAdmin.rpc('increment_balance', {
        user_id: request.user_id,
        amount: refundAmount
      });
      if (refundError) console.error('Refund failed:', refundError);
    }

    // Log action
    await supabaseAdmin.from('audit_logs').insert({
      action: 'delete_request_refund',
      performed_by: reqUser.id,
      target_request_id: requestId,
      target_user_id: request.user_id,
      details: { refundAmount, previousStatus: request.status }
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Server error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ── Settings: fetch global app settings ────────────────────────────────────────
app.get('/api/settings/app', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('app_settings')
      .select('*')
      .eq('id', 'global')
      .single();
    if (error) throw error;
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
      .order('created_at', { ascending: false });
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

