// Usage: npm run preview-email
// Writes email-preview.html (email to you) and email-preview-visitor.html (confirmation to the visitor).
// Open them in a browser. Sample data includes hostile input to check the escaping. Nothing is sent.
import { writeFileSync } from 'node:fs'
import { renderContactEmail, renderVisitorEmail } from '../src/emailTemplate.ts'

const owner = renderContactEmail({
  name: 'Aarav Sharma',
  email: 'aarav@example.com',
  message:
    'Hi Teerath,\n\nI saw your portfolio and loved the projects page. We are building a small SaaS dashboard and need a React developer for 2 months.\n\nCould we talk this week? <script>alert("hacked")</script> https://not-a-real-link.example',
  receivedAt: new Date(),
  adminUrl: 'https://teerath-admin.vercel.app',
})
const visitor = renderVisitorEmail({ name: 'Aarav Sharma', siteUrl: 'https://teerath-portfolio.vercel.app' })

writeFileSync('email-preview.html', owner.html)
writeFileSync('email-preview-visitor.html', visitor.html)
console.log('Owner email   subject:', owner.subject)
console.log('Visitor email subject:', visitor.subject)
console.log('\n--- visitor plain-text version ---\n' + visitor.text)
console.log('\nWrote email-preview.html and email-preview-visitor.html: open them in your browser.')
