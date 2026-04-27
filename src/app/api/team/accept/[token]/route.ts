export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

/**
 * POST /api/team/accept/:token
 *
 * Accept a pending team invitation. Called from the register/login flow
 * after an invitee signs in via the link in their invite email.
 *
 * Behaviour:
 *   1. Require authed session (the invitee must be logged in).
 *   2. Look up the invitation by token (= invitation row id).
 *   3. Verify: invitation is pending, not expired, and email matches
 *      the authed user's email (prevents hijacked invites).
 *   4. Insert a team_members row (role: 'coach' or 'admin' per invite).
 *   5. Mark the invitation as 'accepted'.
 *   6. Re-check seat cap — if the Scale owner's team has already been
 *      filled by other concurrent invitations, reject and leave the
 *      invitation in 'pending' so they can retry if someone else drops.
 */

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase env vars')
  return createAdmin(url, key)
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { token: string } },
) {
  const supabase = createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user || !user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = adminClient()

  // Look up the invitation by token (we used the id as the token in /invite).
  const { data: invite, error: fetchErr } = await admin
    .from('team_invitations')
    .select('id, team_id, email, status, expires_at, invited_by')
    .eq('id', params.token)
    .maybeSingle()

  if (fetchErr || !invite) {
    return NextResponse.json({ error: 'INVITE_NOT_FOUND' }, { status: 404 })
  }
  if (invite.status !== 'pending') {
    return NextResponse.json({ error: 'INVITE_ALREADY_USED', status: invite.status }, { status: 409 })
  }
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    // Mark it as expired so the owner's UI shows accurate state.
    await admin.from('team_invitations').update({ status: 'expired' }).eq('id', invite.id)
    return NextResponse.json({ error: 'INVITE_EXPIRED' }, { status: 410 })
  }
  // Guard against token hijack — the email on the invite must match the
  // authed user's email.
  if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
    return NextResponse.json({
      error: 'INVITE_EMAIL_MISMATCH',
      message: 'This invite was sent to a different email. Sign in with the invited address.',
    }, { status: 403 })
  }

  // Seat cap re-check — multiple invites can be outstanding; the team could
  // be full by the time this one accepts.
  const { data: team } = await admin
    .from('teams')
    .select('max_coaches')
    .eq('id', invite.team_id)
    .maybeSingle()
  const cap = team?.max_coaches ?? 5
  const { count: currentMembers } = await admin
    .from('team_members')
    .select('*', { count: 'exact', head: true })
    .eq('team_id', invite.team_id)
  if ((currentMembers ?? 0) >= cap) {
    return NextResponse.json({
      error: 'TEAM_SEAT_CAP_REACHED',
      message: `This team already has ${currentMembers} of ${cap} seats filled.`,
    }, { status: 409 })
  }

  // Insert the membership row.
  const { error: memberErr } = await admin
    .from('team_members')
    .insert({
      team_id: invite.team_id,
      coach_id: user.id,
      role: 'coach',  // owner-invites default to coach; admin promotion is a separate action
    })
  if (memberErr) {
    // If it's a uniqueness violation the coach is already a member — surface that cleanly.
    if (String(memberErr.message).toLowerCase().includes('duplicate')) {
      return NextResponse.json({ error: 'ALREADY_MEMBER', message: 'You are already on this team.' }, { status: 409 })
    }
    return NextResponse.json({ error: memberErr.message }, { status: 500 })
  }

  // Mark the invitation accepted.
  await admin
    .from('team_invitations')
    .update({ status: 'accepted' })
    .eq('id', invite.id)

  return NextResponse.json({ accepted: true, teamId: invite.team_id })
}
