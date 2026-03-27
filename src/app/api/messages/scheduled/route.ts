export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Lazy initialization — only evaluated at request time, not during build.
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Missing Supabase env vars")
  return createClient(url, key)
}

      }

      // Send push notification
      await sendPushNotification(client_id, 'New Message', content.substring(0, 50) + '...');

      // Update scheduled message status
      const { error: updateError } = await supabase
        .from('scheduled_messages')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;

      return { success: true };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to process scheduled message:`, errorMessage);

    // Mark as failed
    try {
      await supabase
        .from('scheduled_messages')
        .update({
          status: 'failed',
        })
        .eq('id', message.id);
    } catch (updateError) {
      console.error('Failed to mark message as failed:', updateError);
    }

    return { success: false, error: errorMessage };
  }
}

/**
 * GET /api/messages/scheduled
 * Health check endpoint
 */
export async function GET(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin()
  if (!verifyAuthToken(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    status: 'ready',
    message: 'POST to process scheduled messages',
  });
}

/**
 * POST /api/messages/scheduled
 * Process pending scheduled messages
 * Protected by CRON_SECRET bearer token
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    if (!verifyAuthToken(request)) {
      console.warn('Unauthorized attempt to process scheduled messages');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch pending scheduled messages due now or in the past
    const now = new Date().toISOString();

    const { data: pendingMessages, error: fetchError } = await supabase
      .from('scheduled_messages')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', now)
      .order('scheduled_at', { ascending: true })
      .limit(100); // Process max 100 messages per cron run

    if (fetchError) {
      console.error('Database error fetching pending messages:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch pending messages' },
        { status: 500 }
      );
    }

    if (!pendingMessages || pendingMessages.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        message: 'No pending messages to process',
      });
    }

    // Process each scheduled message
    const results = await Promise.allSettled(
      pendingMessages.map((msg) => processScheduledMessage(msg))
    );

    const successCount = results.filter((r) => r.status === 'fulfilled' && r.value.success).length;
    const failureCount = results.filter((r) => r.status === 'rejected' || !r.value.success).length;

    return NextResponse.json({
      success: true,
      processed: pendingMessages.length,
      succeeded: successCount,
      failed: failureCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Unexpected error in scheduled messages processor:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Example cron job configuration for Vercel:
 *
 * In vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/messages/scheduled",
 *     "schedule": "0 9 * * *"
 *   }]
 * }
 *
 * Example cron job configuration for other platforms:
 *
 * Using an external service (e.g., Upstash, EasyCron):
 * - POST to: https://your-domain.com/api/messages/scheduled
 * - Headers: Authorization: Bearer YOUR_CRON_SECRET
 * - Frequency: Every 5 minutes (or your preferred interval)
 *
 * The CRON_SECRET should be a strong, random string:
 * - Add to .env.local: CRON_SECRET=your-secret-key
 * - Add to production environment variables in your deployment platform
 */
