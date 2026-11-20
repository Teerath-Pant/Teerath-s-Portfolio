// Pure helpers, no imports, so they can be unit-tested with plain node.

const isGmail = (host: string) => /(^|\.)(gmail|googlemail)\.com$/i.test(host.trim())

/** Gmail shows app passwords as "abcd efgh ijkl mnop"; the spaces are not part of the password. */
export function cleanCredentials(host: string, user: string, pass: string) {
  return { user: user.trim(), pass: isGmail(host) ? pass.replace(/\s+/g, '') : pass.trim() }
}

/** Says what looks wrong without ever revealing the values (this text is shown in the admin panel). */
export function credentialHint(host: string, user: string, pass: string): string {
  const { user: u, pass: p } = cleanCredentials(host, user, pass)
  const hints: string[] = []
  if (!u.includes('@')) hints.push('SMTP_USER should be the full email address')
  if (isGmail(host) && p.length !== 16) hints.push('a Gmail app password has exactly 16 characters')
  return hints.length ? ` (hint: ${hints.join('; ')})` : ''
}
