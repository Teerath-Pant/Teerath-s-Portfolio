// HTML emails for the contact form: one to the site owner, one confirmation to the visitor.
// Email clients ignore most CSS, so this is table layout with inline styles only.
// Everything a visitor typed goes through esc(): it can never become markup or a link.
// Keep this file free of imports and of non-erasable TypeScript so scripts/preview-email.mjs can load it directly.

export type ContactEmailInput = {
  name: string
  email: string
  message: string
  receivedAt: Date
  adminUrl?: string // link to the admin panel, optional
}

export type VisitorEmailInput = {
  name: string
  siteUrl?: string // link back to the portfolio, optional
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

const oneLine = (s: string) => s.replace(/\s+/g, ' ').trim()

const BG = '#0b1220'
const CARD = '#111a2e'
const BORDER = '#22304a'
const TEXT = '#e2e8f0'
const MUTED = '#94a3b8'
const ACCENT = '#4f8ef7'
const ACCENT2 = '#818cf8'
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"

const gradient = (deg: number) => `background:${ACCENT};background-image:linear-gradient(${deg}deg,${ACCENT},${ACCENT2});`

const button = (href: string, label: string) => `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td align="center" bgcolor="${ACCENT}" style="border-radius:12px;${gradient(135)}">
              <a href="${esc(href)}" style="display:inline-block;padding:13px 24px;font-family:${FONT};font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px;">${label}</a>
            </td>
          </tr></table>`

// Shared frame: eyebrow, gradient bar, card with heading/sub, then the caller's rows, then footer.
function layout(o: { title: string; preheader: string; eyebrow: string; heading: string; sub: string; rows: string; footer: string }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${esc(o.title)}</title>
</head>
<body style="margin:0;padding:0;background:${BG};">
<span style="display:none !important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;max-height:0;overflow:hidden;mso-hide:all;">${esc(o.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BG};">
<tr><td align="center" style="padding:32px 14px;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">

    <tr><td style="padding:0 6px 14px 6px;font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:2.4px;color:${MUTED};text-transform:uppercase;">
      ${o.eyebrow}
    </td></tr>

    <tr><td style="background:${CARD};border:1px solid ${BORDER};border-radius:20px;overflow:hidden;">

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td height="5" style="height:5px;line-height:5px;font-size:0;${gradient(90)}">&nbsp;</td></tr>

        <tr><td style="padding:28px 28px 8px 28px;font-family:${FONT};">
          <div style="font-size:22px;line-height:1.3;font-weight:800;color:#ffffff;">${o.heading}</div>
          <div style="margin-top:6px;font-size:14px;line-height:1.5;color:${MUTED};">${o.sub}</div>
        </td></tr>
${o.rows}
      </table>

    </td></tr>

    <tr><td align="center" style="padding:16px 8px 0 8px;font-family:${FONT};font-size:11px;line-height:1.6;color:#64748b;">
      ${o.footer}
    </td></tr>

  </table>

</td></tr>
</table>
</body>
</html>`
}

// ── 1. To the site owner: "you have a new message" ──
export function renderContactEmail(input: ContactEmailInput) {
  const name = oneLine(input.name)
  const email = input.email.trim()
  const message = input.message.trim()
  const firstName = name.split(' ')[0]
  const initial = Array.from(name)[0]?.toUpperCase() ?? '?'
  const when =
    new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(input.receivedAt) + ' IST'
  const subject = `New message from ${name} on your portfolio`
  const replyHref = `mailto:${email}?subject=${encodeURIComponent('Re: your message on my portfolio')}`

  const text = [
    `New message from ${name}`,
    `${email} · ${when}`,
    '',
    message,
    '',
    `Reply to this email to answer ${firstName} directly.`,
    input.adminUrl ? `All messages: ${input.adminUrl}` : '',
  ]
    .filter((l, i, a) => l !== '' || a[i - 1] !== '')
    .join('\n')

  const rows = `
        <tr><td style="padding:18px 28px 0 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0d1526;border:1px solid ${BORDER};border-radius:14px;">
            <tr>
              <td width="44" valign="middle" style="padding:14px 0 14px 14px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                  <td width="44" height="44" align="center" valign="middle" style="width:44px;height:44px;border-radius:22px;${gradient(135)}font-family:${FONT};font-size:18px;font-weight:800;color:#ffffff;">${esc(initial)}</td>
                </tr></table>
              </td>
              <td valign="middle" style="padding:14px 14px 14px 14px;font-family:${FONT};">
                <div style="font-size:16px;font-weight:700;color:#ffffff;line-height:1.3;">${esc(name)}</div>
                <div style="font-size:13px;line-height:1.5;"><a href="mailto:${esc(email)}" style="color:${ACCENT};text-decoration:none;">${esc(email)}</a></div>
                <div style="font-size:12px;color:${MUTED};line-height:1.5;">${esc(when)}</div>
              </td>
            </tr>
          </table>
        </td></tr>

        <tr><td style="padding:20px 28px 0 28px;font-family:${FONT};">
          <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:${MUTED};text-transform:uppercase;padding-bottom:8px;">Message</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="4" style="width:4px;${gradient(180)}border-radius:4px;">&nbsp;</td>
              <td style="padding:2px 0 2px 16px;font-size:16px;line-height:1.7;color:${TEXT};word-break:break-word;">${esc(message).replace(/\r?\n/g, '<br>')}</td>
            </tr>
          </table>
        </td></tr>

        <tr><td align="left" style="padding:28px 28px 8px 28px;font-family:${FONT};">
          ${button(replyHref, `Reply to ${esc(firstName)} &rarr;`)}
        </td></tr>

        <tr><td style="padding:12px 28px 28px 28px;font-family:${FONT};font-size:12px;line-height:1.6;color:${MUTED};">
          Or just hit <strong style="color:${TEXT};">Reply</strong> on this email: it goes straight to ${esc(email)}.${
            input.adminUrl
              ? `<br><a href="${esc(input.adminUrl)}" style="color:${ACCENT};text-decoration:none;">Open all messages in the admin panel</a>`
              : ''
          }
        </td></tr>`

  const html = layout({
    title: subject,
    preheader: oneLine(`${name}: ${message}`).slice(0, 110),
    eyebrow: 'Portfolio &middot; Contact form',
    heading: 'You have a new message',
    sub: 'Someone just reached out through your portfolio.',
    rows,
    footer: "Sent automatically by your portfolio's contact form.",
  })
  return { subject, html, text }
}

// ── 2. To the visitor: "I got your message" ──
// Deliberately contains none of the visitor's message text: only their first name (cut short),
// so the form cannot be abused to push arbitrary text at someone else's inbox.
export function renderVisitorEmail(input: VisitorEmailInput) {
  const first = Array.from(oneLine(input.name).split(' ')[0] ?? '').slice(0, 30).join('')
  const hello = first ? `Thanks, ${first}!` : 'Thanks for reaching out!'
  const subject = 'Thanks for your message'

  const text = [
    hello,
    '',
    'I received your message through my portfolio and I will reply to this email address as soon as I can.',
    '',
    "Didn't send a message? You can safely ignore this email.",
    input.siteUrl ? `\n${input.siteUrl}` : '',
  ].join('\n')

  const rows = `
        <tr><td style="padding:18px 28px 0 28px;font-family:${FONT};font-size:16px;line-height:1.7;color:${TEXT};">
          I received your message through my portfolio and I will reply to this email address as soon as I can.
        </td></tr>${
          input.siteUrl
            ? `
        <tr><td align="left" style="padding:24px 28px 8px 28px;font-family:${FONT};">
          ${button(input.siteUrl, 'Back to the portfolio &rarr;')}
        </td></tr>`
            : ''
        }
        <tr><td style="padding:16px 28px 28px 28px;font-family:${FONT};font-size:12px;line-height:1.6;color:${MUTED};">
          Didn't send a message? You can safely ignore this email.
        </td></tr>`

  const html = layout({
    title: subject,
    preheader: 'I got your message and will reply soon.',
    eyebrow: 'Portfolio &middot; Message received',
    heading: esc(hello),
    sub: 'Your message is on its way to me.',
    rows,
    footer: 'This is an automatic confirmation. Just reply to this email to continue the conversation.',
  })
  return { subject, html, text }
}
