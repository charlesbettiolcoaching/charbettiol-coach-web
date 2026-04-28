const DEFAULT_ALLOWED_EMAILS = [
  'charlesbettiol@gmail.com',
  'charlesbettiolbusiness@gmail.com',
  'charlesbettiolcoaching@gmail.com',
]

export function missionControlAllowedEmails() {
  const configured = process.env.MISSION_CONTROL_ALLOWED_EMAILS
    ?.split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean)

  return new Set(configured?.length ? configured : DEFAULT_ALLOWED_EMAILS)
}

export function isMissionControlAllowedEmail(email) {
  if (!email) return false
  return missionControlAllowedEmails().has(email.toLowerCase())
}
