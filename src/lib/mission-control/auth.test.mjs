import assert from 'node:assert/strict'
import { isMissionControlAllowedEmail, missionControlAllowedEmails } from './auth.mjs'

{
  delete process.env.MISSION_CONTROL_ALLOWED_EMAILS
  assert.equal(isMissionControlAllowedEmail('charlesbettiol@gmail.com'), true)
  assert.equal(isMissionControlAllowedEmail('CHARLESBETTIOL@GMAIL.COM'), true)
  assert.equal(isMissionControlAllowedEmail('charlesbettiolbusiness@gmail.com'), true)
  assert.equal(isMissionControlAllowedEmail('someone@example.com'), false)
}

{
  process.env.MISSION_CONTROL_ALLOWED_EMAILS = 'one@example.com, TWO@example.com '
  const allowed = missionControlAllowedEmails()
  assert.equal(allowed.has('one@example.com'), true)
  assert.equal(allowed.has('two@example.com'), true)
  assert.equal(isMissionControlAllowedEmail('charlesbettiol@gmail.com'), false)
  assert.equal(isMissionControlAllowedEmail('two@example.com'), true)
}

delete process.env.MISSION_CONTROL_ALLOWED_EMAILS
console.log('mission-control auth ok')
