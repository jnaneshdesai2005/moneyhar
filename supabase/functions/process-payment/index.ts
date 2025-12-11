import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { receiverPhone, amount, category, description } = await req.json();
    
    console.log('Processing payment:', { receiverPhone, amount, category, description });

    // Validate input
    if (!receiverPhone || !amount || amount <= 0) {
      throw new Error('Invalid payment details');
    }

    // Get sender's profile
    const { data: senderProfile, error: senderError } = await supabaseClient
      .from('profiles')
      .select('balance')
      .eq('id', user.id)
      .single();

    if (senderError || !senderProfile) {
      throw new Error('Sender profile not found');
    }

    // Check if sender has sufficient balance
    if (senderProfile.balance < amount) {
      throw new Error('Insufficient balance');
    }

    // Get receiver's profile
    const { data: receiverProfile, error: receiverError } = await supabaseClient
      .from('profiles')
      .select('id, balance')
      .eq('phone', receiverPhone)
      .single();

    if (receiverError || !receiverProfile) {
      throw new Error('Receiver not found');
    }

    if (receiverProfile.id === user.id) {
      throw new Error('Cannot send money to yourself');
    }

    // Deduct from sender
    const { error: senderUpdateError } = await supabaseClient
      .from('profiles')
      .update({ balance: senderProfile.balance - amount })
      .eq('id', user.id);

    if (senderUpdateError) {
      console.error('Sender update error:', senderUpdateError);
      throw new Error('Failed to deduct from sender');
    }

    // Add to receiver
    const { error: receiverUpdateError } = await supabaseClient
      .from('profiles')
      .update({ balance: receiverProfile.balance + amount })
      .eq('id', receiverProfile.id);

    if (receiverUpdateError) {
      console.error('Receiver update error:', receiverUpdateError);
      // Rollback sender balance
      await supabaseClient
        .from('profiles')
        .update({ balance: senderProfile.balance })
        .eq('id', user.id);
      throw new Error('Failed to credit receiver');
    }

    // Create transaction record
    const { error: transactionError } = await supabaseClient
      .from('transactions')
      .insert({
        sender_id: user.id,
        receiver_id: receiverProfile.id,
        amount,
        category: category || 'Other',
        description,
      });

    if (transactionError) {
      console.error('Transaction record error:', transactionError);
      // Note: Balance already transferred, but transaction record failed
      // In production, this should be handled with proper transaction management
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Payment processed successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Payment error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
