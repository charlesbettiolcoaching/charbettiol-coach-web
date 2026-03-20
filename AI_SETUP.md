# AI Coach Messaging — Setup Guide

## 1. Environment Variables

Add the following to your `.env.local` (and to the Vercel dashboard under Project Settings > Environment Variables):

```
# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# AI Coach webhook protection (generate any random string, e.g. openssl rand -hex 32)
AI_WEBHOOK_SECRET=your-random-secret-here

# Vercel cron protection (generate any random string, e.g. openssl rand -hex 32)
CRON_SECRET=your-random-cron-secret-here

# Your deployed site URL (no trailing slash)
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
```

## 2. Database Migration

Run the contents of `src/lib/supabase/ai_coach.sql` in the **Supabase SQL Editor** (Dashboard > SQL Editor > New query).

This creates:
- `coach_ai_profiles` — stores the AI persona config per coach (bio, tone, sample messages)
- `ai_mode_sessions` — tracks when AI mode is active for a coach/client pair
- `coach_notifications` — in-app notifications delivered to the coach (e.g. AI summaries)
- Adds `is_ai_generated` and `ai_session_id` columns to the existing `messages` table

## 3. Supabase Database Webhook

In the Supabase Dashboard go to **Database > Webhooks** and create a new webhook:

| Field | Value |
|---|---|
| Name | `ai-coach-respond` |
| Table | `messages` |
| Events | `INSERT` |
| Method | `POST` |
| URL | `https://your-app.vercel.app/api/ai-coach/respond` |
| HTTP Headers | `x-webhook-secret: <your AI_WEBHOOK_SECRET value>` |

This fires every time a new message is inserted. The route will check for an active AI session and respond automatically if one is found.

## 4. How It Works

1. **Coach activates AI mode** for a client — insert a row into `ai_mode_sessions` with `is_active = true` and `ends_at` set to the desired end date.
2. **Client sends a message** — Supabase fires the webhook to `/api/ai-coach/respond`.
3. **Route handler** fetches context (coach persona, client profile, check-ins, meal plan, program, message history), calls Claude, and inserts the AI response into `messages` as the coach.
4. **Session expires** — the hourly Vercel cron job (`/api/cron/ai-coach-expiry`) detects expired sessions and calls `/api/ai-coach/summarise`.
5. **Summary generated** — Claude summarises the full conversation and a notification is inserted into `coach_notifications` for the coach to review.

## 5. Coach AI Profile Setup

To configure a coach's AI persona, insert a row into `coach_ai_profiles`:

```sql
INSERT INTO coach_ai_profiles (coach_id, bio, tone_keywords, sample_messages)
VALUES (
  '<coach-uuid>',
  'Experienced strength and nutrition coach focused on sustainable results.',
  ARRAY['direct', 'encouraging', 'evidence-based'],
  '[{"content": "Great work today! How are you feeling after that session?"}, {"content": "Remember to hit your protein today — aim for that 150g target."}]'
);
```
