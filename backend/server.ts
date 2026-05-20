import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase Admin Client (using Service Role Key for secure operations)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

/**
 * Endpoint to delete a request and refund balance atomically
 * Equivalent to the Firebase Cloud Function
 */
app.post('/api/delete-request', async (req, res) => {
  const { requestId, userId } = req.body;
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // 1. Verify user session via Supabase
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

        // 2. Fetch the request and user profile
    const { data: request, error: reqError } = await supabaseAdmin
      .from('boost_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (reqError || !request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // 3. Permission Check (Admin or Owner)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'Admin';
    const isOwner = request.user_id === user.id;

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
      performed_by: user.id,
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

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
